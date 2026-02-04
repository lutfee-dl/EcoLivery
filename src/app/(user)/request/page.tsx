"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { LOCKERS } from "@/constants/lockers";
import LockerCard from "@/components/ui/locker-card";

function createToken() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID().replace(/-/g, "");
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export default function RequestPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preSelectedLocker = searchParams.get("lockerId");
  
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [lockerId, setLockerId] = useState(preSelectedLocker || "");
  const [price, setPrice] = useState("50");
  const [loading, setLoading] = useState(false);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [riderToken, setRiderToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const lockers = LOCKERS;

  const shareLink = useMemo(() => {
    if (!riderToken || typeof window === "undefined") return "";
    return `${window.location.origin}/rider/dropoff?token=${riderToken}`;
  }, [riderToken]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/login");
      } else {
        setIsAuthChecking(false);
      }
    });
    return () => unsubscribe();
  }, [router]);

  // Auto-set price when locker is selected
  useEffect(() => {
    if (lockerId) {
      const locker = lockers.find((l) => l.id === lockerId);
      if (locker) {
        setPrice(locker.price.toString());
      }
    }
  }, [lockerId, lockers]);

  const createRequest = async () => {
    setLoading(true);
    setError(null);

    try {
      if (!lockerId) {
        setError("กรุณาระบุตู้ที่ต้องการฝาก");
        return;
      }

      const id = createToken();
      const token = createToken();
      const user = auth.currentUser;

      await setDoc(doc(db, "requests", id), {
        lockerId,
        price: Number(price || 0),
        status: "paid",
        riderToken: token,
        createdAt: serverTimestamp(),
        customerId: user!.uid,
      });

      setRequestId(id);
      setRiderToken(token);
    } catch (err: any) {
      setError(err?.message || "สร้างรายการไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  if (isAuthChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
        <div className="text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-400 border-t-transparent"></div>
          <p className="mt-4 text-sm text-slate-300">กำลังตรวจสอบการเข้าสู่ระบบ...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      <header className="border-b border-slate-800/60 bg-slate-950/70 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-emerald-300">EcoLivery</p>
            <h1 className="text-xl font-bold">จองตู้ล็อคเกอร์</h1>
          </div>
          <Link
            href="/"
            className="rounded-full border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-200 transition hover:border-slate-400"
          >
            ← กลับหน้าแรก
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-8 md:px-6">
        {/* Progress Steps */}
        <div className="mb-8 flex items-center justify-center gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-sm font-bold text-slate-900">
              1
            </div>
            <span className="text-sm font-semibold text-emerald-300">เลือกตู้</span>
          </div>
          <div className="h-px w-12 bg-slate-700"></div>
          <div className="flex items-center gap-2">
            <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
              lockerId ? "bg-emerald-500 text-slate-900" : "bg-slate-800 text-slate-400"
            }`}>
              2
            </div>
            <span className={`text-sm font-semibold ${lockerId ? "text-emerald-300" : "text-slate-400"}`}>
              ชำระเงิน
            </span>
          </div>
          <div className="h-px w-12 bg-slate-700"></div>
          <div className="flex items-center gap-2">
            <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
              requestId ? "bg-emerald-500 text-slate-900" : "bg-slate-800 text-slate-400"
            }`}>
              3
            </div>
            <span className={`text-sm font-semibold ${requestId ? "text-emerald-300" : "text-slate-400"}`}>
              รับ QR
            </span>
          </div>
        </div>

        {!requestId ? (
          <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
            {/* Locker Selection */}
            <section>
              <div className="mb-6">
                <h2 className="text-2xl font-bold">เลือกตู้ที่ต้องการ</h2>
                <p className="mt-1 text-slate-400">คลิกเลือกตู้ที่ว่างเพื่อจอง</p>
              </div>

              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {lockers.map((locker) => {
                  const isSelected = lockerId === locker.id;
                  return (
                    <LockerCard
                      key={locker.id}
                      locker={locker}
                      isSelected={isSelected}
                      onSelect={(id) => setLockerId(id)}
                    />
                  );
                })}
              </div>
            </section>

            {/* Booking Summary */}
            <section className="lg:sticky lg:top-24 lg:self-start">
              <div className="rounded-3xl border-2 border-emerald-500/30 bg-slate-900/80 p-6">
                <h3 className="text-lg font-bold">สรุปการจอง</h3>
                
                {lockerId ? (
                  <div className="mt-6 space-y-4">
                    <div className="flex items-center justify-between rounded-2xl bg-slate-800/60 p-4">
                      <div>
                        <div className="text-xs text-slate-400">ตู้ที่เลือก</div>
                        <div className="text-2xl font-bold text-white">{lockerId}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-slate-400">ขนาด</div>
                        <div className="font-semibold text-emerald-300">
                          {lockers.find((l) => l.id === lockerId)?.size}
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-700 bg-slate-950/60 p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-300">ค่าบริการ</span>
                        <span className="text-2xl font-bold text-emerald-400">฿{price}</span>
                      </div>
                    </div>

                    <button
                      onClick={createRequest}
                      disabled={loading}
                      className="group relative w-full overflow-hidden rounded-2xl bg-emerald-500 py-4 text-center font-bold text-slate-900 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <span className="relative z-10 flex items-center justify-center gap-2">
                        {loading && (
                          <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-900 border-t-transparent"></div>
                        )}
                        {loading ? "กำลังดำเนินการ..." : "ชำระเงินและรับ QR"}
                      </span>
                    </button>

                    {error && (
                      <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                        {error}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mt-6 text-center">
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-slate-800/60 text-4xl">
                      👆
                    </div>
                    <p className="mt-4 text-sm text-slate-400">เลือกตู้ด้านซ้ายเพื่อเริ่มจอง</p>
                  </div>
                )}
              </div>
            </section>
          </div>
        ) : (
          <section className="mt-8 rounded-3xl border border-emerald-500/20 bg-slate-900/60 p-6">
            <h3 className="text-lg font-semibold">ส่งลิงก์ให้ไรเดอร์</h3>
            <p className="mt-2 text-sm text-slate-300">
              แชร์ QR หรือ URL นี้ให้ไรเดอร์เพื่อสแกนเปิดตู้
            </p>
            <div className="mt-4 space-y-3 text-sm text-slate-200">
              <p>Request ID: {requestId}</p>
              <p className="break-all">Link: {shareLink}</p>
            </div>
            {shareLink && (
              <div className="mt-4">
                <img
                  alt="QR"
                  className="h-40 w-40 rounded-2xl border border-slate-700 bg-white p-2"
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shareLink)}`}
                />
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
