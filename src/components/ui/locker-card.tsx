"use client";

import type { Locker } from "@/types/locker";
import { LOCKER_SIZE_LABELS, LOCKER_SIZE_HEIGHTS } from "@/constants/lockers";

interface LockerCardProps {
  locker: Locker;
  isSelected?: boolean;
  onSelect?: (lockerId: string) => void;
}

export default function LockerCard({ locker, isSelected = false, onSelect }: LockerCardProps) {
  // ใช้ available แทน status เพราะข้อมูลจาก Firestore
  const isAvailable = locker.available !== false; // default เป็น true ถ้าไม่มี field

  const handleClick = () => {
    if (isAvailable && onSelect) {
      onSelect(locker.id);
    }
  };

  return (
    <button
      disabled={!isAvailable}
      onClick={handleClick}
      className={`cursor-pointer group relative text-left transition-all duration-300 w-full ${
        isSelected ? "scale-105 ring-4 ring-emerald-400/50" : isAvailable ? "hover:scale-105 active:scale-98" : "cursor-not-allowed opacity-60"
      }`}
      style={{ perspective: "1000px" }}
    >
      {/* 3D Locker Container */}
      <div
        className={`relative ${LOCKER_SIZE_HEIGHTS[locker.size]} rounded-3xl transition-all duration-300`}
        style={{
          transformStyle: "preserve-3d",
          transform: isSelected ? "rotateY(-5deg)" : "rotateY(0deg)",
        }}
      >
        {/* Main Locker Body */}
        <div
          className={`absolute inset-0 rounded-3xl border-2 transition-all ${
            isSelected
              ? "border-emerald-400 bg-gradient-to-br from-emerald-500/20 via-slate-800 to-slate-900 shadow-2xl shadow-emerald-500/40"
              : isAvailable
              ? "border-slate-700 bg-gradient-to-br from-slate-800 via-slate-850 to-slate-900 shadow-lg group-hover:border-emerald-500/50"
              : "border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950"
          }`}
        >
          {/* Door Panel */}
          <div className="relative h-full w-full overflow-hidden rounded-3xl p-4">
            {/* Top Section - Locker ID */}
            <div className="mb-3 flex items-start justify-between">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Locker</div>
                <div className="text-2xl md:text-3xl font-black text-white">{locker.id}</div>
              </div>
              {isSelected && (
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 shadow-lg animate-pulse">
                  <svg className="h-4 w-4 text-slate-900" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
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
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl transition-all ${
                isSelected
                  ? "bg-emerald-500 shadow-lg shadow-emerald-500/50"
                  : "bg-slate-700 group-hover:bg-slate-600"
              }`}>
                <div className={`h-8 w-1.5 rounded-full ${
                  isSelected ? "bg-slate-900" : "bg-slate-500"
                }`}></div>
              </div>
            </div>

            {/* Bottom Info */}
            <div className="absolute bottom-4 left-4 right-4">
              <div className="flex items-end justify-between">
                <div>
                  <span className="rounded-full bg-slate-950/80 px-2.5 py-1 text-xs font-semibold text-slate-300">
                    {LOCKER_SIZE_LABELS[locker.size]}
                  </span>
                </div>
                <div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                      isAvailable
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "bg-slate-800 text-slate-500"
                    }`}
                  >
                    {isAvailable ? "ว่าง" : "ไม่ว่าง"}
                  </span>
                </div>
              </div>
            </div>

            {/* Price Tag */}
            {/* {isAvailable && (
              <div className="absolute right-4 top-4">
                <div className={`rounded-lg px-3 py-1.5 text-right shadow-lg ${
                  isSelected
                    ? "bg-emerald-500 text-slate-900"
                    : "bg-slate-950/90 text-emerald-400 group-hover:bg-emerald-500/20"
                }`}>
                  <div className="text-xs font-semibold opacity-80">ราคา</div>
                  <div className="text-xl font-black">฿{locker.price}</div>
                </div>
              </div>
            )} */}
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
    </button>
  );
}
