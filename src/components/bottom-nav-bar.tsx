"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import Cookies from "js-cookie";
import { auth } from "@/lib/firebase";
import { ROLE_COOKIE_NAME, type UserRole } from "@/lib/auth/roles";
import { User, LogOut, Home, Package, Truck, Settings, Clock } from "lucide-react";

export default function BottomNavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [showAccountMenu, setShowAccountMenu] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const userRole = Cookies.get(ROLE_COOKIE_NAME) as UserRole;
        setRole(userRole || "user");
      } else {
        setRole(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      Cookies.remove(ROLE_COOKIE_NAME);
      router.push("/");
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  const isActive = (path: string) => pathname === path;

  if (!user) return null;

  return (
    <>
      {/* Account Menu Modal */}
      {showAccountMenu && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setShowAccountMenu(false)}
        >
          <div 
            className="absolute bottom-0 left-0 right-0 rounded-t-3xl border-t-2 border-slate-700 bg-slate-950 pb-24"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-slate-800 px-6 py-6">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">บัญชีของฉัน</h3>
                <button
                  onClick={() => setShowAccountMenu(false)}
                  className="rounded-full bg-slate-800 p-2 text-slate-400 transition hover:bg-slate-700 hover:text-white active:scale-95"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-base text-slate-300">{user?.email || user?.phoneNumber || "ผู้ใช้"}</p>
              <p className="mt-2 text-sm text-emerald-400">
                บทบาท: {role === "admin" ? "แอดมิน" : role === "rider" ? "ไรเดอร์" : "ผู้ใช้"}
              </p>
            </div>
            
            <div className="space-y-2 px-4 pb-4">
              <button
                onClick={() => {
                  router.push("/account");
                  setShowAccountMenu(false);
                }}
                className="flex w-full items-center gap-3 rounded-xl bg-emerald-500/20 px-5 py-4 text-base font-semibold text-emerald-200 transition hover:bg-emerald-500/30 active:scale-98"
              >
                <User className="h-6 w-6" />
                ดูโปรไฟล์
              </button>

              {role === "user" && (
                <button
                  onClick={() => {
                    router.push("/history");
                    setShowAccountMenu(false);
                  }}
                  className="flex w-full items-center gap-3 rounded-xl bg-blue-500/20 px-5 py-4 text-base font-semibold text-blue-200 transition hover:bg-blue-500/30 active:scale-98"
                >
                  <Clock className="h-6 w-6" />
                  ประวัติการฝากของ
                </button>
              )}
              
              <button
                onClick={() => {
                  handleSignOut();
                  setShowAccountMenu(false);
                }}
                className="flex w-full items-center gap-3 rounded-xl bg-rose-500/20 px-5 py-4 text-base font-semibold text-rose-200 transition hover:bg-rose-500/30 active:scale-98"
              >
                <LogOut className="h-6 w-6" />
                ออกจากระบบ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-800/60 bg-slate-950/98 backdrop-blur-xl md:hidden safe-area-pb">
        <div className="flex items-center justify-around px-1 py-4">
          <Link
            href="/"
            className={`flex flex-1 flex-col items-center gap-1.5 rounded-xl px-3 py-3 transition-all active:scale-95 ${
              isActive("/")
                ? "text-emerald-400"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Home className="h-6 w-6" />
            <span className="text-xs font-semibold">หน้าหลัก</span>
          </Link>

          {role === "user" && (
            <Link
              href="/request"
              className={`flex flex-1 flex-col items-center gap-1.5 rounded-xl px-3 py-3 transition-all active:scale-95 ${
                isActive("/request")
                  ? "text-emerald-400"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Package className="h-6 w-6" />
              <span className="text-xs font-semibold">จองตู้</span>
            </Link>
          )}

          {role === "rider" && (
            <Link
              href="/dropoff"
              className={`flex flex-1 flex-col items-center gap-1.5 rounded-xl px-3 py-3 transition-all active:scale-95 ${
                isActive("/dropoff")
                  ? "text-emerald-400"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Truck className="h-6 w-6" />
              <span className="text-xs font-semibold">ส่งของ</span>
            </Link>
          )}

          {role === "admin" && (
            <Link
              href="/manage"
              className={`flex flex-1 flex-col items-center gap-1.5 rounded-xl px-3 py-3 transition-all active:scale-95 ${
                isActive("/manage")
                  ? "text-emerald-400"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Settings className="h-6 w-6" />
              <span className="text-xs font-semibold">จัดการ</span>
            </Link>
          )}

          <button
            onClick={() => setShowAccountMenu(!showAccountMenu)}
            className={`flex flex-1 flex-col items-center gap-1.5 rounded-xl px-3 py-3 transition-all active:scale-95 ${
              showAccountMenu
                ? "text-emerald-400"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <User className="h-6 w-6" />
            <span className="text-xs font-semibold">บัญชี</span>
          </button>
        </div>
      </div>
    </>
  );
}
