"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, query, where } from "firebase/firestore";
import Cookies from "js-cookie";
import { auth, db } from "@/lib/firebase";
import { ROLE_COOKIE_NAME, type UserRole } from "@/lib/auth/roles";

type Request = {
  id: string;
  lockerId: string;
  status: string;
  price: number;
  createdAt: any;
  riderToken?: string;
  pickupOtp?: string;
};

export default function DashboardPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [role, setRole] = useState<UserRole | null>(null);
  const [user, setUser] = useState<any>(null);
  const [requests, setRequests] = useState<Request[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/login");
        return;
      }

      setUser(currentUser);
      const userRole = (Cookies.get(ROLE_COOKIE_NAME) as UserRole) || "user";
      setRole(userRole);

      // โหลดข้อมูลตาม role
      if (userRole === "user") {
        await loadUserRequests(currentUser.uid);
      }

      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const loadUserRequests = async (uid: string) => {
    try {
      const q = query(collection(db, "requests"), where("customerId", "==", uid));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Request[];
      setRequests(data.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds));
    } catch (error) {
      console.error("Error loading requests:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-400 border-t-transparent"></div>
          <p className="mt-4 text-sm text-slate-300">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { label: string; className: string }> = {
      paid: { label: "ชำระแล้ว", className: "bg-blue-500/10 text-blue-200" },
      in_locker: { label: "อยู่ในตู้", className: "bg-emerald-500/10 text-emerald-200" },
      completed: { label: "เสร็จสิ้น", className: "bg-slate-500/10 text-slate-200" },
    };
    const badge = badges[status] || { label: status, className: "bg-slate-500/10 text-slate-200" };
    return (
      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badge.className}`}>
        {badge.label}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      <header className="border-b border-slate-800/60 bg-slate-950/70 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-emerald-300">Dashboard</p>
            <h1 className="text-xl font-semibold">
              {role === "user" && "แดชบอร์ดผู้ใช้"}
              {role === "rider" && "แดชบอร์ดไรเดอร์"}
              {role === "admin" && "แดชบอร์ดแอดมิน"}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs text-slate-400">เข้าสู่ระบบด้วย</p>
              <p className="text-sm font-medium">{user?.email || user?.phoneNumber || "ผู้ใช้"}</p>
            </div>
            <button
              onClick={() => {
                auth.signOut();
                Cookies.remove(ROLE_COOKIE_NAME);
                router.push("/");
              }}
              className="rounded-full border border-rose-500 px-4 py-2 text-xs font-semibold text-rose-200 transition hover:bg-rose-500/10"
            >
              ออกจากระบบ
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-6 py-8">
        {/* Navigation Cards */}
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
          {role === "user" && (
            <>
              <Link
                href="/request"
                className="group rounded-3xl border border-emerald-500/20 bg-slate-900/60 p-6 transition hover:border-emerald-400"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-2xl">
                    📦
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400">ทำรายการใหม่</p>
                    <p className="text-lg font-semibold text-emerald-200">แจ้งฝากของ</p>
                  </div>
                </div>
              </Link>
              <Link
                href="/pickup"
                className="group rounded-3xl border border-slate-800 bg-slate-900/60 p-6 transition hover:border-slate-600"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-2xl">
                    🔓
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400">รับพัสดุ</p>
                    <p className="text-lg font-semibold text-blue-200">รับของ</p>
                  </div>
                </div>
              </Link>
            </>
          )}

          {role === "rider" && (
            <>
              <Link
                href="/rider/dropoff"
                className="group rounded-3xl border border-emerald-500/20 bg-slate-900/60 p-6 transition hover:border-emerald-400"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-2xl">
                    🚴
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400">งานส่งของ</p>
                    <p className="text-lg font-semibold text-emerald-200">ส่งของ</p>
                  </div>
                </div>
              </Link>
            </>
          )}

          {role === "admin" && (
            <>
              <Link
                href="/admin/dashboard"
                className="group rounded-3xl border border-emerald-500/20 bg-slate-900/60 p-6 transition hover:border-emerald-400"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-2xl">
                    📊
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400">ภาพรวม</p>
                    <p className="text-lg font-semibold text-emerald-200">Dashboard</p>
                  </div>
                </div>
              </Link>
              <Link
                href="/admin/approvals"
                className="group rounded-3xl border border-slate-800 bg-slate-900/60 p-6 transition hover:border-slate-600"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-2xl">
                    ✅
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400">อนุมัติไรเดอร์</p>
                    <p className="text-lg font-semibold text-amber-200">Approvals</p>
                  </div>
                </div>
              </Link>
            </>
          )}
        </div>

        {/* User Requests List */}
        {role === "user" && (
          <section className="mt-8">
            <h2 className="text-2xl font-semibold">รายการฝากของของคุณ</h2>
            {requests.length === 0 ? (
              <div className="mt-6 rounded-3xl border border-slate-800 bg-slate-900/60 p-12 text-center">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-slate-800/60 text-4xl">
                  📭
                </div>
                <p className="mt-4 text-slate-300">ยังไม่มีรายการฝากของ</p>
                <Link
                  href="/request"
                  className="mt-4 inline-block rounded-full bg-emerald-400 px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-emerald-300"
                >
                  สร้างรายการแรก
                </Link>
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                {requests.map((req) => (
                  <div
                    key={req.id}
                    className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold">ตู้ {req.lockerId}</h3>
                          {getStatusBadge(req.status)}
                        </div>
                        <p className="mt-2 text-sm text-slate-400">
                          Request ID: {req.id}
                        </p>
                        <p className="text-sm text-slate-400">
                          ค่าบริการ: ฿{req.price}
                        </p>
                        {req.pickupOtp && req.status === "in_locker" && (
                          <div className="mt-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 inline-block">
                            <p className="text-xs text-emerald-200">
                              รหัส OTP รับของ: <span className="font-mono text-lg font-bold">{req.pickupOtp}</span>
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        {req.status === "in_locker" && (
                          <Link
                            href="/pickup"
                            className="rounded-full bg-emerald-400 px-4 py-2 text-xs font-semibold text-slate-900 transition hover:bg-emerald-300"
                          >
                            รับของเลย
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
