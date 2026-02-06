"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import Cookies from "js-cookie";
import { auth } from "@/lib/firebase";
import { ROLE_COOKIE_NAME, type UserRole } from "@/lib/auth/roles";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { User, LogOut, ChevronDown, Home, Users } from "lucide-react";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
          {isLoading ? (
            <div className="h-9 w-32 animate-pulse rounded-lg bg-slate-800"></div>
          ) : user ? (
            <>

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

              {/* User Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
                >
                  <User className="h-4 w-4" />
                  <span className="max-w-[120px] truncate">{user?.email || user?.phoneNumber || "ผู้ใช้"}</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${showDropdown ? "rotate-180" : ""}`} />
                </button>

                {/* Dropdown Menu */}
                {showDropdown && (
                  <div className="absolute right-0 top-full mt-2 w-64 rounded-xl border border-slate-700 bg-slate-900 shadow-2xl">
                    <div className="border-b border-slate-800 px-4 py-3">
                      <p className="mt-1 truncate text-sm font-medium text-white">{user?.email || user?.phoneNumber || "ผู้ใช้"}</p>
                    </div>
                    <div className="p-2">
                      <button
                        onClick={() => {
                          setShowDropdown(false);
                          router.push('/account');
                        }}
                        className="flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium text-emerald-400 transition hover:bg-emerald-500/10"
                      >
                        <Users className="h-4 w-4" />
                        โปรไฟล์ของฉัน
                      </button>
                    </div>
                    <div className="p-2">
                      <button
                        onClick={() => {
                          setShowDropdown(false);
                          router.push('/dashboard');
                        }}
                        className="flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium text-emerald-400 transition hover:bg-emerald-500/10"
                      >
                        <Home className="h-4 w-4" />
                        ประวัติของฉัน
                      </button>
                    </div>
                    <div className="p-2">
                      <button
                        onClick={() => {
                          handleSignOut();
                          setShowDropdown(false);
                        }}
                        className="flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium text-rose-200 transition bg-rose-500/10 hover:bg-rose-600/20"
                      >
                        <LogOut className="h-4 w-4" />
                        ออกจากระบบ
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <Link
              href="/auth/login"
              className="rounded-lg bg-emerald-500 px-6 py-2 text-sm font-bold text-slate-900 shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-400"
            >
              เข้าสู่ระบบ
            </Link>
          )}
          <ThemeToggle />
        </div>

        {/* Mobile Menu - Simplified (Only Theme Toggle and Login/Email) */}
        <div className="flex items-center gap-2 md:hidden">
          {isLoading ? (
            <div className="h-9 w-20 animate-pulse rounded-lg bg-slate-800"></div>
          ) : user ? (
            <div className="max-w-[150px] truncate text-sm text-white">
              {user?.email || user?.phoneNumber || "ผู้ใช้"}
            </div>
          ) : (
            <Link
              href="/auth/login"
              className="rounded-lg bg-emerald-500 px-4 py-2 text-xs font-bold text-slate-900 shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-400"
            >
              เข้าสู่ระบบ
            </Link>
          )}
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}
