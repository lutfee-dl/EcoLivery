"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  GoogleAuthProvider,
  RecaptchaVerifier,
  signInWithEmailAndPassword,
  signInWithPhoneNumber,
  signInWithPopup,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { setRoleCookieFromUser } from "@/lib/auth/role-cookie";

const googleProvider = new GoogleAuthProvider();

type RiderStatus = "none" | "pending" | "approved" | "rejected";

interface RiderProfileForm {
  fullName: string;
  nationalId: string;
  vehicleType: string;
  licensePlate: string;
  phone: string;
}

interface RiderDoc extends RiderProfileForm {
  status: RiderStatus;
  approved: boolean;
  createdAt: any;
}

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // View state
  const [showRiderLogin, setShowRiderLogin] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  
  // Rider login
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const [riderStatus, setRiderStatus] = useState<RiderStatus>("none");
  const [showRiderProfileForm, setShowRiderProfileForm] = useState(false);
  const [riderForm, setRiderForm] = useState<RiderProfileForm>({
    fullName: "",
    nationalId: "",
    vehicleType: "",
    licensePlate: "",
    phone: "",
  });
  
  // Admin login
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await setRoleCookieFromUser(result.user, "user");
      setSuccess("เข้าสู่ระบบสำเร็จ");
      router.push("/dashboard");
    } catch (err: any) {
      setError(err?.message || "ไม่สามารถเข้าสู่ระบบได้");
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const recaptchaContainer = document.getElementById("recaptcha-container");
      if (!recaptchaContainer) {
        setError("ไม่พบ reCAPTCHA container");
        return;
      }
      const verifier = new RecaptchaVerifier(auth, "recaptcha-container", {
        size: "invisible",
      });
      const result = await signInWithPhoneNumber(auth, phone, verifier);
      setConfirmationResult(result);
      setSuccess("ส่งรหัส OTP แล้ว");
    } catch (err: any) {
      setError(err?.message || "ไม่สามารถส่ง OTP ได้");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!confirmationResult) {
      setError("กรุณาขอรหัส OTP ก่อน");
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const credential = await confirmationResult.confirm(otp);
      const uid = credential.user.uid;
      const riderRef = doc(db, "riders", uid);
      const riderSnap = await getDoc(riderRef);

      if (!riderSnap.exists()) {
        setShowRiderProfileForm(true);
        setRiderForm((prev) => ({ ...prev, phone }));
        setRiderStatus("none");
        setSuccess("ยืนยัน OTP แล้ว กรุณากรอกข้อมูลเพื่อสมัคร");
        return;
      }

      const data = riderSnap.data() as RiderDoc;
      setRiderStatus(data.status || "pending");

      if (data.status === "approved") {
        await setRoleCookieFromUser(credential.user, "rider");
        setSuccess("เข้าสู่ระบบไรเดอร์สำเร็จ");
        router.push("/dashboard");
      } else if (data.status === "rejected") {
        await setRoleCookieFromUser(credential.user, "user");
        setSuccess("บัญชีถูกปฏิเสธ กรุณาติดต่อแอดมิน");
      } else {
        await setRoleCookieFromUser(credential.user, "user");
        setSuccess("บัญชีอยู่ระหว่างรอการอนุมัติจากแอดมิน");
      }
    } catch (err: any) {
      setError(err?.message || "OTP ไม่ถูกต้อง");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitRiderProfile = async () => {
    if (!riderForm.fullName || !riderForm.nationalId || !riderForm.vehicleType || !riderForm.licensePlate) {
      setError("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        setError("กรุณายืนยัน OTP ก่อน");
        return;
      }
      const riderRef = doc(db, "riders", currentUser.uid);
      const payload: RiderDoc = {
        ...riderForm,
        status: "pending",
        approved: false,
        createdAt: serverTimestamp(),
      };
      await setDoc(riderRef, payload, { merge: true });
      await setRoleCookieFromUser(currentUser, "user");
      setRiderStatus("pending");
      setShowRiderProfileForm(false);
      setSuccess("ส่งข้อมูลแล้ว รอแอดมินอนุมัติ");
    } catch (err: any) {
      setError(err?.message || "ไม่สามารถส่งข้อมูลได้");
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const result = await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
      await setRoleCookieFromUser(result.user, "admin");
      setSuccess("เข้าสู่ระบบแอดมินสำเร็จ");
      router.push("/dashboard");
    } catch (err: any) {
      setError(err?.message || "อีเมลหรือรหัสผ่านไม่ถูกต้อง");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      <header className="border-b border-slate-800/60 bg-slate-950/70 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg">
              <span className="text-lg font-black text-slate-900">EL</span>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-emerald-300">EcoLivery</p>
              <h1 className="text-lg font-bold">เข้าสู่ระบบ</h1>
            </div>
          </div>
          <Link
            href="/"
            className="rounded-full border border-slate-700 px-5 py-2 text-sm font-medium text-slate-200 transition hover:border-slate-400"
          >
            ← กลับหน้าแรก
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-xl px-6 py-16">
        {!showAdminLogin && !showRiderLogin ? (
          /* Main Login Selection */
          <div className="rounded-3xl border-2 border-emerald-500/30 bg-slate-900/80 p-8 shadow-2xl">
            <div className="text-center">
              <h2 className="text-3xl font-bold">ยินดีต้อนรับ</h2>
              <p className="mt-2 text-slate-400">เลือกวิธีเข้าสู่ระบบ</p>
            </div>

            <div className="mt-8 space-y-4">
              {/* Google Login */}
              <button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="group relative w-full overflow-hidden rounded-2xl border border-slate-700 bg-white px-6 py-4 font-semibold text-slate-900 transition hover:border-slate-500 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="flex items-center justify-center gap-3">
                  <svg className="h-6 w-6" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบด้วย Google"}
                </span>
              </button>

              {/* Rider Login */}
              <button
                onClick={() => setShowRiderLogin(true)}
                className="w-full rounded-2xl border-2 border-blue-500/50 bg-blue-500/10 px-6 py-4 font-semibold text-blue-200 transition hover:border-blue-400 hover:bg-blue-500/20"
              >
                <span className="flex items-center justify-center gap-3">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  เข้าสู่ระบบไรเดอร์ (Phone OTP)
                </span>
              </button>
            </div>

            {error && (
              <div className="mt-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                {error}
              </div>
            )}
            {success && (
              <div className="mt-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
                {success}
              </div>
            )}

            <div className="mt-8 text-center">
              <button
                onClick={() => setShowAdminLogin(true)}
                className="text-sm text-slate-400 transition hover:text-purple-400"
              >
                เข้าสู่ระบบแอดมิน →
              </button>
            </div>
          </div>
        ) : showRiderLogin ? (
          /* Rider Login */
          <div className="rounded-3xl border-2 border-blue-500/30 bg-slate-900/80 p-8 shadow-2xl">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-blue-200">ไรเดอร์</h2>
              <p className="mt-2 text-slate-400">ยืนยันตัวตนด้วยเบอร์โทรศัพท์</p>
            </div>

            <div className="mt-8 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-300">เบอร์โทรศัพท์</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+66xxxxxxxxx"
                  className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-white placeholder:text-slate-500 focus:border-blue-400 focus:outline-none"
                />
              </div>

              <button
                onClick={handleSendOtp}
                disabled={loading}
                className="w-full rounded-2xl border-2 border-blue-400 bg-blue-500/10 px-6 py-3 font-semibold text-blue-200 transition hover:bg-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "กำลังส่ง OTP..." : "ส่งรหัส OTP"}
              </button>

              {confirmationResult && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-slate-300">รหัส OTP</label>
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="กรอกรหัส 6 หลัก"
                      className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-white placeholder:text-slate-500 focus:border-blue-400 focus:outline-none"
                    />
                  </div>

                  <button
                    onClick={handleVerifyOtp}
                    disabled={loading}
                    className="w-full rounded-2xl bg-blue-500 px-6 py-4 font-bold text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? "กำลังยืนยัน..." : "ยืนยัน OTP"}
                  </button>
                </>
              )}

              <div id="recaptcha-container" />

              {showRiderProfileForm && (
                <div className="mt-6 space-y-3 rounded-2xl border border-slate-700 bg-slate-950/40 p-4">
                  <h4 className="font-semibold text-blue-200">กรอกข้อมูลสมัครไรเดอร์</h4>
                  <input
                    value={riderForm.fullName}
                    onChange={(e) => setRiderForm((prev) => ({ ...prev, fullName: e.target.value }))}
                    placeholder="ชื่อ-นามสกุล"
                    className="w-full rounded-2xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-blue-400 focus:outline-none"
                  />
                  <input
                    value={riderForm.nationalId}
                    onChange={(e) => setRiderForm((prev) => ({ ...prev, nationalId: e.target.value }))}
                    placeholder="เลขบัตรประชาชน"
                    className="w-full rounded-2xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-blue-400 focus:outline-none"
                  />
                  <input
                    value={riderForm.vehicleType}
                    onChange={(e) => setRiderForm((prev) => ({ ...prev, vehicleType: e.target.value }))}
                    placeholder="ประเภทพาหนะ"
                    className="w-full rounded-2xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-blue-400 focus:outline-none"
                  />
                  <input
                    value={riderForm.licensePlate}
                    onChange={(e) => setRiderForm((prev) => ({ ...prev, licensePlate: e.target.value }))}
                    placeholder="ทะเบียนรถ"
                    className="w-full rounded-2xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-blue-400 focus:outline-none"
                  />
                  <button
                    onClick={handleSubmitRiderProfile}
                    disabled={loading}
                    className="w-full rounded-2xl bg-blue-500 px-6 py-3 font-semibold text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? "กำลังส่งข้อมูล..." : "ส่งข้อมูลสมัคร"}
                  </button>
                </div>
              )}

              {riderStatus === "pending" && !showRiderProfileForm && (
                <div className="mt-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                  บัญชีอยู่ระหว่างรอการอนุมัติจากแอดมิน
                </div>
              )}
              {riderStatus === "rejected" && !showRiderProfileForm && (
                <div className="mt-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                  บัญชีถูกปฏิเสธ กรุณาติดต่อแอดมิน
                </div>
              )}
            </div>

            {error && (
              <div className="mt-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                {error}
              </div>
            )}
            {success && (
              <div className="mt-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
                {success}
              </div>
            )}

            <div className="mt-8 text-center">
              <button
                onClick={() => {
                  setShowRiderLogin(false);
                  setError(null);
                  setSuccess(null);
                }}
                className="text-sm text-slate-400 transition hover:text-emerald-400"
              >
                ← กลับไปเลือกวิธีเข้าสู่ระบบ
              </button>
            </div>
          </div>
        ) : (
          /* Admin Login */
          <div className="rounded-3xl border-2 border-purple-500/30 bg-slate-900/80 p-8 shadow-2xl">
            <div className="text-center">
              <h2 className="text-3xl font-bold">แอดมิน</h2>
              <p className="mt-2 text-slate-400">เข้าสู่ระบบด้วยอีเมลและรหัสผ่าน</p>
            </div>

            <div className="mt-8 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-300">อีเมล</label>
                <input
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="admin@ecolivery.com"
                  className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-white placeholder:text-slate-500 focus:border-purple-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300">รหัสผ่าน</label>
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="••••••••"
                  className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-white placeholder:text-slate-500 focus:border-purple-400 focus:outline-none"
                />
              </div>

              <button
                onClick={handleAdminLogin}
                disabled={loading}
                className="w-full rounded-2xl bg-purple-500 px-6 py-4 font-bold text-white transition hover:bg-purple-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
              </button>
            </div>

            {error && (
              <div className="mt-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                {error}
              </div>
            )}
            {success && (
              <div className="mt-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
                {success}
              </div>
            )}

            <div className="mt-8 text-center">
              <button
                onClick={() => {
                  setShowAdminLogin(false);
                  setError(null);
                  setSuccess(null);
                }}
                className="text-sm text-slate-400 transition hover:text-emerald-400"
              >
                ← กลับไปเลือกวิธีเข้าสู่ระบบ
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
