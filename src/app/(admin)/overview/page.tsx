"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, query, where } from "firebase/firestore";
import Cookies from "js-cookie";
import { auth, db } from "@/lib/firebase";
import { ROLE_COOKIE_NAME, type UserRole } from "@/lib/auth/roles";
import { Package, Users, CheckCircle, XCircle, Clock, TrendingUp } from "lucide-react";

type Stats = {
  totalRequests: number;
  activeRequests: number;
  completedRequests: number;
  totalRevenue: number;
  pendingRiders: number;
  approvedRiders: number;
  rejectedRiders: number;
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    totalRequests: 0,
    activeRequests: 0,
    completedRequests: 0,
    totalRevenue: 0,
    pendingRiders: 0,
    approvedRiders: 0,
    rejectedRiders: 0,
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/auth/login");
        return;
      }

      const userRole = (Cookies.get(ROLE_COOKIE_NAME) as UserRole) || "user";
      if (userRole !== "admin") {
        router.push("/dashboard");
        return;
      }

      await loadStats();
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const loadStats = async () => {
    try {
      // Load requests stats
      const requestsSnapshot = await getDocs(collection(db, "requests"));
      const requests = requestsSnapshot.docs.map((doc) => doc.data());
      
      const totalRequests = requests.length;
      const activeRequests = requests.filter((req) => 
        req.status === "paid" || req.status === "in_locker"
      ).length;
      const completedRequests = requests.filter((req) => 
        req.status === "completed"
      ).length;
      const totalRevenue = requests.reduce((sum, req) => 
        sum + (req.price || 0) + (req.overtimeFee || 0), 0
      );

      // Load riders stats
      const ridersSnapshot = await getDocs(collection(db, "riders"));
      const riders = ridersSnapshot.docs.map((doc) => doc.data());
      
      const pendingRiders = riders.filter((r) => r.status === "pending").length;
      const approvedRiders = riders.filter((r) => r.status === "approved").length;
      const rejectedRiders = riders.filter((r) => r.status === "rejected").length;

      setStats({
        totalRequests,
        activeRequests,
        completedRequests,
        totalRevenue,
        pendingRiders,
        approvedRiders,
        rejectedRiders,
      });
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-50 via-slate-100 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-500 dark:border-emerald-400 border-t-transparent"></div>
          <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-slate-100 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-900 dark:text-white">
      <header className="border-b border-slate-200/80 dark:border-slate-800/60 bg-white/70 dark:bg-slate-950/70 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-emerald-600 dark:text-emerald-300">Admin Overview</p>
            <h1 className="text-xl font-semibold text-slate-900 dark:text-white">ภาพรวมระบบ</h1>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Total Requests */}
          <div className="rounded-2xl border border-blue-500/30 dark:border-blue-500/20 bg-white dark:bg-slate-900/60 p-5 shadow-sm dark:shadow-none">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400">รายการทั้งหมด</p>
                <p className="mt-1 text-3xl font-black text-blue-600 dark:text-blue-400">{stats.totalRequests}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/20">
                <Package className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          {/* Active Requests */}
          <div className="rounded-2xl border border-emerald-500/30 dark:border-emerald-500/20 bg-white dark:bg-slate-900/60 p-5 shadow-sm dark:shadow-none">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400">กำลังดำเนินการ</p>
                <p className="mt-1 text-3xl font-black text-emerald-600 dark:text-emerald-400">{stats.activeRequests}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20">
                <Clock className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </div>

          {/* Completed Requests */}
          <div className="rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/60 p-5 shadow-sm dark:shadow-none">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400">เสร็จสิ้น</p>
                <p className="mt-1 text-3xl font-black text-slate-700 dark:text-slate-200">{stats.completedRequests}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-500/20">
                <CheckCircle className="h-6 w-6 text-slate-600 dark:text-slate-400" />
              </div>
            </div>
          </div>

          {/* Total Revenue */}
          <div className="rounded-2xl border border-amber-500/30 dark:border-amber-500/20 bg-white dark:bg-slate-900/60 p-5 shadow-sm dark:shadow-none">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400">รายได้รวม</p>
                <p className="mt-1 text-3xl font-black text-amber-600 dark:text-amber-400">฿{stats.totalRevenue.toLocaleString()}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/20">
                <TrendingUp className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Riders Stats */}
        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">สถิติไรเดอร์</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {/* Pending Riders */}
            <div className="rounded-2xl border border-amber-500/30 dark:border-amber-500/20 bg-white dark:bg-slate-900/60 p-5 shadow-sm dark:shadow-none">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-400">รออนุมัติ</p>
                  <p className="mt-1 text-3xl font-black text-amber-600 dark:text-amber-400">{stats.pendingRiders}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/20">
                  <Clock className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
            </div>

            {/* Approved Riders */}
            <div className="rounded-2xl border border-emerald-500/30 dark:border-emerald-500/20 bg-white dark:bg-slate-900/60 p-5 shadow-sm dark:shadow-none">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-400">อนุมัติแล้ว</p>
                  <p className="mt-1 text-3xl font-black text-emerald-600 dark:text-emerald-400">{stats.approvedRiders}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20">
                  <CheckCircle className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
            </div>

            {/* Rejected Riders */}
            <div className="rounded-2xl border border-rose-500/30 dark:border-rose-500/20 bg-white dark:bg-slate-900/60 p-5 shadow-sm dark:shadow-none">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-400">ปฏิเสธ</p>
                  <p className="mt-1 text-3xl font-black text-rose-600 dark:text-rose-400">{stats.rejectedRiders}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-500/20">
                  <XCircle className="h-6 w-6 text-rose-600 dark:text-rose-400" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">การจัดการ</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Link
              href="/admin/approvals"
              className="group rounded-2xl border border-emerald-500/30 dark:border-emerald-500/20 bg-white dark:bg-slate-900/60 p-6 transition hover:border-emerald-500 dark:hover:border-emerald-400 shadow-sm dark:shadow-none"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-500/20">
                  <Users className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">อนุมัติไรเดอร์</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">จัดการคำขออนุมัติ</p>
                  {stats.pendingRiders > 0 && (
                    <span className="mt-1 inline-block rounded-full bg-amber-500 px-2 py-0.5 text-xs font-bold text-white">
                      {stats.pendingRiders} รออนุมัติ
                    </span>
                  )}
                </div>
              </div>
            </Link>

            <Link
              href="/admin/logs"
              className="group rounded-2xl border border-blue-500/30 dark:border-blue-500/20 bg-white dark:bg-slate-900/60 p-6 transition hover:border-blue-500 dark:hover:border-blue-400 shadow-sm dark:shadow-none"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-500/20">
                  <Clock className="h-7 w-7 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">ประวัติการใช้งาน</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">ดู Activity Logs</p>
                </div>
              </div>
            </Link>

            <Link
              href="/admin/manage"
              className="group rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/60 p-6 transition hover:border-slate-400 dark:hover:border-slate-600 shadow-sm dark:shadow-none"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-slate-500/20">
                  <Package className="h-7 w-7 text-slate-600 dark:text-slate-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">จัดการตู้ล็อกเกอร์</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">ตั้งค่าและจัดการ</p>
                </div>
              </div>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
