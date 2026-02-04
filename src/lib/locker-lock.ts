"use client";

import { useEffect, useState } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { calculateOvertime, calculateOvertimeFee, type RentalDuration } from "@/constants/rental-pricing";
import { ActivityLogger } from "@/lib/activity-logger";

interface LockerLockCheckProps {
  requestId: string;
  onLockStatusChange?: (isLocked: boolean, overtimeFee: number) => void;
}

export function useLockerLockCheck(requestId: string | null) {
  const [isLocked, setIsLocked] = useState(false);
  const [overtimeFee, setOvertimeFee] = useState(0);
  const [overtimeHours, setOvertimeHours] = useState(0);

  useEffect(() => {
    if (!requestId) return;

    const checkLockStatus = async () => {
      try {
        const requestRef = doc(db, "requests", requestId);
        const requestSnap = await getDoc(requestRef);

        if (!requestSnap.exists()) return;

        const data = requestSnap.data();
        const deadline = data.deadline?.toDate();
        const rentalDuration = data.rentalDuration as RentalDuration;
        const currentLockStatus = data.isLocked || false;

        if (!deadline) return;

        const { isOvertime, overtimeHours } = calculateOvertime(deadline);

        if (isOvertime && !currentLockStatus) {
          // Lock the locker and calculate overtime fee
          const fee = calculateOvertimeFee(rentalDuration, overtimeHours);
          
          await updateDoc(requestRef, {
            isLocked: true,
            overtimeFee: fee,
            overtimeHours: overtimeHours,
          });

          // Log activity
          await ActivityLogger.lockerLocked(requestId, data.lockerId, fee);

          setIsLocked(true);
          setOvertimeFee(fee);
          setOvertimeHours(overtimeHours);
        } else if (currentLockStatus) {
          setIsLocked(true);
          setOvertimeFee(data.overtimeFee || 0);
          setOvertimeHours(data.overtimeHours || 0);
        }
      } catch (error) {
        console.error("Error checking lock status:", error);
      }
    };

    // Check immediately
    checkLockStatus();

    // Check every minute
    const interval = setInterval(checkLockStatus, 60000);

    return () => clearInterval(interval);
  }, [requestId]);

  return { isLocked, overtimeFee, overtimeHours };
}

export async function unlockLockerAfterPayment(requestId: string): Promise<boolean> {
  try {
    const requestRef = doc(db, "requests", requestId);
    const requestSnap = await getDoc(requestRef);
    const data = requestSnap.data();
    
    await updateDoc(requestRef, {
      isLocked: false,
      overtimeFeePaid: true,
    });

    // Log activity
    if (data?.lockerId) {
      await ActivityLogger.lockerUnlocked(requestId, data.lockerId);
    }
    
    return true;
  } catch (error) {
    console.error("Error unlocking locker:", error);
    return false;
  }
}
