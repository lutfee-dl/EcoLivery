import { collection, addDoc, serverTimestamp, query, orderBy, limit, getDocs, where } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";

export type LogLevel = "info" | "warning" | "error" | "success";
export type LogCategory = 
  | "auth" 
  | "request" 
  | "locker" 
  | "payment" 
  | "rider" 
  | "admin"
  | "system";

export interface ActivityLog {
  id?: string;
  userId: string;
  userEmail?: string;
  userRole?: string;
  category: LogCategory;
  action: string;
  level: LogLevel;
  details?: Record<string, any>;
  metadata?: {
    requestId?: string;
    lockerId?: string;
    riderId?: string;
    amount?: number;
    [key: string]: any;
  };
  ipAddress?: string;
  userAgent?: string;
  timestamp: any;
}

/**
 * บันทึก Activity Log ลง Firestore
 */
export async function logActivity(
  category: LogCategory,
  action: string,
  level: LogLevel = "info",
  details?: Record<string, any>,
  metadata?: ActivityLog["metadata"]
): Promise<void> {
  try {
    const user = auth.currentUser;
    const userAgent = typeof window !== "undefined" ? window.navigator.userAgent : "unknown";

    const logData: any = {
      userId: user?.uid || "anonymous",
      category,
      action,
      level,
      userAgent,
      timestamp: serverTimestamp(),
    };

    // เพิ่ม optional fields เฉพาะเมื่อมีค่า
    if (user?.email) logData.userEmail = user.email;
    if (details) logData.details = details;
    if (metadata) logData.metadata = metadata;

    await addDoc(collection(db, "activity_logs"), logData);
  } catch (error) {
    console.error("Failed to log activity:", error);
    // ไม่ throw error เพื่อไม่ให้กระทบการทำงานหลัก
  }
}

/**
 * ดึง Activity Logs (สำหรับ Admin)
 */
export async function getActivityLogs(
  filters?: {
    category?: LogCategory;
    level?: LogLevel;
    userId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }
): Promise<ActivityLog[]> {
  try {
    let q = query(
      collection(db, "activity_logs"),
      orderBy("timestamp", "desc")
    );

    if (filters?.category) {
      q = query(q, where("category", "==", filters.category));
    }

    if (filters?.level) {
      q = query(q, where("level", "==", filters.level));
    }

    if (filters?.userId) {
      q = query(q, where("userId", "==", filters.userId));
    }

    if (filters?.limit) {
      q = query(q, limit(filters.limit));
    } else {
      q = query(q, limit(100)); // Default limit
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as ActivityLog[];
  } catch (error) {
    console.error("Failed to get activity logs:", error);
    return [];
  }
}

/**
 * Helper functions สำหรับ log actions ต่างๆ
 */

export const ActivityLogger = {
  // Authentication
  login: (email: string, method: string) =>
    logActivity("auth", "login", "success", { email, method }),
  
  logout: () =>
    logActivity("auth", "logout", "info"),
  
  loginFailed: (email: string, reason: string) =>
    logActivity("auth", "login_failed", "error", { email, reason }),

  // Requests
  createRequest: (requestId: string, lockerId: string, price: number) =>
    logActivity("request", "create_request", "success", 
      { requestId, lockerId, price },
      { requestId, lockerId, amount: price }
    ),
  
  updateRequestStatus: (requestId: string, oldStatus: string, newStatus: string) =>
    logActivity("request", "update_status", "info",
      { requestId, oldStatus, newStatus },
      { requestId }
    ),

  // Locker
  lockerLocked: (requestId: string, lockerId: string, overtimeFee: number) =>
    logActivity("locker", "auto_locked", "warning",
      { requestId, lockerId, overtimeFee },
      { requestId, lockerId, amount: overtimeFee }
    ),
  
  lockerUnlocked: (requestId: string, lockerId: string) =>
    logActivity("locker", "unlocked", "success",
      { requestId, lockerId },
      { requestId, lockerId }
    ),

  // Payment
  paymentSuccess: (requestId: string, amount: number, method: string) =>
    logActivity("payment", "payment_success", "success",
      { requestId, amount, method },
      { requestId, amount }
    ),
  
  paymentFailed: (requestId: string, amount: number, reason: string) =>
    logActivity("payment", "payment_failed", "error",
      { requestId, amount, reason },
      { requestId, amount }
    ),

  overtimePayment: (requestId: string, overtimeFee: number) =>
    logActivity("payment", "overtime_payment", "success",
      { requestId, overtimeFee },
      { requestId, amount: overtimeFee }
    ),

  // Rider
  riderDropoff: (requestId: string, riderId: string, lockerId: string) =>
    logActivity("rider", "dropoff_completed", "success",
      { requestId, riderId, lockerId },
      { requestId, riderId, lockerId }
    ),
  
  riderApproved: (riderId: string, approvedBy: string) =>
    logActivity("rider", "approved", "success",
      { riderId, approvedBy },
      { riderId }
    ),

  riderRejected: (riderId: string, rejectedBy: string, reason?: string) =>
    logActivity("rider", "rejected", "warning",
      { riderId, rejectedBy, reason },
      { riderId }
    ),

  // Admin
  adminAction: (action: string, targetId: string, details?: any) =>
    logActivity("admin", action, "info", { targetId, ...details }),

  // System
  systemError: (error: string, context?: any) =>
    logActivity("system", "error", "error", { error, context }),
  
  systemWarning: (warning: string, context?: any) =>
    logActivity("system", "warning", "warning", { warning, context }),
};
