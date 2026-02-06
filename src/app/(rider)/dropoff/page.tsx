"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import {
  collection,
  getDocs,
  query,
  updateDoc,
  where,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { ROLE_COOKIE_NAME, type UserRole } from "@/lib/auth/roles";
import { ActivityLogger } from "@/lib/activity-logger";
import QRScanner from "@/components/ui/qr-scanner";
import { QrCode, Package, Upload, CheckCircle } from "lucide-react";

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export default function RiderDropoffPage() {
  const router = useRouter();
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [lockerId, setLockerId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [photoName, setPhotoName] = useState("");
  const [pickupOtp, setPickupOtp] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showScanner, setShowScanner] = useState(false);

  useEffect(() => {
    const role = Cookies.get(ROLE_COOKIE_NAME) as UserRole | undefined;
    if (role !== "rider" && role !== "admin") {
      router.push("/auth/login");
    } else {
      setIsAuthChecking(false);
    }
  }, [router]);

  const canSubmitDropoff = useMemo(() => !!photoName && status === "paid", [photoName, status]);

  const handleQRScan = (scannedToken: string) => {
    setToken(scannedToken);
    setShowScanner(false);
    // Auto search after scan
    setTimeout(() => {
      findRequest();
    }, 100);
  };

  const findRequest = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    setRequestId(null);
    setLockerId(null);
    setStatus(null);
    setPickupOtp(null);

    try {
      if (!token) {
        setError("กรุณากรอก token ที่ได้รับจากลูกค้า");
        return;
      }

      const requestQuery = query(collection(db, "requests"), where("riderToken", "==", token));
      const snapshot = await getDocs(requestQuery);
      if (snapshot.empty) {
        setError("ไม่พบรายการฝากด้วย token นี้");
        return;
      }

      const docSnap = snapshot.docs[0];
      const data = docSnap.data() as any;
      
      // ตรวจสอบสถานะ request
      if (data.status === "in_locker") {
        setError("รายการนี้ถูก dropoff ไปแล้ว");
        return;
      }
      
      if (data.status === "completed") {
        setError("รายการนี้เสร็จสิ้นแล้ว");
        return;
      }

      if (data.status !== "paid") {
        setError("รายการนี้ยังไม่ได้ชำระเงิน");
        return;
      }
      
      setRequestId(docSnap.id);
      setLockerId(data.lockerId);
      setStatus(data.status);
      setPickupOtp(data.pickupOtp || null);
      setSuccess("พบรายการ! กรุณาอัพโหลดรูปแล้วกดยืนยันการฝาก");
    } catch (err: any) {
      setError(err?.message || "ค้นหารายการไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  const confirmDropoff = async () => {
    if (!requestId || !lockerId) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const otp = generateOtp();
      const riderId = auth.currentUser?.uid || null;

      await updateDoc(doc(db, "requests", requestId), {
        status: "in_locker",
        dropoffAt: serverTimestamp(),
        dropoffPhotoName: photoName,
        riderId,
        pickupOtp: otp,
      });

      // Log activity
      if (riderId) {
        await ActivityLogger.riderDropoff(requestId, riderId, lockerId);
      }

      setStatus("in_locker");
      setPickupOtp(otp);
      setSuccess("✅ บันทึกสำเร็จ! ส่ง OTP ให้ลูกค้าเพื่อรับของ");
      setPhotoName(""); // Clear for next request
    } catch (err: any) {
      setError(err?.message || "ไม่สามารถบันทึกการฝากได้");
    } finally {
      setLoading(false);
    }
  };

  const pickupLink = requestId ? `/pickup?requestId=${requestId}` : "";

  if (isAuthChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
        <div className="text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-400 border-t-transparent"></div>
          <p className="mt-4 text-sm text-slate-300">กำลังตรวจสอบสิทธิ์...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-8">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">EcoLivery</p>
          <h1 className="text-2xl font-semibold">ไรเดอร์: นำของมาส่ง</h1>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/auth/login"
            className="rounded-full border border-slate-700 px-5 py-2 text-sm font-medium text-slate-200 transition hover:border-slate-400"
          >
            ไปล็อกอิน
          </Link>
          <Link
            href="/"
            className="rounded-full border border-slate-700 px-5 py-2 text-sm font-medium text-slate-200 transition hover:border-slate-400"
          >
            กลับหน้าแรก
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-6 pb-20">
        {/* Scanner Modal */}
        {showScanner && (
          <QRScanner
            onScan={handleQRScan}
            onClose={() => setShowScanner(false)}
          />
        )}

        <section className="rounded-3xl border-2 border-slate-800 bg-slate-900 p-8 shadow-xl">
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/10">
              <QrCode className="h-8 w-8 text-blue-400" />
            </div>
            <h2 className="mt-4 text-2xl font-bold">สแกนหรือกรอก Token</h2>
            <p className="mt-2 text-sm text-slate-400">
              ใช้ token จากลูกค้าเพื่อค้นหาตู้ฝาก
            </p>
          </div>

          <div className="mt-6 space-y-3">
            {/* QR Scan Button */}
            <button
              onClick={() => setShowScanner(true)}
              className="group w-full rounded-xl border-2 border-emerald-500/50 bg-emerald-500/10 px-6 py-4 font-bold text-emerald-300 transition hover:border-emerald-400 hover:bg-emerald-500/20"
            >
              <span className="flex items-center justify-center gap-2">
                <QrCode className="h-6 w-6" />
                สแกน QR Code จากลูกค้า
              </span>
            </button>

            {/* Manual Input */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-700"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-slate-900 px-2 text-slate-500">หรือ</span>
              </div>
            </div>

            <input
              value={token}
              onChange={(event) => setToken(event.target.value)}
              placeholder="กรอก Token ด้วยตนเอง..."
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white placeholder-slate-500 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
            <button
              onClick={findRequest}
              disabled={loading || !token}
              className="w-full rounded-xl bg-emerald-500 px-6 py-3 font-bold text-slate-900 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "กำลังค้นหา..." : "ค้นหารายการ"}
            </button>
          </div>

          {error && (
            <div className="mt-4 rounded-xl border border-rose-500/50 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              ⚠️ {error}
            </div>
          )}
          {success && (
            <div className="mt-4 rounded-xl border border-emerald-500/50 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
              ✓ {success}
            </div>
          )}
        </section>

        {requestId && lockerId && (
          <section className="mt-6 rounded-3xl border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-slate-900 p-8 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20">
                <Package className="h-6 w-6 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold">ตู้ {lockerId}</h3>
                <p className="text-sm text-slate-900">Request: {requestId.slice(0, 12)}...</p>
              </div>
            </div>
            
            <div className="mt-4 rounded-xl bg-slate-900 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">สถานะ</span>
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                  status === "paid" ? "bg-blue-500/20 text-blue-300" : 
                  status === "in_locker" ? "bg-emerald-500/20 text-emerald-300" : 
                  "bg-slate-500 text-slate-300"
                }`}>
                  {status === "paid" ? "ชำระแล้ว" : 
                   status === "in_locker" ? "อยู่ในตู้" : status}
                </span>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {/* Photo Upload */}
              <div>
                <label className="block text-sm font-semibold text-slate-500 mb-2">
                  ถ่ายรูปพัสดุ (ชื่อไฟล์)
                </label>
                <div className="relative">
                  <Upload className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={photoName}
                    onChange={(event) => setPhotoName(event.target.value)}
                    placeholder="เช่น parcel-001.jpg"
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 pl-10 pr-4 py-3 text-white placeholder-slate-500 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                onClick={confirmDropoff}
                disabled={loading || !canSubmitDropoff}
                className="group w-full rounded-xl bg-emerald-500 px-6 py-4 font-bold text-slate-900 shadow-lg transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="flex items-center justify-center gap-2">
                  <CheckCircle className="h-5 w-5 transition group-hover:scale-110" />
                  {loading ? "กำลังบันทึก..." : "ยืนยันฝากของและปิดตู้"}
                </span>
              </button>
            </div>

            {/* OTP Display - Highlight after successful dropoff */}
            {pickupOtp && (
              <div className="mt-6 animate-pulse rounded-2xl border-2 border-emerald-500 bg-gradient-to-r from-emerald-500/20 to-green-500/20 p-6 shadow-xl">
                <div className="text-center">
                  <p className="text-sm font-semibold uppercase tracking-wider text-emerald-400">
                    ✨ OTP สำหรับลูกค้า ✨
                  </p>
                  <p className="mt-3 font-mono text-5xl font-black text-emerald-300">
                    {pickupOtp}
                  </p>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(pickupOtp);
                      alert('คัดลอก OTP แล้ว!');
                    }}
                    className="mt-4 rounded-lg bg-emerald-500/30 px-4 py-2 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-500/40"
                  >
                    📋 คัดลอก OTP
                  </button>
                  <p className="mt-4 text-xs text-emerald-300/70">
                    💡 บอกลูกค้าให้กรอกรหัสนี้ที่หน้าตู้เพื่อรับของ
                  </p>
                </div>
              </div>
            )}
          </section>
        )}

        {/* Success Message after dropoff */}
        {success && pickupOtp && (
          <div className="mt-6 rounded-3xl border-2 border-emerald-500/50 bg-emerald-500/10 p-6 text-center">
            <CheckCircle className="mx-auto h-16 w-16 text-emerald-400" />
            <p className="mt-4 text-lg font-semibold text-emerald-300">{success}</p>
            <button
              onClick={() => {
                // Reset for next request
                setToken("");
                setRequestId(null);
                setLockerId(null);
                setStatus(null);
                setPickupOtp(null);
                setPhotoName("");
                setError(null);
                setSuccess(null);
              }}
              className="mt-4 rounded-xl bg-emerald-500 px-6 py-3 font-semibold text-slate-900 transition hover:bg-emerald-400"
            >
              รับงานต่อไป
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
