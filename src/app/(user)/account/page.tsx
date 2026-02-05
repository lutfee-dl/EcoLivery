"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import Cookies from "js-cookie";
import { auth, db } from "@/lib/firebase";
import { ROLE_COOKIE_NAME, type UserRole } from "@/lib/auth/roles";
import { User, Mail, Shield, LogOut, Package, Clock, Calendar } from "lucide-react";

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [recentRequests, setRecentRequests] = useState<any[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/auth/login");
        return;
      }

      setUser(currentUser);
      const userRole = Cookies.get(ROLE_COOKIE_NAME) as UserRole;
      setRole(userRole || "user");
      
      // Load recent requests
      await loadRecentRequests(currentUser.uid);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const loadRecentRequests = async (userId: string) => {
    try {
      const q = query(
        collection(db, "requests"),
        where("customerId", "==", userId),
        orderBy("createdAt", "desc"),
        limit(5)
      );
      const snapshot = await getDocs(q);
      const requests = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setRecentRequests(requests);
    } catch (error) {
      console.error("Error loading requests:", error);
    }
  };

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      Cookies.remove(ROLE_COOKIE_NAME);
      router.push("/");
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  const getRoleName = (roleValue: UserRole) => {
    switch (roleValue) {
      case "admin":
        return "ผู้ดูแลระบบ";
      case "rider":
        return "ไรเดอร์";
      default:
        return "ผู้ใช้งาน";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return "รอดำเนินการ";
      case "active":
      case "in_locker":
        return "กำลังใช้งาน";
      case "completed":
        return "เสร็จสิ้น";
      case "cancelled":
        return "ยกเลิก";
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "active":
      case "in_locker":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
      case "completed":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "cancelled":
        return "bg-rose-500/20 text-rose-400 border-rose-500/30";
      default:
        return "bg-slate-500/20 text-slate-400 border-slate-500/30";
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
        <div className="text-white">กำลังโหลด...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 pb-24 md:pb-8">
      <main className="mx-auto max-w-4xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">บัญชีของฉัน</h1>
          <p className="mt-2 text-slate-400">จัดการข้อมูลและดูประวัติการใช้งาน</p>
        </div>

        {/* Profile Card */}
        <div className="mb-6 rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg">
              <User className="h-10 w-10 text-slate-900" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white">
                {user?.displayName || "ผู้ใช้งาน"}
              </h2>
              <div className="mt-2 space-y-2">
                <div className="flex items-center gap-2 text-slate-300">
                  <Mail className="h-4 w-4 text-slate-500" />
                  <span className="text-sm">{user?.email || user?.phoneNumber || "ไม่มีข้อมูล"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-emerald-400" />
                  <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-400">
                    {getRoleName(role || "user")}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mb-6 rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
          <div className="mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-emerald-400" />
            <h3 className="text-xl font-bold text-white">ประวัติการจองล่าสุด</h3>
          </div>

          {recentRequests.length === 0 ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-8 text-center">
              <Package className="mx-auto h-12 w-12 text-slate-600" />
              <p className="mt-3 text-slate-400">ยังไม่มีประวัติการจอง</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentRequests.map((request) => (
                <div
                  key={request.id}
                  className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 transition hover:border-slate-700"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-slate-500" />
                        <span className="font-semibold text-white">
                          ตู้ {request.lockerId}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center gap-2 text-sm text-slate-400">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {request.createdAt?.toDate?.()?.toLocaleDateString("th-TH", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }) || "ไม่ทราบวันที่"}
                        </span>
                      </div>
                    </div>
                    <div>
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-semibold ${getStatusColor(
                          request.status
                        )}`}
                      >
                        {getStatusLabel(request.status)}
                      </span>
                    </div>
                  </div>
                  {request.price && (
                    <div className="mt-3 text-right">
                      <span className="text-lg font-bold text-emerald-400">
                        ฿{request.price}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
