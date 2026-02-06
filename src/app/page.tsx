"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import Cookies from "js-cookie";
import { auth, db } from "@/lib/firebase";
import { ROLE_COOKIE_NAME, type UserRole } from "@/lib/auth/roles";
import LockerCard from "@/components/ui/locker-card";
import { ArrowRight, X, MousePointer2, CreditCard, QrCode } from "lucide-react";
import type { Locker } from "@/types/locker";

export default function Home() {
  const router = useRouter();
  const bookingSectionRef = useRef<HTMLDivElement>(null);
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [selectedLocker, setSelectedLocker] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [lockers, setLockers] = useState<Locker[]>([]);
  const [loading, setLoading] = useState(true);

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

  // Real-time listener สำหรับ lockers
  useEffect(() => {
    const q = query(collection(db, "lockers"), orderBy("name"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const lockerData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Locker[];
      setLockers(lockerData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLockerSelect = (lockerId: string) => {
    setSelectedLocker(lockerId);
    setShowModal(true);
    
    // Scroll to booking section smoothly
    setTimeout(() => {
      bookingSectionRef.current?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
    }, 100);
  };

  const handleQuickBook = () => {
    if (!selectedLocker) {
      alert("กรุณาเลือกตู้ก่อน");
      return;
    }
    
    setShowModal(false);
    
    if (!user) {
      // Redirect to login with return URL
      router.push(`/auth/login?returnTo=/request&lockerId=${selectedLocker}`);
    } else {
      router.push(`/request?lockerId=${selectedLocker}`);
    }
  };

  const handleChangeLocker = () => {
    setSelectedLocker(null);
    setShowModal(false);
  };

  const selectedLockerData = selectedLocker ? lockers.find(l => l.id === selectedLocker) : null;

  const availableCount = lockers.filter((l) => l.available).length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white pb-20 md:pb-0">
      {/* Hero Section - Simplified */}
      <main className="mx-auto w-full max-w-7xl px-4 pb-20 pt-6 md:px-6 md:pt-12">
        <section className="text-center">
          <div className="mx-auto max-w-3xl">
            <h1 className="text-3xl font-bold leading-tight md:text-6xl lg:text-7xl">
              <span className="bg-gradient-to-r from-emerald-400 to-emerald-200 bg-clip-text text-transparent">
                เช่าตู้ล็อคเกอร์
              </span>
              <br />
              ง่ายๆ แค่ 3 ขั้นตอน
            </h1>
            <p className="mt-4 text-lg text-slate-300 md:text-2xl">
              เลือกตู้ → ชำระเงิน → รับ QR ส่งไรเดอร์
            </p>
            
            {/* Quick Stats */}
            <div className="mt-6 md:mt-8 flex items-center justify-center gap-4 md:gap-6">
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
                <div className="text-3xl font-bold text-emerald-400">฿19</div>
                <div className="text-sm text-slate-400">เริ่มต้น</div>
              </div>
            </div>
          </div>
        </section>


                {/* How it Works - Simplified */}
        <section className="mt-20">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              ใช้งานง่ายใน <span className="text-emerald-400">3 ขั้นตอน</span>
            </h2>
            <p className="text-slate-400">
              ระบบอัตโนมัติที่ช่วยให้คุณจัดการพัสดุได้สะดวกและปลอดภัยที่สุด
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3 max-w-6xl mx-auto">
            {[
              {
                step: "01",
                icon: MousePointer2,
                title: "เลือกตู้ที่ใช่",
                desc: "ค้นหาและคลิกเลือกตู้ที่ต้องการใช้งาน บนแผนที่หรือรายการ",
              },
              {
                step: "02",
                icon: CreditCard,
                title: "ชำระเงินปลอดภัย",
                desc: "รองรับการชำระเงินหลากหลายช่องทาง รวดเร็วและปลอดภัย",
              },
              {
                step: "03",
                icon: QrCode,
                title: "ส่ง QR ให้ไรเดอร์",
                desc: "รับ QR Code ทันทีหลังชำระเงิน ส่งต่อให้ไรเดอร์เปิดตู้ได้เลย",
              },
            ].map((item, index) => (
              <div
                key={index}
                className="group relative rounded-2xl border border-slate-800 bg-slate-900 p-8 transition-all duration-300 hover:-translate-y-2 hover:border-emerald-500/50 hover:shadow-xl hover:shadow-emerald-500/10"
              >
                {/* Step Number Badge */}
                <div className="absolute top-4 right-4 text-4xl font-black text-slate-800/50 transition-colors group-hover:text-emerald-500/10">
                  {item.step}
                </div>

                {/* Icon Container */}
                <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-800 text-emerald-400 ring-1 ring-white/10 transition-all duration-300 group-hover:scale-110 group-hover:bg-emerald-500 group-hover:text-white group-hover:ring-emerald-400">
                  <item.icon className="h-8 w-8" />
                </div>

                {/* Content */}
                <h3 className="mb-3 text-xl font-bold text-slate-100 group-hover:text-emerald-400 transition-colors">
                  {item.title}
                </h3>
                <p className="text-slate-400 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Locker Selection - Main Focus */}
        <section className="mt-16 mb-24">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold">เลือกตู้ที่ต้องการ</h2>
            <p className="mt-3 text-base md:text-lg text-slate-400">แตะที่ตู้เพื่อดูรายละเอียดและจอง</p>
          </div>

          <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
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
        {/* {selectedLocker && (
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
                      <ArrowRight className="h-5 w-5 transition group-hover:translate-x-1" />
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
        )} */}

        {/* Modal */}
        {showModal && selectedLockerData && (
          <div 
            ref={bookingSectionRef}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/10 backdrop-blur-xs"
            onClick={() => setShowModal(false)}
          >
            <div 
              className="relative mx-4 w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-8 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={() => setShowModal(false)}
                className="cursor-pointer absolute right-4 top-4 rounded-lg p-1 text-slate-400 transition hover:bg-slate-800 hover:text-white"
              >
                <X className="h-6 w-6" />
              </button>

              {/* Content */}
              <div className="text-center">
                <div className="mb-6">
                  <div className="text-sm font-semibold uppercase tracking-wider text-emerald-400">
                    ตู้ที่เลือก
                  </div>
                  <div>
                    <span className="text-3xl font-bold text-white">{selectedLockerData.name}</span>
                  </div>
                  
                  {/* Custom Locker Display for Modal */}
                  <div className="mt-2 flex justify-center">
                    <div 
                      className="relative w-64 h-80 rounded-2xl transition-all duration-300"
                      style={{
                        perspective: "1000px",
                        transformStyle: "preserve-3d",
                        transform: "rotateY(-5deg)",
                      }}
                    >
                      {/* Main Locker Body */}
                      <div className="absolute inset-0 rounded-2xl border-2 border-emerald-400 bg-gradient-to-br from-emerald-500/20 via-slate-800 to-slate-900 shadow-2xl shadow-emerald-500/30">
                        {/* Door Panel */}
                        <div className="relative h-full w-full overflow-hidden rounded-2xl p-4">
                          {/* Top Section - Locker ID */}
                          <div className="mb-3 flex items-start justify-between">
                            <div>
                              <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Locker</div>
                              <div className="text-3xl font-black text-white">{selectedLockerData.id}</div>
                            </div>
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 shadow-lg">
                              <svg className="h-4 w-4 text-slate-900" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          </div>

                          {/* Door Vent Slots */}
                          <div className="mb-4 space-y-2">
                            {[...Array(4)].map((_, i) => (
                              <div key={i} className="flex gap-1">
                                {[...Array(8)].map((_, j) => (
                                  <div key={j} className="h-1 flex-1 rounded-full bg-slate-700/50"></div>
                                ))}
                              </div>
                            ))}
                          </div>

                          {/* Door Handle */}
                          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500 shadow-lg shadow-emerald-500/50">
                              <div className="h-8 w-1.5 rounded-full bg-slate-900"></div>
                            </div>
                          </div>

                          {/* Bottom Info */}
                          <div className="absolute bottom-4 left-4 right-4">
                            <div className="flex items-end justify-between">
                              <div>
                                <span className="rounded-full bg-slate-950/80 px-2.5 py-1 text-xs font-semibold text-slate-300">
                                  {selectedLockerData.size === 'S' ? 'เล็ก' : selectedLockerData.size === 'M' ? 'กลาง' : selectedLockerData.size === 'L' ? 'ใหญ่' : 'ใหญ่พิเศษ'}
                                </span>
                              </div>
                              <div>
                                <span className="rounded-full bg-emerald-500/30 px-2.5 py-1 text-xs font-bold text-emerald-200 shadow-lg shadow-emerald-500/20">
                                  AVAILABLE
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Hinges */}
                        <div className="absolute left-0 top-4 flex flex-col gap-4">
                          <div className="h-6 w-2 rounded-r-md bg-slate-600"></div>
                          <div className="h-6 w-2 rounded-r-md bg-slate-600"></div>
                        </div>
                        <div className="absolute bottom-4 left-0">
                          <div className="h-6 w-2 rounded-r-md bg-slate-600"></div>
                        </div>

                        {/* Side Shadow for 3D effect */}
                        <div
                          className="absolute -right-2 top-2 h-full w-2 rounded-r-lg bg-gradient-to-r from-slate-950/50 to-transparent"
                          style={{ transform: "translateZ(-10px)" }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Buttons */}
                <div className="space-y-3">
                  <button
                    onClick={handleQuickBook}
                    className="group relative w-full overflow-hidden rounded-xl bg-emerald-500 px-8 py-4 font-bold text-slate-900 shadow-lg shadow-emerald-500/30 transition hover:shadow-emerald-500/50"
                  >
                    <span className="cursor-pointer relative z-10 flex items-center justify-center gap-2">
                      {user ? "ดำเนินการจองเลย" : "เข้าสู่ระบบเพื่อจอง"}
                      <ArrowRight className="h-5 w-5 transition group-hover:translate-x-1" />
                    </span>
                  </button>

                  <button
                    onClick={handleChangeLocker}
                    className="cursor-pointer w-full rounded-xl border border-slate-600 px-8 py-4 font-semibold text-slate-300 transition hover:border-slate-400 hover:bg-slate-800/50"
                  >
                    เปลี่ยนตู้
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}