"use client";

import { useState, useEffect } from "react";
import { collection, onSnapshot, query, orderBy, limit, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { ActivityLog, LogCategory, LogLevel } from "@/lib/activity-logger";
import { Download, Filter, RefreshCw, Search } from "lucide-react";

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<LogCategory | "all">("all");
  const [levelFilter, setLevelFilter] = useState<LogLevel | "all">("all");
  const [limitCount, setLimitCount] = useState(100);

  useEffect(() => {
    let q = query(
      collection(db, "activity_logs"),
      orderBy("timestamp", "desc"),
      limit(limitCount)
    );

    if (categoryFilter !== "all") {
      q = query(q, where("category", "==", categoryFilter));
    }

    if (levelFilter !== "all") {
      q = query(q, where("level", "==", levelFilter));
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const logsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as ActivityLog[];
        setLogs(logsData);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching logs:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [categoryFilter, levelFilter, limitCount]);

  const filteredLogs = logs.filter((log) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      log.action.toLowerCase().includes(searchLower) ||
      log.userEmail?.toLowerCase().includes(searchLower) ||
      log.userId.toLowerCase().includes(searchLower) ||
      log.metadata?.requestId?.toLowerCase().includes(searchLower)
    );
  });

  const exportToCSV = () => {
    const headers = ["Timestamp", "Category", "Level", "Action", "User", "Details"];
    const rows = filteredLogs.map((log) => [
      log.timestamp?.toDate?.()?.toLocaleString() || "N/A",
      log.category,
      log.level,
      log.action,
      log.userEmail || log.userId,
      JSON.stringify(log.details || {}),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `activity-logs-${new Date().toISOString()}.csv`;
    a.click();
  };

  const getLevelBadge = (level: LogLevel) => {
    const colors = {
      info: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      success: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      warning: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      error: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    };
    return colors[level];
  };

  const getCategoryBadge = (category: LogCategory) => {
    const colors = {
      auth: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      request: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
      locker: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
      payment: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
      rider: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
      admin: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
      system: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
    };
    return colors[category];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Activity Logs</h1>
        <p className="text-gray-600 dark:text-gray-400">
          ระบบบันทึกกิจกรรมทั้งหมดในระบบ
        </p>
      </div>

      {/* Filters and Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="ค้นหา..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as LogCategory | "all")}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            <option value="all">ทุกหมวดหมู่</option>
            <option value="auth">Authentication</option>
            <option value="request">Request</option>
            <option value="locker">Locker</option>
            <option value="payment">Payment</option>
            <option value="rider">Rider</option>
            <option value="admin">Admin</option>
            <option value="system">System</option>
          </select>

          {/* Level Filter */}
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value as LogLevel | "all")}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            <option value="all">ทุกระดับ</option>
            <option value="info">Info</option>
            <option value="success">Success</option>
            <option value="warning">Warning</option>
            <option value="error">Error</option>
          </select>

          {/* Export Button */}
          <button
            onClick={exportToCSV}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <Download className="h-5 w-5" />
            Export CSV
          </button>
        </div>

        <div className="mt-4 flex items-center gap-4">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            แสดง {filteredLogs.length} จาก {logs.length} รายการ
          </span>
          <select
            value={limitCount}
            onChange={(e) => setLimitCount(Number(e.target.value))}
            className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            <option value={50}>50 รายการ</option>
            <option value={100}>100 รายการ</option>
            <option value={200}>200 รายการ</option>
            <option value={500}>500 รายการ</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  เวลา
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  หมวดหมู่
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  ระดับ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  การกระทำ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  ผู้ใช้
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  รายละเอียด
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {log.timestamp?.toDate?.()?.toLocaleString("th-TH") || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getCategoryBadge(log.category)}`}>
                      {log.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getLevelBadge(log.level)}`}>
                      {log.level}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                    {log.action}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                    <div>{log.userEmail || "Anonymous"}</div>
                    <div className="text-xs text-gray-400 dark:text-gray-500">{log.userId}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                    <details className="cursor-pointer">
                      <summary className="font-medium text-emerald-600 dark:text-emerald-400">
                        ดูรายละเอียด
                      </summary>
                      <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-900 rounded text-xs overflow-auto max-w-md">
                        {JSON.stringify(
                          {
                            details: log.details,
                            metadata: log.metadata,
                          },
                          null,
                          2
                        )}
                      </pre>
                    </details>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredLogs.length === 0 && (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            ไม่พบข้อมูล Activity Logs
          </div>
        )}
      </div>
    </div>
  );
}
