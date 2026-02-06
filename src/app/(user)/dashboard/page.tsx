"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, query, where } from "firebase/firestore";
import Cookies from "js-cookie";
import { auth, db } from "@/lib/firebase";
import { ROLE_COOKIE_NAME, type UserRole } from "@/lib/auth/roles";
import { Package, Clock, Copy, CheckCircle, X, Send, Truck, Settings } from "lucide-react";
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
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [selectedToken, setSelectedToken] = useState<string>("");
  const [tokenCopied, setTokenCopied] = useState(false);

  // Check for success param
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === 'created') {
      setSuccessMessage('สร้างรายการจองสำเร็จ! ส่ง Token ให้ไรเดอร์เพื่อไปรับของจากคุณ');
      // Clear URL params
      window.history.replaceState({}, '', '/dashboard');
      setTimeout(() => setSuccessMessage(null), 5000);
    }
  }, []);

  const handleCopyToken = (token: string) => {
    navigator.clipboard.writeText(token);
    setTokenCopied(true);
    setTimeout(() => setTokenCopied(false), 2000);
  };

  const openTokenModal = (token: string) => {
    setSelectedToken(token);
    setShowTokenModal(true);
    setTokenCopied(false);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/auth/login");
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
      
      // แสดงเฉพาะรายการปัจจุบัน (paid และ in_locker เท่านั้น)
      const activeRequests = data.filter((req) => 
        req.status === "paid" || req.status === "in_locker"
      );
      
      setRequests(activeRequests.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds));
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
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-50 via-slate-100 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-500 dark:border-emerald-400 border-t-transparent"></div>
          <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { label: string; className: string }> = {
      paid: { label: "ชำระแล้ว", className: "bg-blue-500/20 dark:bg-blue-500/10 text-blue-700 dark:text-blue-200" },
      in_locker: { label: "อยู่ในตู้", className: "bg-emerald-500/20 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-200" },
      completed: { label: "เสร็จสิ้น", className: "bg-slate-500/20 dark:bg-slate-500/10 text-slate-700 dark:text-slate-200" },
    };
    const badge = badges[status] || { label: status, className: "bg-slate-500/20 dark:bg-slate-500/10 text-slate-700 dark:text-slate-200" };
    return (
      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badge.className}`}>
        {badge.label}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-slate-100 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-900 dark:text-white">
      <header className="border-b border-slate-200/80 dark:border-slate-800/60 bg-white/70 dark:bg-slate-950/70 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-emerald-600 dark:text-emerald-300">Dashboard</p>
            <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
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
          <div className="mb-6 animate-bounce rounded-2xl border-2 border-emerald-500/50 bg-emerald-500/20 dark:bg-emerald-500/10 p-4 text-center">
            <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">{successMessage}</p>
          </div>
        )}

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {role === "user" && (
            <>
              <Link
                href="/request"
                className="group rounded-2xl border border-emerald-500/30 dark:border-emerald-500/20 bg-white dark:bg-slate-900/60 p-5 transition hover:border-emerald-500 dark:hover:border-emerald-400 shadow-sm dark:shadow-none"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-500/20 dark:bg-emerald-500/10 mb-3">
                    <Package className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-200">แจ้งฝากของ</p>
                  <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">ทำรายการใหม่</p>
                </div>
              </Link>
              <Link
                href="/pickup"
                className="group rounded-2xl border border-blue-500/30 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5 transition hover:border-blue-500 dark:hover:border-slate-600 shadow-sm dark:shadow-none"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-500/20 dark:bg-blue-500/10 mb-3">
                    <Package className="h-7 w-7 text-blue-600 dark:text-blue-400" />
                  </div>
                  <p className="text-sm font-semibold text-blue-700 dark:text-blue-200">รับของ</p>
                  <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">รับพัสดุ</p>
                </div>
              </Link>
            </>
          )}

          {role === "rider" && (
            <>
              <Link
                href="/rider/dropoff"
                className="group rounded-2xl border border-emerald-500/30 dark:border-emerald-500/20 bg-white dark:bg-slate-900/60 p-5 transition hover:border-emerald-500 dark:hover:border-emerald-400 shadow-sm dark:shadow-none"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-500/20 dark:bg-emerald-500/10 mb-3">
                    <Truck className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-200">ส่งของ</p>
                  {requests.length > 0 && (
                    <span className="mt-2 inline-block rounded-full bg-emerald-500 px-2 py-0.5 text-xs font-bold text-white dark:text-slate-900">
                      {requests.length} งาน
                    </span>
                  )}
                </div>
              </Link>
            </>
          )}

          {role === "admin" && (
            <>
              <Link
                href="/admin/overview"
                className="group rounded-2xl border border-emerald-500/30 dark:border-emerald-500/20 bg-white dark:bg-slate-900/60 p-5 transition hover:border-emerald-500 dark:hover:border-emerald-400 shadow-sm dark:shadow-none"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-500/20 dark:bg-emerald-500/10 mb-3">
                    <Settings className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-200">Overview</p>
                  <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">ภาพรวม</p>
                </div>
              </Link>
              <Link
                href="/admin/approvals"
                className="group rounded-2xl border border-amber-500/30 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5 transition hover:border-amber-500 dark:hover:border-slate-600 shadow-sm dark:shadow-none"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-amber-500/20 dark:bg-amber-500/10 mb-3">
                    <CheckCircle className="h-7 w-7 text-amber-600 dark:text-amber-400" />
                  </div>
                  <p className="text-sm font-semibold text-amber-700 dark:text-amber-200">Approvals</p>
                  <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">อนุมัติไรเดอร์</p>
                </div>
              </Link>
            </>
          )}
        </div>

        {/* Rider Tasks List */}
        {role === "rider" && (
          <section className="mt-8">
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">งานรอส่งของ (Pending)</h2>
            {requests.length === 0 ? (
              <div className="mt-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-12 text-center shadow-sm dark:shadow-none">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800/60">
                  <Package className="h-10 w-10 text-slate-400 dark:text-slate-500" />
                </div>
                <p className="mt-4 text-slate-700 dark:text-slate-300">ไม่มีงานรอดำเนินการ</p>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-500">รีเฟรชหน้าเพื่อตรวจสอบงานใหม่</p>
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                {requests.map((req) => (
                  <div
                    key={req.id}
                    className="rounded-3xl border border-emerald-500/30 bg-gradient-to-r from-emerald-50 to-white dark:from-emerald-500/5 dark:to-slate-900/60 p-6 transition hover:border-emerald-500 shadow-sm dark:shadow-none"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20">
                            <Package className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">ตู้ {req.lockerId}</h3>
                            <span className="rounded-full bg-blue-500/20 px-3 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300">
                              รอรับของ
                            </span>
                          </div>
                        </div>
                        
                        <div className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-400">
                          <p>Token: <span className="font-mono text-emerald-600 dark:text-emerald-400">{req.riderToken}</span></p>
                          <p>ค่าบริการ: <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">฿{req.price}</span></p>
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
                        className="group rounded-xl bg-emerald-500 px-6 py-3 font-bold text-white dark:text-slate-900 transition hover:bg-emerald-600 dark:hover:bg-emerald-400 shadow-sm"
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
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">รายการฝากของของคุณ</h2>
              <Link
                href="/history"
                className="flex items-center gap-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/40 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 transition hover:border-slate-400 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm dark:shadow-none"
              >
                <Clock className="h-4 w-4" />
                ดูประวัติทั้งหมด
              </Link>
            </div>
            {requests.length === 0 ? (
              <div className="mt-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-12 text-center shadow-sm dark:shadow-none">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800/60">
                  <Package className="h-10 w-10 text-slate-400 dark:text-slate-500" />
                </div>
                <p className="mt-4 text-slate-700 dark:text-slate-300">ไม่มีรายการฝากของที่ดำเนินการอยู่</p>
                <Link
                  href="/request"
                  className="mt-4 inline-block rounded-full bg-emerald-500 dark:bg-emerald-400 px-6 py-3 text-sm font-semibold text-white dark:text-slate-900 transition hover:bg-emerald-600 dark:hover:bg-emerald-300 shadow-sm"
                >
                  สร้างรายการฝากของใหม่
                </Link>
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                {requests.map((req) => {
                  const isPaid = req.status === "paid";
                  const isInLocker = req.status === "in_locker";
                  const canPickup = isInLocker && !req.isLocked;

                  return (
                    <div
                      key={req.id}
                      className={`rounded-xl border-2 transition-all ${
                        canPickup
                          ? "border-emerald-500 bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-500/10 dark:to-slate-900/60 shadow-md dark:shadow-lg"
                          : req.isLocked
                          ? "border-rose-500/50 bg-gradient-to-br from-rose-50 to-white dark:from-rose-500/10 dark:to-slate-900/60 shadow-md"
                          : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm dark:shadow-none"
                      }`}
                    >
                      {/* Header - Compact for mobile */}
                      <div className="border-b border-slate-200 dark:border-slate-800/50 p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                              canPickup ? "bg-emerald-500/20" : req.isLocked ? "bg-rose-500/20" : "bg-blue-500/20"
                            }`}>
                              <Package className={`h-5 w-5 ${
                                canPickup ? "text-emerald-600 dark:text-emerald-400" : req.isLocked ? "text-rose-600 dark:text-rose-400" : "text-blue-600 dark:text-blue-400"
                              }`} />
                            </div>
                            <div>
                              <h3 className="font-bold text-slate-900 dark:text-white">ตู้ {req.lockerId}</h3>
                              {getStatusBadge(req.status)}
                            </div>
                          </div>
                          <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">฿{req.price}</p>
                        </div>
                      </div>

                      <div className="p-4">
                        {/* Token for Rider - Mobile Optimized */}
                        {isPaid && req.riderToken && (
                          <div className="mb-4 rounded-xl border-2 border-blue-500 bg-gradient-to-r from-blue-100 to-blue-50 dark:from-blue-500/20 dark:to-blue-600/10 p-4">
                            <div className="text-center">
                              <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-2">
                                ส่งรหัสนี้ให้ไรเดอร์
                              </p>
                              <div className="flex items-center justify-center gap-3">
                                <div className="rounded-lg bg-white/50 dark:bg-white/10 px-4 py-2">
                                  <p className="font-mono text-3xl font-black tracking-[0.5em] text-blue-900 dark:text-white">
                                    {req.riderToken}
                                  </p>
                                </div>
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(req.riderToken!);
                                    setTokenCopied(true);
                                    setTimeout(() => setTokenCopied(false), 2000);
                                  }}
                                  className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg transition ${
                                    tokenCopied
                                      ? "bg-emerald-500 scale-110"
                                      : "bg-blue-500 hover:bg-blue-600"
                                  }`}
                                >
                                  {tokenCopied ? (
                                    <CheckCircle className="h-6 w-6 text-white" />
                                  ) : (
                                    <Copy className="h-6 w-6 text-white" />
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* OTP for Pickup - Mobile Optimized */}
                        {canPickup && req.pickupOtp && (
                          <div className="mb-4 rounded-xl border-2 border-emerald-500 bg-gradient-to-r from-emerald-100 to-green-50 dark:from-emerald-500/20 dark:to-green-500/10 p-4">
                            <div className="text-center">
                              <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 mb-2">
                                รหัส OTP รับของ
                              </p>
                              <p className="font-mono text-4xl font-black tracking-[0.3em] text-emerald-700 dark:text-emerald-300 mb-3">
                                {req.pickupOtp}
                              </p>
                              <Link
                                href={`/pickup?requestId=${req.id}`}
                                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-emerald-500 to-green-500 px-6 py-3 text-base font-bold text-white shadow-sm transition hover:scale-105"
                              >
                                <Package className="h-5 w-5" />
                                รับของเลย
                              </Link>
                            </div>
                          </div>
                        )}

                        {/* Locker Status */}
                        <LockerStatus
                          requestId={req.id}
                          deadline={req.deadline}
                          rentalDuration={req.rentalDuration}
                          isLocked={req.isLocked}
                          overtimeFee={req.overtimeFee}
                          overtimeHours={req.overtimeHours}
                        />

                        {/* Small Info - Compact */}
                        {req.rentalDuration && (
                          <div className="mt-3 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                            <Clock className="h-3 w-3" />
                            <span>{RENTAL_PLANS[req.rentalDuration]?.label}</span>
                            {req.createdAt && (
                              <>
                                <span>•</span>
                                <span>
                                  {new Date(req.createdAt.seconds * 1000).toLocaleString('th-TH', {
                                    day: '2-digit',
                                    month: 'short',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
