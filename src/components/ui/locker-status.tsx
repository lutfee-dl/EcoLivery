"use client";

import { useLockerLockCheck } from "@/lib/locker-lock";
import { RENTAL_PLANS } from "@/constants/rental-pricing";
import { AlertCircle, Clock, Lock } from "lucide-react";

interface LockerStatusProps {
  requestId: string;
  deadline?: any;
  rentalDuration?: string;
  isLocked?: boolean;
  overtimeFee?: number;
  overtimeHours?: number;
}

export function LockerStatus({ 
  requestId, 
  deadline, 
  rentalDuration,
  isLocked: initialLocked,
  overtimeFee: initialFee,
  overtimeHours: initialHours
}: LockerStatusProps) {
  const { isLocked, overtimeFee, overtimeHours } = useLockerLockCheck(requestId);

  // Use real-time data if available, otherwise use initial props
  const locked = isLocked || initialLocked;
  const fee = overtimeFee || initialFee || 0;
  const hours = overtimeHours || initialHours || 0;

  if (!locked && !deadline) return null;

  const deadlineDate = deadline?.toDate ? deadline.toDate() : deadline;
  const timeRemaining = deadlineDate ? deadlineDate.getTime() - Date.now() : 0;
  const hoursRemaining = Math.max(0, Math.floor(timeRemaining / (1000 * 60 * 60)));

  return (
    <div className="mt-4">
      {/* Deadline Info - Only when NOT locked */}
      {deadlineDate && !locked && (
        <div className={`rounded-2xl border-2 p-4 ${
          hoursRemaining < 3 
            ? "border-amber-500/50 bg-gradient-to-r from-amber-100 to-orange-50 dark:from-amber-500/15 dark:to-orange-500/10" 
            : "border-emerald-500/30 bg-emerald-100 dark:bg-emerald-500/5"
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                hoursRemaining < 3 ? "bg-amber-500/20" : "bg-emerald-500/20"
              }`}>
                <Clock className={`h-5 w-5 ${hoursRemaining < 3 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}`} />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  {hoursRemaining < 3 ? "⚠️ ใกล้หมดเวลา" : "หมดเวลา"}
                </p>
                <p className={`text-lg font-bold ${hoursRemaining < 3 ? "text-amber-700 dark:text-amber-300" : "text-emerald-700 dark:text-emerald-300"}`}>
                  {deadlineDate.toLocaleString('th-TH', {
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
            {hoursRemaining > 0 && (
              <div className={`rounded-xl px-4 py-2 ${
                hoursRemaining < 3 ? "bg-amber-500/20" : "bg-emerald-500/20"
              }`}>
                <p className="text-xs text-slate-600 dark:text-slate-400">เหลือเวลา</p>
                <p className={`text-xl font-black ${hoursRemaining < 3 ? "text-amber-700 dark:text-amber-300" : "text-emerald-700 dark:text-emerald-300"}`}>
                  {hoursRemaining}h
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Locked Warning - Critical State */}
      {locked && (
        <div className="overflow-hidden rounded-3xl border-2 border-rose-500 bg-gradient-to-br from-rose-100 to-red-50 dark:from-rose-500/20 dark:via-rose-500/10 dark:to-red-500/5">
          <div className="bg-rose-500/30 dark:bg-rose-500/20 px-4 py-2">
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-rose-600 dark:text-rose-400" />
              <p className="text-sm font-bold uppercase tracking-wide text-rose-700 dark:text-rose-300">
                ⚠️ ตู้ถูกล็อค
              </p>
            </div>
          </div>
          
          <div className="p-5">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-rose-500/30">
                <AlertCircle className="h-8 w-8 text-rose-600 dark:text-rose-400" />
              </div>
              
              <div className="flex-1">
                <p className="text-base font-semibold text-rose-700 dark:text-rose-200">
                  เกินเวลากำหนด {hours} ชั่วโมง
                </p>
                <p className="mt-1 text-sm text-rose-600 dark:text-rose-300/80">
                  กรุณาชำระค่าปรับเพื่อปลดล็อคและรับของ
                </p>
                
                <div className="mt-4 rounded-2xl bg-rose-500/30 p-4">
                  <p className="text-sm font-medium text-rose-700 dark:text-rose-200">ค่าปรับทั้งหมด</p>
                  <p className="mt-1 font-mono text-4xl font-black text-rose-800 dark:text-rose-100">฿{fee}</p>
                  <p className="mt-1 text-xs text-rose-600 dark:text-rose-300/70">
                    ฿10/ชั่วโมง × {hours} ชั่วโมง
                  </p>
                </div>
                
                <button 
                  onClick={() => alert('ระบบชำระเงินกำลังพัฒนา')}
                  className="mt-4 w-full rounded-2xl bg-gradient-to-r from-rose-500 to-red-500 py-4 text-lg font-bold text-white shadow-md transition hover:scale-[1.02] hover:shadow-rose-500/50"
                >
                  ชำระค่าปรับเพื่อปลดล็อค
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
