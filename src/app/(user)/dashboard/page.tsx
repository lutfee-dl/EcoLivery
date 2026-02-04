"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, query, where } from "firebase/firestore";
import Cookies from "js-cookie";
import { auth, db } from "@/lib/firebase";
import { ROLE_COOKIE_NAME, type UserRole } from "@/lib/auth/roles";
import { Package, QrCode, Clock, AlertCircle } from "lucide-react";
import { useLockerLockCheck } from "@/lib/locker-lock";
import { RENTAL_PLANS, type RentalDuration } from "@/constants/rental-pricing";
import { LockerStatus } from "@/components/ui/locker-status";

type Request = {
  id: string;
  lockerId: string;
  status: string;
  price: number;
  createdAt: any;
  riderToken?: string;
  pickupOtp?: string;
  rentalDuration?: RentalDuration;
  deadline?: any;
  isLocked?: boolean;
  overtimeFee?: number;
  overtimeHours?: number;
};

export default function DashboardPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [role, setRole] = useState<UserRole | null>(null);
  const [user, setUser] = useState<any>(null);
  const [requests, setRequests] = useState<Request[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Check for success param
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === 'created') {
      setSuccessMessage('🎉 สร้างรายการจองสำเร็จ! ส่ง Token ให้ไรเดอร์เพื่อไปรับของจากคุณ');
      // Clear URL params
      window.history.replaceState({}, '', '/dashboard');
      setTimeout(() => setSuccessMessage(null), 5000);
    }
  }, []);

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
      } else if (userRole === "rider") {
        await loadRiderTasks();
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

  const loadRiderTasks = async () => {
    try {
      const q = query(collection(db, "requests"), where("status", "==", "paid"));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Request[];
      setRequests(data.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds));
    } catch (error) {
      console.error("Error loading rider tasks:", error);
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
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-6 py-8">
        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 animate-bounce rounded-2xl border-2 border-emerald-500/50 bg-emerald-500/10 p-4 text-center">
            <p className="text-sm font-semibold text-emerald-300">{successMessage}</p>
          </div>
        )}

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
                    {requests.length > 0 && (
                      <span className="mt-1 inline-block rounded-full bg-emerald-500 px-2 py-0.5 text-xs font-bold text-slate-900">
                        {requests.length} งาน
                      </span>
                    )}
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

        {/* Rider Tasks List */}
        {role === "rider" && (
          <section className="mt-8">
            <h2 className="text-2xl font-semibold">งานรอส่งของ (Pending)</h2>
            {requests.length === 0 ? (
              <div className="mt-6 rounded-3xl border border-slate-800 bg-slate-900/60 p-12 text-center">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-slate-800/60 text-4xl">
                  ✅
                </div>
                <p className="mt-4 text-slate-300">ไม่มีงานรอดำเนินการ</p>
                <p className="mt-2 text-sm text-slate-500">รีเฟรชหน้าเพื่อตรวจสอบงานใหม่</p>
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                {requests.map((req) => (
                  <div
                    key={req.id}
                    className="rounded-3xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/5 to-slate-900/60 p-6 transition hover:border-emerald-500"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20">
                            <Package className="h-6 w-6 text-emerald-400" />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold">ตู้ {req.lockerId}</h3>
                            <span className="rounded-full bg-blue-500/20 px-3 py-1 text-xs font-semibold text-blue-300">
                              รอรับของ
                            </span>
                          </div>
                        </div>
                        
                        <div className="mt-4 space-y-2 text-sm text-slate-400">
                          <p>Token: <span className="font-mono text-emerald-400">{req.riderToken}</span></p>
                          <p>ค่าบริการ: <span className="text-lg font-bold text-emerald-400">฿{req.price}</span></p>
                          {req.createdAt && (
                            <p className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {new Date(req.createdAt.seconds * 1000).toLocaleString('th-TH')}
                            </p>
                          )}
                        </div>
                      </div>

                      <Link
                        href="/rider/dropoff"
                        className="group rounded-xl bg-emerald-500 px-6 py-3 font-bold text-slate-900 transition hover:bg-emerald-400"
                      >
                        รับงาน →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

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
                    className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 transition hover:border-emerald-500/30"
                  >
                    <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                      {/* Left: Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10">
                            <Package className="h-6 w-6 text-emerald-400" />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold">ตู้ {req.lockerId}</h3>
                            {getStatusBadge(req.status)}
                          </div>
                        </div>
                        
                        <div className="mt-4 space-y-2 text-sm text-slate-400">
                          <p>Request ID: <span className="font-mono text-slate-300">{req.id}</span></p>
                          <p>ค่าบริการ: <span className="text-lg font-bold text-emerald-400">฿{req.price}</span></p>
                          {req.rentalDuration && (
                            <p>ระยะเวลาเช่า: <span className="font-semibold text-slate-300">
                              {RENTAL_PLANS[req.rentalDuration]?.label}
                            </span></p>
                          )}
                          {req.createdAt && (
                            <p className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {new Date(req.createdAt.seconds * 1000).toLocaleString('th-TH')}
                            </p>
                          )}
                        </div>

                        {/* Locker Status (Deadline & Lock) */}
                        <LockerStatus
                          requestId={req.id}
                          deadline={req.deadline}
                          rentalDuration={req.rentalDuration}
                          isLocked={req.isLocked}
                          overtimeFee={req.overtimeFee}
                          overtimeHours={req.overtimeHours}
                        />

                        {/* Token Display for Rider */}
                        {req.riderToken && req.status === "paid" && (
                          <div className="mt-4 rounded-2xl border-2 border-blue-500/50 bg-blue-500/10 p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-blue-400">
                                  Token สำหรับไรเดอร์
                                </p>
                                <p className="mt-1 font-mono text-lg font-bold text-blue-300">
                                  {req.riderToken}
                                </p>
                              </div>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(req.riderToken!);
                                  alert('คัดลอก Token แล้ว!');
                                }}
                                className="rounded-lg bg-blue-500/20 px-3 py-2 text-xs font-semibold text-blue-300 transition hover:bg-blue-500/30"
                              >
                                📋 คัดลอก
                              </button>
                            </div>
                            <p className="mt-2 text-xs text-blue-300/70">
                              💡 ส่ง Token นี้ให้ไรเดอร์เพื่อไปรับของจากคุณ
                            </p>
                          </div>
                        )}

                        {/* OTP Display - Highlight when ready */}
                        {req.pickupOtp && req.status === "in_locker" && !req.isLocked && (
                          <div className="mt-4 animate-pulse rounded-2xl border-2 border-emerald-500 bg-gradient-to-r from-emerald-500/20 to-green-500/20 p-6 shadow-lg">
                            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                              ✨ รหัส OTP รับของพร้อมแล้ว!
                            </p>
                            <p className="mt-2 font-mono text-4xl font-black text-emerald-300">
                              {req.pickupOtp}
                            </p>
                            <p className="mt-2 text-xs text-emerald-300/70">
                              💡 ไปที่ตู้และกดปุ่ม "รับของเลย" ด้านล่าง
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Action Button - Make it prominent */}
                      {req.status === "in_locker" && !req.isLocked && (
                        <div className="flex items-center">
                          <Link
                            href={`/pickup?requestId=${req.id}`}
                            className="group flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 px-8 py-4 font-bold text-slate-900 shadow-xl transition hover:shadow-2xl hover:scale-105"
                          >
                            <Package className="h-6 w-6" />
                            รับของเลย
                            <span className="text-xl">→</span>
                          </Link>
                        </div>
                      )}
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
