"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import Cookies from "js-cookie";
import { auth } from "@/lib/firebase";
import { ROLE_COOKIE_NAME, type UserRole } from "@/lib/auth/roles";
import { LOCKERS } from "@/constants/lockers";
import LockerCard from "@/components/ui/locker-card";

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [selectedLocker, setSelectedLocker] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const userRole = Cookies.get(ROLE_COOKIE_NAME) as UserRole;
        setRole(userRole || "user");
      }
    });
    return () => unsubscribe();
  }, []);

  const lockers = LOCKERS;

  const handleLockerSelect = (lockerId: string) => {
    setSelectedLocker(lockerId);
    // Scroll to booking section
    document.getElementById("booking-section")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleQuickBook = () => {
    if (!selectedLocker) {
      alert("กรุณาเลือกตู้ก่อน");
      return;
    }
    
    if (!user) {
      // Redirect to login with return URL
      router.push(`/auth/login?returnTo=/request&lockerId=${selectedLocker}`);
    } else {
      router.push(`/request?lockerId=${selectedLocker}`);
    }
  };

  const availableCount = lockers.filter((l) => l.status === "available").length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Hero Section - Simplified */}
      <main className="mx-auto w-full max-w-7xl px-4 pb-20 pt-8 md:px-6 md:pt-12">
        <section className="text-center">
          <div className="mx-auto max-w-3xl">
            <h1 className="text-4xl font-bold leading-tight md:text-6xl lg:text-7xl">
              <span className="bg-gradient-to-r from-emerald-400 to-emerald-200 bg-clip-text text-transparent">
                เช่าตู้ล็อคเกอร์
              </span>
              <br />
              ง่ายๆ แค่ 3 ขั้นตอน
            </h1>
            <p className="mt-6 text-xl text-slate-300 md:text-2xl">
              เลือกตู้ → ชำระเงิน → รับ QR ส่งไรเดอร์
            </p>
            
            {/* Quick Stats */}
            <div className="mt-8 flex items-center justify-center gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-emerald-400">{availableCount}</div>
                <div className="text-sm text-slate-400">ตู้ว่าง</div>
              </div>
              <div className="h-12 w-px bg-slate-700"></div>
              <div className="text-center">
                <div className="text-3xl font-bold text-emerald-400">30 วิ</div>
                <div className="text-sm text-slate-400">เสร็จภายใน</div>
              </div>
              <div className="h-12 w-px bg-slate-700"></div>
              <div className="text-center">
                <div className="text-3xl font-bold text-emerald-400">฿30</div>
                <div className="text-sm text-slate-400">เริ่มต้น</div>
              </div>
            </div>
          </div>
        </section>


                {/* How it Works - Simplified */}
        <section className="mt-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">ง่ายแค่ 3 ขั้นตอน</h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                step: "1",
                icon: "🎯",
                title: "เลือกตู้",
                desc: "คลิกเลือกตู้ที่ต้องการ",
              },
              {
                step: "2",
                icon: "💳",
                title: "ชำระเงิน",
                desc: "ชำระผ่านระบบปลอดภัย",
              },
              {
                step: "3",
                icon: "📱",
                title: "ส่ง QR",
                desc: "รับ QR ส่งให้ไรเดอร์ทันที",
              },
            ].map((item) => (
              <div key={item.step} className="group rounded-3xl border border-slate-800 bg-slate-900/60 p-8 text-center transition hover:border-emerald-500/50">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-4xl">
                  {item.icon}
                </div>
                <div className="mb-2 text-5xl font-bold text-emerald-400">{item.step}</div>
                <h3 className="mb-2 text-xl font-bold">{item.title}</h3>
                <p className="text-slate-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Locker Selection - Main Focus */}
        <section className="mt-16">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold">เลือกตู้ที่ต้องการ</h2>
            <p className="mt-2 text-slate-400">คลิกที่ตู้เพื่อดูรายละเอียดและจอง</p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {lockers.map((locker) => {
              const isSelected = selectedLocker === locker.id;
              return (
                <LockerCard
                  key={locker.id}
                  locker={locker}
                  isSelected={isSelected}
                  onSelect={handleLockerSelect}
                />
              );
            })}
          </div>
        </section>

        {/* Booking Section */}
        {selectedLocker && (
          <section id="booking-section" className="mt-12 scroll-mt-8">
            <div className="mx-auto max-w-2xl rounded-3xl border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-slate-900/80 to-slate-950 p-8 shadow-2xl">
              <div className="text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-3xl">
                  ✓
                </div>
                <h3 className="mt-4 text-2xl font-bold">ตู้ที่เลือก: {selectedLocker}</h3>
                <p className="mt-2 text-slate-300">
                  ราคา ฿{lockers.find((l) => l.id === selectedLocker)?.price} / ครั้ง
                </p>

                <div className="mt-8 space-y-3">
                  <button
                    onClick={handleQuickBook}
                    className="group relative w-full overflow-hidden rounded-2xl bg-emerald-500 px-8 py-5 text-lg font-bold text-slate-900 transition hover:bg-emerald-400"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      {user ? "จองเลย" : "เข้าสู่ระบบเพื่อจอง"}
                      <svg className="h-5 w-5 transition group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </span>
                    <div className="absolute inset-0 -z-0 bg-gradient-to-r from-emerald-400 to-emerald-300 opacity-0 transition group-hover:opacity-100"></div>
                  </button>

                  <button
                    onClick={() => setSelectedLocker(null)}
                    className="w-full rounded-2xl border border-slate-600 px-8 py-3 text-sm font-semibold text-slate-300 transition hover:border-slate-400 hover:bg-slate-800/50"
                  >
                    เปลี่ยนตู้
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}


      </main>
    </div>
  );
}