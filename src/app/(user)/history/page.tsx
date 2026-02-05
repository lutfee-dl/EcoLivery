"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, query, where } from "firebase/firestore";
import Cookies from "js-cookie";
import { auth, db } from "@/lib/firebase";
import { ROLE_COOKIE_NAME, type UserRole } from "@/lib/auth/roles";
import { Package, Clock, CheckCircle, ArrowLeft } from "lucide-react";
import { RENTAL_PLANS, type RentalDuration } from "@/constants/rental-pricing";

type Request = {
  id: string;
  lockerId: string;
  status: string;
  price: number;
  createdAt: any;
  rentalDuration?: RentalDuration;
  deadline?: any;
  overtimeFee?: number;
  overtimeHours?: number;
  completedAt?: any;
};

export default function HistoryPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [requests, setRequests] = useState<Request[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/auth/login");
        return;
      }

      setUser(currentUser);
      const userRole = (Cookies.get(ROLE_COOKIE_NAME) as UserRole) || "user";

      if (userRole !== "user") {
        router.push("/dashboard");
        return;
      }

      await loadHistory(currentUser.uid);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const loadHistory = async (uid: string) => {
    try {
      const q = query(
        collection(db, "requests"),
        where("customerId", "==", uid),
        where("status", "==", "completed")
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Request[];
      setRequests(data.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds));
    } catch (error) {
      console.error("Error loading history:", error);
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      <header className="border-b border-slate-800/60 bg-slate-950/70 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-700 bg-slate-800/40 transition hover:border-slate-600 hover:bg-slate-800"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-emerald-300">History</p>
              <h1 className="text-xl font-semibold">ประวัติการฝากของ</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-6 py-8">
        {requests.length === 0 ? (
          <div className="mt-12 rounded-3xl border border-slate-800 bg-slate-900/60 p-12 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-slate-800/60 text-4xl">
              📋
            </div>
            <p className="mt-4 text-slate-300">ยังไม่มีประวัติการฝากของ</p>
            <Link
              href="/request"
              className="mt-4 inline-block rounded-full bg-emerald-400 px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-emerald-300"
            >
              สร้างรายการฝากของใหม่
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-slate-400">
              พบ {requests.length} รายการที่เสร็จสิ้นแล้ว
            </p>
            {requests.map((req) => (
              <div
                key={req.id}
                className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 transition hover:border-slate-700"
              >
                <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/10">
                        <CheckCircle className="h-6 w-6 text-green-400" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">ตู้ {req.lockerId}</h3>
                        <span className="rounded-full bg-green-500/10 px-3 py-1 text-xs font-semibold text-green-200">
                          เสร็จสิ้น
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 text-sm text-slate-400 md:grid-cols-2">
                      <div>
                        <p className="text-xs text-slate-500">Request ID</p>
                        <p className="font-mono text-slate-300">{req.id}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">ค่าบริการ</p>
                        <p className="text-lg font-bold text-emerald-400">฿{req.price}</p>
                      </div>
                      {req.rentalDuration && (
                        <div>
                          <p className="text-xs text-slate-500">ระยะเวลาเช่า</p>
                          <p className="font-semibold text-slate-300">
                            {RENTAL_PLANS[req.rentalDuration]?.label}
                          </p>
                        </div>
                      )}
                      {req.overtimeFee && req.overtimeFee > 0 && (
                        <div>
                          <p className="text-xs text-slate-500">ค่าเกินเวลา</p>
                          <p className="font-bold text-amber-400">
                            ฿{req.overtimeFee} ({req.overtimeHours} ชั่วโมง)
                          </p>
                        </div>
                      )}
                      {req.createdAt && (
                        <div>
                          <p className="text-xs text-slate-500">วันที่สร้าง</p>
                          <p className="flex items-center gap-1 text-slate-300">
                            <Clock className="h-4 w-4" />
                            {new Date(req.createdAt.seconds * 1000).toLocaleString("th-TH")}
                          </p>
                        </div>
                      )}
                      {req.completedAt && (
                        <div>
                          <p className="text-xs text-slate-500">วันที่รับของ</p>
                          <p className="flex items-center gap-1 text-green-300">
                            <CheckCircle className="h-4 w-4" />
                            {new Date(req.completedAt.seconds * 1000).toLocaleString("th-TH")}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
