"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { doc, serverTimestamp, setDoc, updateDoc, collection, onSnapshot, query, orderBy, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { generateToken } from "@/lib/utils";
import LockerCard from "@/components/ui/locker-card";
import { 
  RENTAL_PLANS, 
  RENTAL_DURATIONS, 
  type RentalDuration,
  calculateDeadline 
} from "@/constants/rental-pricing";
import { ActivityLogger } from "@/lib/activity-logger";
import { Clock, Calendar } from "lucide-react";
import { Package } from "lucide-react";

function RequestContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preSelectedLocker = searchParams.get("lockerId");
  
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [lockerId, setLockerId] = useState(preSelectedLocker || "");
  const [rentalDuration, setRentalDuration] = useState<RentalDuration>("1h");
  const [loading, setLoading] = useState(false);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [riderToken, setRiderToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lockers, setLockers] = useState<any[]>([]);

  const selectedPlan = RENTAL_PLANS[rentalDuration];
  const totalPrice = selectedPlan.basePrice;

  const shareLink = useMemo(() => {
    if (!riderToken || typeof window === "undefined") return "";
    return `${window.location.origin}/rider/dropoff?token=${riderToken}`;
  }, [riderToken]);

  // Real-time listener สำหรับ lockers
  useEffect(() => {
    const q = query(collection(db, "lockers"), orderBy("name"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const lockerData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setLockers(lockerData);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/auth/login");
      } else {
        setIsAuthChecking(false);
      }
    });
    return () => unsubscribe();
  }, [router]);

  const createRequest = async () => {
    setLoading(true);
    setError(null);

    try {
      if (!lockerId) {
        setError("กรุณาระบุตู้ที่ต้องการฝาก");
        return;
      }

      // ตรวจสอบว่าตู้ยังว่างอยู่หรือไม่
      const lockerRef = doc(db, "lockers", lockerId);
      const lockerSnap = await getDoc(lockerRef);
      
      if (!lockerSnap.exists()) {
        setError("ไม่พบตู้นี้ในระบบ");
        return;
      }

      if (!lockerSnap.data().available) {
        setError("ตู้นี้ถูกจองแล้ว กรุณาเลือกตู้อื่น");
        setLockerId(""); // Clear selection
        return;
      }

      const id = generateToken();
      const token = generateToken();
      const user = auth.currentUser;
      const now = new Date();
      const deadline = calculateDeadline(now, rentalDuration);

      // สร้าง request
      await setDoc(doc(db, "requests", id), {
        lockerId,
        rentalDuration,
        rentalHours: selectedPlan.hours,
        basePrice: selectedPlan.basePrice,
        overtimeRate: selectedPlan.overtimeRate,
        price: totalPrice,
        status: "paid", // ⚠️ Auto-paid for now, payment gateway coming soon
        riderToken: token,
        createdAt: serverTimestamp(),
        deadline: deadline,
        customerId: user!.uid,
        customerEmail: user!.email,
        isLocked: false,
        overtimeFee: 0,
        pickupOtp: null, // จะถูกสร้างโดย Rider เมื่อ dropoff
      });

      // อัพเดทสถานะตู้เป็นไม่ว่าง
      await updateDoc(doc(db, "lockers", lockerId), {
        available: false,
      });

      // Log activity
      await ActivityLogger.createRequest(id, lockerId, totalPrice);

      // Redirect to dashboard to show the created request
      router.push(`/dashboard?success=created&requestId=${id}`);
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
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="rounded-full border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-200 transition hover:border-slate-400"
            >
              ← กลับหน้าแรก
            </Link>
          </div>
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
          <div className="h-1 w-12 bg-emerald-300"></div>
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
          <div className="h-1 w-12 bg-emerald-300"></div>
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

              <div className="grid gap-6 grid-cols-2 sm:grid-cols-2 lg:grid-cols-3">
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
              <div className="rounded-3xl border-2 border-emerald-500/30 bg-background/80 p-6 backdrop-blur">
                <h3 className="text-lg font-bold">สรุปการจอง</h3>
                
                {lockerId ? (
                  <div className="mt-6 space-y-4">
                    <div className="flex items-center justify-between rounded-2xl bg-muted/60 p-4">
                      <div>
                        <div className="text-xs text-muted-foreground">ตู้ที่เลือก</div>
                        <div className="text-2xl font-bold">{lockerId}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground">ขนาด</div>
                        <div className="font-semibold text-emerald-600 dark:text-emerald-300">
                          {lockers.find((l) => l.id === lockerId)?.size}
                        </div>
                      </div>
                    </div>

                    {/* Rental Duration Selection */}
                    <div>
                      <label className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                        <Clock className="h-4 w-4" />
                        ระยะเวลาเช่า
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {RENTAL_DURATIONS.map((duration) => {
                          const plan = RENTAL_PLANS[duration];
                          const isSelected = rentalDuration === duration;
                          return (
                            <button
                              key={duration}
                              onClick={() => setRentalDuration(duration)}
                              className={`cursor-pointer rounded-xl border-2 p-3 text-left transition ${
                                isSelected
                                  ? "border-emerald-500 bg-emerald-500/10"
                                  : "border-border bg-muted/50 hover:border-muted-foreground/50"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className={`text-sm font-bold ${
                                    isSelected ? "text-emerald-600 dark:text-emerald-300" : "text-foreground"
                                  }`}>
                                    {plan.label}
                                  </div>
                                  <div className="mt-1 text-lg font-black text-emerald-600 dark:text-emerald-400">
                                    ฿{plan.basePrice}
                                  </div>
                                </div>
                                {isSelected && (
                                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500">
                                    <svg className="h-4 w-4 text-white dark:text-slate-900" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  </div>
                                )}
                              </div>
                              <div className="mt-2 text-xs text-muted-foreground">
                                ค่าปรับ: ฿{plan.overtimeRate}/ชม.
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Price Summary */}
                    <div className="rounded-2xl bg-muted/60 p-4">
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>ค่าเช่า ({selectedPlan.label})</span>
                        <span className="font-semibold">฿{selectedPlan.basePrice}</span>
                      </div>
                      <div className="mt-3 border-t border-border pt-3">
                        <div className="flex items-center justify-between">
                          <span className="font-bold">ยอดรวม</span>
                          <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">฿{totalPrice}</span>
                        </div>
                      </div>
                    </div>

                    {/* Warning */}
                    <div className=" rounded-xl border border-amber-500/30 bg-amber-500/50 p-4">
                      <div className="flex gap-3">
                        <div className="text-white">⚠️</div>
                        <div className="text-xs text-white">
                          <p className="font-semibold text-white">หมายเหตุ:</p>
                          <p className="mt-1">
                            หากรับของเกินเวลา ตู้จะล็อคอัตโนมัติ และคิดค่าปรับ 
                            <span className="font-bold"> ฿{selectedPlan.overtimeRate}/ชั่วโมง</span>
                          </p>
                          <p className="mt-1">
                            ต้องชำระค่าปรับก่อนจึงจะเปิดตู้ได้
                          </p>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={createRequest}
                      disabled={loading}
                      className="cursor-pointer group relative w-full overflow-hidden rounded-2xl bg-emerald-500 py-4 text-center font-bold text-slate-900 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <span className="relative z-10 flex items-center justify-center gap-2">
                        {loading && (
                          <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-900 border-t-transparent"></div>
                        )}
                        {loading ? "กำลังดำเนินการ..." : "ชำระเงิน"}
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
                  <div className=" mx-auto flex h-20 w-20 items-center justify-center rounded-full flex items-center justify-center rounded-xl bg-emerald-500/20 dark:bg-emerald-500/10 mb-3">
                    <Package className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
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

export default function RequestPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
        <div className="text-white">Loading...</div>
      </div>
    }>
      <RequestContent />
    </Suspense>
  );
}
