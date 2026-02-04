"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { ActivityLogger } from "@/lib/activity-logger";
import { Package, Lock, Unlock, CheckCircle, AlertCircle } from "lucide-react";

export default function PickupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preSelectedRequestId = searchParams.get("requestId");

  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState<any[]>([]);
  const [selectedRequestId, setSelectedRequestId] = useState(preSelectedRequestId || "");
  const [request, setRequest] = useState<any>(null);
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      setIsAuthChecking(false);
      await loadUserRequests(user.uid);

      if (preSelectedRequestId) {
        setSelectedRequestId(preSelectedRequestId);
        await loadRequest(preSelectedRequestId);
      }
    });

    return () => unsubscribe();
  }, [router, preSelectedRequestId]);

  const loadUserRequests = async (uid: string) => {
    try {
      const { collection, query, where, getDocs } = await import("firebase/firestore");
      const q = query(collection(db, "requests"), where("customerId", "==", uid), where("status", "==", "in_locker"));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setRequests(data);
    } catch (err) {
      console.error("Error loading requests:", err);
    }
  };

  const loadRequest = async (id: string) => {
    try {
      const docSnap = await getDoc(doc(db, "requests", id));
      if (docSnap.exists()) {
        setRequest({ id: docSnap.id, ...docSnap.data() });
      } else {
        setError("ไม่พบรายการนี้");
      }
    } catch (err: any) {
      setError(err?.message || "โหลดข้อมูลไม่สำเร็จ");
    }
  };

  const handlePickup = async () => {
    if (!selectedRequestId || !request) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // ตรวจสอบว่าตู้ถูกล็อคหรือไม่
      if (request.isLocked) {
        setError("ตู้ถูกล็อคเนื่องจากเกินเวลา กรุณาชำระค่าปรับก่อน");
        return;
      }

      // ตรวจสอบสถานะ
      if (request.status !== "in_locker") {
        setError("รายการนี้ยังไม่พร้อมสำหรับรับของ");
        return;
      }

      // ตรวจสอบ OTP
      if (otp !== request.pickupOtp) {
        setError("รหัส OTP ไม่ถูกต้อง");
        return;
      }

      // อัพเดทสถานะเป็น completed และรีเซ็ตข้อมูลการเช่า
      await updateDoc(doc(db, "requests", selectedRequestId), {
        status: "completed",
        pickupAt: serverTimestamp(),
        isLocked: false,
        overtimeFee: 0,
        overtimeHours: 0,
      });

      // ปลดล็อคตู้ให้ว่างอีกครั้ง (ตรวจสอบว่ามีตู้จริงก่อน)
      if (request.lockerId) {
        try {
          const lockerRef = doc(db, "lockers", request.lockerId);
          const lockerSnap = await getDoc(lockerRef);
          
          if (lockerSnap.exists()) {
            await updateDoc(lockerRef, {
              available: true,
            });
            console.log(`✅ Locker ${request.lockerId} is now available`);
          } else {
            console.warn(`⚠️ Locker ${request.lockerId} not found in Firestore`);
          }
        } catch (lockerErr) {
          console.error("❌ Error updating locker:", lockerErr);
          // ไม่ throw error เพราะ request สำเร็จแล้ว
        }
      }

      // Log activity
      await ActivityLogger.updateRequestStatus(selectedRequestId, "in_locker", "completed");

      setSuccess("✅ รับของสำเร็จ! ตู้กลับมาว่างแล้ว - สามารถจองใหม่ได้");
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    } catch (err: any) {
      setError(err?.message || "รับของไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  if (isAuthChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
        <div className="text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-400 border-t-transparent"></div>
          <p className="mt-4 text-sm text-slate-300">กำลังตรวจสอบ...</p>
        </div>
      </div>
    );
  }

  if (!preSelectedRequestId && requests.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
        <div className="text-center">
          <AlertCircle className="mx-auto h-16 w-16 text-amber-400" />
          <p className="mt-4 text-lg">ไม่มีรายการที่พร้อมรับของ</p>
          <p className="mt-2 text-sm text-slate-400">รอไรเดอร์ส่งของเข้าตู้ก่อน</p>
          <Link href="/dashboard" className="mt-4 inline-block rounded-xl bg-emerald-500 px-6 py-3 font-semibold text-slate-900 transition hover:bg-emerald-400">
            กลับหน้าหลัก
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      <header className="border-b border-slate-800/60 bg-slate-950/70 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-emerald-300">รับของ</p>
            <h1 className="text-xl font-bold">ปลดล็อคตู้</h1>
          </div>
          <Link
            href="/dashboard"
            className="rounded-full border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-200 transition hover:border-slate-400"
          >
            ← กลับ
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-6 py-12">
        {/* Select Request if not pre-selected */}
        {!preSelectedRequestId && requests.length > 0 && !selectedRequestId && (
          <div className="mb-8">
            <h2 className="mb-4 text-2xl font-bold">เลือกรายการที่ต้องการรับ</h2>
            <div className="space-y-3">
              {requests.map((req) => (
                <button
                  key={req.id}
                  onClick={async () => {
                    setSelectedRequestId(req.id);
                    await loadRequest(req.id);
                  }}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-900/50 p-6 text-left transition hover:border-emerald-500"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">ตู้ {req.lockerId}</p>
                      <p className="text-sm text-slate-400">Request: {req.id.slice(0, 8)}...</p>
                      {req.pickupOtp && (
                        <p className="mt-2 font-mono text-2xl text-emerald-400">{req.pickupOtp}</p>
                      )}
                    </div>
                    <div className="text-emerald-400">→</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Pickup Form */}
        {selectedRequestId && request && (
          <div>
            <div className="mb-8 text-center">
              <Package className="mx-auto h-16 w-16 text-emerald-400" />
              <h1 className="mt-4 text-3xl font-bold">รับของจากตู้</h1>
              <p className="mt-2 text-slate-400">กรอกรหัส OTP เพื่อปลดล็อคตู้</p>
            </div>

            <div className="rounded-3xl border border-slate-700 bg-slate-900/50 p-8 backdrop-blur">
              {/* Request Info */}
              <div className="mb-6 space-y-3 rounded-2xl bg-slate-800/50 p-6">
                <div className="flex justify-between">
                  <span className="text-slate-400">ตู้:</span>
                  <span className="font-semibold">{request.lockerId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">สถานะ:</span>
                  <span className={`font-semibold ${
                    request.isLocked ? "text-red-400" : 
                    request.status === "completed" ? "text-slate-400" : 
                    "text-emerald-400"
                  }`}>
                    {request.isLocked && <Lock className="inline h-4 w-4 mr-1" />}
                    {!request.isLocked && request.status === "in_locker" && <Unlock className="inline h-4 w-4 mr-1" />}
                    {request.isLocked ? "ล็อคแล้ว" : request.status === "in_locker" ? "พร้อมรับของ" : "เสร็จสิ้น"}
                  </span>
                </div>
                {request.isLocked && (
                  <div className="mt-4 rounded-xl bg-red-500/10 p-4 text-sm text-red-300">
                    <AlertCircle className="inline h-5 w-5 mr-2" />
                    ตู้ถูกล็อคเนื่องจากเกินเวลา กรุณาชำระค่าปรับ {request.overtimeFee} บาท
                  </div>
                )}
              </div>

              {/* OTP Input */}
              {request.status === "in_locker" && !request.isLocked && (
                <>
                  <div className="mb-6">
                    <label className="mb-2 block text-sm font-semibold text-slate-300">
                      รหัส OTP (6 หลัก)
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                      placeholder="000000"
                      autoFocus
                      className="w-full rounded-xl border border-slate-700 bg-slate-800 px-6 py-4 text-center text-2xl font-mono tracking-widest text-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    />
                    {request.pickupOtp && (
                      <p className="mt-2 text-xs text-emerald-400">
                        💡 OTP ของคุณ: {request.pickupOtp}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={handlePickup}
                    disabled={loading || otp.length !== 6}
                    className="w-full rounded-xl bg-emerald-600 px-6 py-4 font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                        กำลังตรวจสอบ...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <Unlock className="h-5 w-5" />
                        ปลดล็อคและรับของ
                      </span>
                    )}
                  </button>
                </>
              )}

              {request.status === "completed" && (
                <div className="text-center">
                  <CheckCircle className="mx-auto h-16 w-16 text-emerald-400" />
                  <p className="mt-4 text-lg font-semibold text-emerald-400">รับของเรียบร้อยแล้ว</p>
                  <Link
                    href="/dashboard"
                    className="mt-6 inline-block rounded-xl bg-slate-700 px-6 py-3 font-semibold transition hover:bg-slate-600"
                  >
                    กลับหน้าหลัก
                  </Link>
                </div>
              )}

              {/* Messages */}
              {error && (
                <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {error}
                </div>
              )}
              {success && (
                <div className="mt-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                  {success}
                </div>
              )}
            </div>

            <div className="mt-6 text-center">
              <Link href="/dashboard" className="text-sm text-slate-400 transition hover:text-emerald-400">
                ← กลับหน้าหลัก
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
