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

  useEffect(() => {
    const role = Cookies.get(ROLE_COOKIE_NAME) as UserRole | undefined;
    if (role !== "rider" && role !== "admin") {
      router.push("/login");
    } else {
      setIsAuthChecking(false);
    }
  }, [router]);

  const canSubmitDropoff = useMemo(() => !!photoName && status === "paid", [photoName, status]);

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
      setRequestId(docSnap.id);
      setLockerId(data.lockerId);
      setStatus(data.status);
      setPickupOtp(data.pickupOtp || null);
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

      setStatus("in_locker");
      setPickupOtp(otp);
      setSuccess("บันทึกการฝากสำเร็จ ระบบสร้าง OTP ให้ลูกค้าแล้ว");
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
            href="/login"
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
        <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
          <h2 className="text-lg font-semibold">สแกนหรือกรอก Token</h2>
          <p className="mt-2 text-sm text-slate-300">
            ใช้ token จากลูกค้าเพื่อเปิดตู้ฝาก
          </p>
          <div className="mt-4 space-y-3">
            <input
              value={token}
              onChange={(event) => setToken(event.target.value)}
              placeholder="Token จากลูกค้า"
              className="w-full rounded-2xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none"
            />
            <button
              onClick={findRequest}
              disabled={loading}
              className="w-full rounded-2xl border border-emerald-400 px-4 py-3 text-sm font-semibold text-emerald-200 transition hover:bg-emerald-500/10 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "กำลังค้นหา..." : "ค้นหารายการ"}
            </button>
          </div>

          {error && (
            <div className="mt-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {error}
            </div>
          )}
          {success && (
            <div className="mt-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
              {success}
            </div>
          )}
        </section>

        {requestId && lockerId && (
          <section className="mt-8 rounded-3xl border border-emerald-500/20 bg-slate-900/60 p-6">
            <h3 className="text-lg font-semibold">รายละเอียดตู้</h3>
            <div className="mt-3 space-y-2 text-sm text-slate-300">
              <p>Request ID: {requestId}</p>
              <p>Locker: {lockerId}</p>
              <p>สถานะ: {status}</p>
            </div>

            <div className="mt-5 space-y-3">
              <label className="text-sm text-slate-300">ถ่ายรูปพัสดุ (ชื่อไฟล์)</label>
              <input
                type="text"
                value={photoName}
                onChange={(event) => setPhotoName(event.target.value)}
                placeholder="เช่น parcel-001.jpg"
                className="w-full rounded-2xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none"
              />
              <button
                onClick={confirmDropoff}
                disabled={loading || !canSubmitDropoff}
                className="w-full rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "กำลังบันทึก..." : "ยืนยันฝากของและปิดตู้"}
              </button>
            </div>

            {pickupOtp && (
              <div className="mt-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
                <p>OTP สำหรับลูกค้า: {pickupOtp}</p>
                <p className="mt-2 text-xs text-slate-300">ลิงก์รับของ: {pickupLink}</p>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
