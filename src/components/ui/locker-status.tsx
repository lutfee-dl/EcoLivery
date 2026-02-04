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
    <div className="mt-4 space-y-3">
      {/* Deadline Info */}
      {deadlineDate && !locked && (
        <div className={`rounded-xl border p-3 ${
          hoursRemaining < 3 
            ? "border-amber-500/50 bg-amber-500/10" 
            : "border-slate-700 bg-slate-800/50"
        }`}>
          <div className="flex items-center gap-2">
            <Clock className={`h-4 w-4 ${hoursRemaining < 3 ? "text-amber-400" : "text-slate-400"}`} />
            <div className="flex-1">
              <p className="text-xs text-slate-400">เวลาหมดอายุ</p>
              <p className={`text-sm font-bold ${hoursRemaining < 3 ? "text-amber-300" : "text-slate-200"}`}>
                {deadlineDate.toLocaleString('th-TH')}
              </p>
              {hoursRemaining > 0 && (
                <p className="text-xs text-slate-500">
                  เหลือเวลา {hoursRemaining} ชั่วโมง
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Locked Warning */}
      {locked && (
        <div className="rounded-xl border-2 border-red-500/50 bg-red-500/10 p-4">
          <div className="flex items-start gap-3">
            <Lock className="h-6 w-6 text-red-400 mt-0.5" />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <p className="font-bold text-red-300">ตู้ถูกล็อค</p>
              </div>
              <p className="mt-2 text-sm text-red-200">
                คุณรับของเกินเวลา {hours} ชั่วโมง
              </p>
              <div className="mt-3 rounded-lg bg-red-500/20 p-3">
                <p className="text-xs text-red-200">ค่าปรับเกินเวลา</p>
                <p className="text-2xl font-black text-red-300">฿{fee}</p>
              </div>
              <button className="mt-3 w-full rounded-lg bg-red-500 px-4 py-2 font-bold text-white transition hover:bg-red-400">
                ชำระค่าปรับเพื่อปลดล็อค
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
