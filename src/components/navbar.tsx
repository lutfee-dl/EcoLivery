"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import Cookies from "js-cookie";
import { auth } from "@/lib/firebase";
import { ROLE_COOKIE_NAME, type UserRole } from "@/lib/auth/roles";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const userRole = Cookies.get(ROLE_COOKIE_NAME) as UserRole;
        setRole(userRole || "user");
      } else {
        setRole(null);
      }
      setIsLoading(false);
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

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-800/60 bg-slate-950/95 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 md:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg">
            <span className="text-sm font-black text-slate-900">EL</span>
          </div>
          <div className="hidden sm:block">
            <div className="text-lg font-bold text-white">EcoLivery</div>
            <div className="-mt-1 text-[10px] uppercase tracking-widest text-emerald-400">Locker System</div>
          </div>
        </Link>

        {/* Desktop Menu - Super Simple */}
        <div className="hidden items-center gap-3 md:flex">
          <ThemeToggle />
          {isLoading ? (
            <div className="h-9 w-32 animate-pulse rounded-lg bg-slate-800"></div>
          ) : user ? (
            <>
              <Link
                href="/dashboard"
                className={`rounded-lg px-5 py-2 text-sm font-semibold transition ${
                  isActive("/dashboard")
                    ? "bg-emerald-500 text-slate-900 shadow-lg shadow-emerald-500/30"
                    : "bg-slate-800 text-white hover:bg-slate-700"
                }`}
              >
                หน้าหลัก
              </Link>

              {role === "user" && (
                <Link
                  href="/request"
                  className={`rounded-lg px-5 py-2 text-sm font-semibold transition ${
                    isActive("/request")
                      ? "bg-slate-800 text-white"
                      : "text-slate-300 hover:text-white"
                  }`}
                >
                  จองตู้
                </Link>
              )}

              {role === "rider" && (
                <Link
                  href="/dropoff"
                  className={`rounded-lg px-5 py-2 text-sm font-semibold transition ${
                    isActive("/dropoff")
                      ? "bg-slate-800 text-white"
                      : "text-slate-300 hover:text-white"
                  }`}
                >
                  ส่งของ
                </Link>
              )}

              {role === "admin" && (
                <Link
                  href="/manage"
                  className={`rounded-lg px-5 py-2 text-sm font-semibold transition ${
                    isActive("/manage")
                      ? "bg-slate-800 text-white"
                      : "text-slate-300 hover:text-white"
                  }`}
                >
                  จัดการ
                </Link>
              )}

              <button
                onClick={handleSignOut}
                className="cursor-pointer rounded-full border border-rose-500 px-4 py-2 text-xs font-semibold text-rose-200 transition hover:bg-rose-500"
              >
                ออกจากระบบ
              </button>
            {/* <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs text-slate-400">เข้าสู่ระบบด้วย</p>
              <p className="text-sm font-medium">{user?.email || user?.phoneNumber || "ผู้ใช้"}</p>
            </div>
            <button
              onClick={() => {
                auth.signOut();
                Cookies.remove(ROLE_COOKIE_NAME);
                router.push("/");
              }}
              className="rounded-full border border-rose-500 px-4 py-2 text-xs font-semibold text-rose-200 transition hover:bg-rose-500/10"
            >
              ออกจากระบบ
            </button>
          </div> */}
            </>
          ) : (
            <Link
              href="/auth/login"
              className="rounded-lg bg-emerald-500 px-6 py-2 text-sm font-bold text-slate-900 shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-400"
            >
              เข้าสู่ระบบ
            </Link>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="rounded-lg bg-slate-800 p-2 text-white transition hover:bg-slate-700"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {showMobileMenu ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {showMobileMenu && (
        <div className="border-t border-slate-800 bg-slate-950/95 px-4 py-3 md:hidden">
          {isLoading ? (
            <div className="h-12 w-full animate-pulse rounded-lg bg-slate-800"></div>
          ) : user ? (
            <div className="space-y-2">
              <Link
                href="/dashboard"
                onClick={() => setShowMobileMenu(false)}
                className={`block rounded-lg px-4 py-3 text-center font-semibold transition ${
                  isActive("/dashboard")
                    ? "bg-emerald-500 text-slate-900"
                    : "bg-slate-800 text-white"
                }`}
              >
                หน้าหลัก
              </Link>

              {role === "user" && (
                <Link
                  href="/request"
                  onClick={() => setShowMobileMenu(false)}
                  className="block rounded-lg bg-slate-800 px-4 py-3 text-center font-semibold text-white"
                >
                  จองตู้
                </Link>
              )}

              {role === "rider" && (
                <Link
                  href="/dropoff"
                  onClick={() => setShowMobileMenu(false)}
                  className="block rounded-lg bg-slate-800 px-4 py-3 text-center font-semibold text-white"
                >
                  ส่งของ
                </Link>
              )}

              {role === "admin" && (
                <Link
                  href="/manage"
                  onClick={() => setShowMobileMenu(false)}
                  className="block rounded-lg bg-slate-800 px-4 py-3 text-center font-semibold text-white"
                >
                  จัดการ
                </Link>
              )}

              <button
                onClick={() => {
                  handleSignOut();
                  setShowMobileMenu(false);
                }}
                className="w-full rounded-lg px-4 py-3 text-center font-semibold text-slate-400"
              >
                ออก
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              onClick={() => setShowMobileMenu(false)}
              className="block rounded-lg bg-emerald-500 px-4 py-3 text-center font-bold text-slate-900"
            >
              เข้าสู่ระบบ
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
