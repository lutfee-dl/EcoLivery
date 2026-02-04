# Firebase Cloud Functions Setup Guide

## Overview
ระบบ EcoLivery ต้องการ Cloud Functions สำหรับการทำงานต่อไปนี้:

1. **Auto-Lock System** - ตรวจสอบและล็อคตู้อัตโนมัติเมื่อเกินเวลา
2. **Activity Logging** - บันทึก log อัตโนมัติจาก Firestore triggers
3. **Custom Claims** - จัดการ role ของผู้ใช้ (user/rider/admin)

## Installation

### 1. ติดตั้ง Firebase CLI
```bash
npm install -g firebase-tools
firebase login
```

### 2. Initialize Functions
```bash
firebase init functions
```

เลือก:
- TypeScript
- ESLint enabled
- Install dependencies

### 3. Install Dependencies
```bash
cd functions
npm install firebase-admin
npm install @google-cloud/firestore
```

## Cloud Functions

### 1. Auto-Lock Scheduled Function
สร้างไฟล์ `functions/src/autoLock.ts`:

```typescript
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

export const autoLockExpiredLockers = functions.pubsub
  .schedule("every 1 minutes")
  .timeZone("Asia/Bangkok")
  .onRun(async (context) => {
    const db = admin.firestore();
    const now = new Date();
    
    try {
      // ค้นหา requests ที่เลยเวลาและยังไม่ lock
      const snapshot = await db
        .collection("requests")
        .where("deadline", "<", now)
        .where("isLocked", "==", false)
        .where("status", "in", ["paid", "in_locker"])
        .get();

      const batch = db.batch();
      const locks: any[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        const deadline = data.deadline.toDate();
        const rentalDuration = data.rentalDuration;
        
        // คำนวณค่าปรับ
        const overtimeMs = now.getTime() - deadline.getTime();
        const overtimeHours = Math.ceil(overtimeMs / (1000 * 60 * 60));
        
        // อัตราค่าปรับต่อชั่วโมง
        const overtimeRates: { [key: string]: number } = {
          "3h": 5,
          "6h": 5,
          "12h": 10,
          "1d": 10,
          "3d": 15,
          "7d": 15,
        };
        
        const overtimeRate = overtimeRates[rentalDuration] || 10;
        const overtimeFee = overtimeHours * overtimeRate;

        // อัพเดท document
        batch.update(doc.ref, {
          isLocked: true,
          overtimeFee,
          overtimeHours,
          lockedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // บันทึก log
        locks.push({
          requestId: doc.id,
          lockerId: data.lockerId,
          overtimeFee,
          overtimeHours,
        });
      });

      await batch.commit();

      // สร้าง activity logs
      const logBatch = db.batch();
      locks.forEach((lock) => {
        const logRef = db.collection("activity_logs").doc();
        logBatch.set(logRef, {
          userId: "system",
          userRole: "system",
          category: "locker",
          action: "auto_locked",
          level: "warning",
          details: {
            requestId: lock.requestId,
            lockerId: lock.lockerId,
            overtimeFee: lock.overtimeFee,
            overtimeHours: lock.overtimeHours,
          },
          metadata: {
            requestId: lock.requestId,
            lockerId: lock.lockerId,
            amount: lock.overtimeFee,
          },
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });
      });
      await logBatch.commit();

      console.log(`Locked ${locks.length} expired lockers`);
      return null;
    } catch (error) {
      console.error("Error in autoLockExpiredLockers:", error);
      throw error;
    }
  });
```

### 2. Firestore Triggers for Logging
สร้างไฟล์ `functions/src/activityLoggers.ts`:

```typescript
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

// Log เมื่อสร้าง request ใหม่
export const onRequestCreated = functions.firestore
  .document("requests/{requestId}")
  .onCreate(async (snapshot, context) => {
    const data = snapshot.data();
    const requestId = context.params.requestId;

    await admin.firestore().collection("activity_logs").add({
      userId: data.customerId || "unknown",
      userEmail: data.customerEmail,
      userRole: "user",
      category: "request",
      action: "create_request",
      level: "success",
      details: {
        requestId,
        lockerId: data.lockerId,
        price: data.price,
        rentalDuration: data.rentalDuration,
      },
      metadata: {
        requestId,
        lockerId: data.lockerId,
        amount: data.price,
      },
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });
  });

// Log เมื่ออัพเดทสถานะ request
export const onRequestUpdated = functions.firestore
  .document("requests/{requestId}")
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    const requestId = context.params.requestId;

    // ตรวจสอบการเปลี่ยนแปลงสถานะ
    if (before.status !== after.status) {
      let action = "update_status";
      let level: "info" | "success" | "warning" = "info";

      if (after.status === "in_locker") {
        action = "rider_dropoff";
        level = "success";
      } else if (after.status === "completed") {
        action = "customer_pickup";
        level = "success";
      }

      await admin.firestore().collection("activity_logs").add({
        userId: after.riderId || after.customerId || "unknown",
        userRole: after.status === "in_locker" ? "rider" : "user",
        category: "request",
        action,
        level,
        details: {
          requestId,
          oldStatus: before.status,
          newStatus: after.status,
          lockerId: after.lockerId,
        },
        metadata: {
          requestId,
          lockerId: after.lockerId,
        },
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    // ตรวจสอบการล็อค
    if (!before.isLocked && after.isLocked) {
      await admin.firestore().collection("activity_logs").add({
        userId: "system",
        userRole: "system",
        category: "locker",
        action: "locker_locked",
        level: "warning",
        details: {
          requestId,
          lockerId: after.lockerId,
          overtimeFee: after.overtimeFee,
          overtimeHours: after.overtimeHours,
        },
        metadata: {
          requestId,
          lockerId: after.lockerId,
          amount: after.overtimeFee,
        },
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    // ตรวจสอบการปลดล็อค
    if (before.isLocked && !after.isLocked) {
      await admin.firestore().collection("activity_logs").add({
        userId: after.customerId || "unknown",
        userRole: "user",
        category: "locker",
        action: "locker_unlocked",
        level: "success",
        details: {
          requestId,
          lockerId: after.lockerId,
          overtimeFeePaid: after.overtimeFeePaid,
        },
        metadata: {
          requestId,
          lockerId: after.lockerId,
        },
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
  });

// Log เมื่ออนุมัติหรือปฏิเสธ Rider
export const onRiderUpdated = functions.firestore
  .document("riders/{riderId}")
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    const riderId = context.params.riderId;

    if (before.status !== after.status) {
      let action = after.status === "approved" ? "rider_approved" : "rider_rejected";
      let level: "success" | "warning" = after.status === "approved" ? "success" : "warning";

      await admin.firestore().collection("activity_logs").add({
        userId: after.approvedBy || "admin",
        userRole: "admin",
        category: "rider",
        action,
        level,
        details: {
          riderId,
          status: after.status,
          approvedBy: after.approvedBy,
          reason: after.rejectionReason,
        },
        metadata: {
          riderId,
        },
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
  });
```

### 3. Main Index File
สร้าง/แก้ไข `functions/src/index.ts`:

```typescript
import * as admin from "firebase-admin";

admin.initializeApp();

// Auto-lock functions
export { autoLockExpiredLockers } from "./autoLock";

// Activity logging triggers
export {
  onRequestCreated,
  onRequestUpdated,
  onRiderUpdated,
} from "./activityLoggers";

// Custom claims (for role management)
import * as functions from "firebase-functions";

export const setUserRole = functions.https.onCall(async (data, context) => {
  // ต้องเป็น admin เท่านั้น
  if (!context.auth || context.auth.token.role !== "admin") {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Only admins can set user roles"
    );
  }

  const { uid, role } = data;

  if (!["user", "rider", "admin"].includes(role)) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Invalid role specified"
    );
  }

  try {
    await admin.auth().setCustomUserClaims(uid, { role });
    
    // Log activity
    await admin.firestore().collection("activity_logs").add({
      userId: context.auth.uid,
      userRole: "admin",
      category: "admin",
      action: "set_user_role",
      level: "info",
      details: {
        targetUserId: uid,
        newRole: role,
      },
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { success: true, message: `Role ${role} set for user ${uid}` };
  } catch (error: any) {
    throw new functions.https.HttpsError("internal", error.message);
  }
});
```

## Deploy

### 1. Build and Deploy
```bash
cd functions
npm run build
firebase deploy --only functions
```

### 2. Deploy เฉพาะบาง Functions
```bash
# Deploy เฉพาะ auto-lock
firebase deploy --only functions:autoLockExpiredLockers

# Deploy เฉพาะ logging triggers
firebase deploy --only functions:onRequestCreated,functions:onRequestUpdated,functions:onRiderUpdated
```

## Environment Variables

สร้างไฟล์ `.env.local` ใน functions folder:
```
FIREBASE_CONFIG={"projectId":"your-project-id","storageBucket":"..."}
```

## Testing Locally

```bash
cd functions
npm run serve
```

จากนั้นเรียกใช้ Functions ผ่าน emulator:
```bash
firebase emulators:start
```

## Monitoring

ดู Logs ของ Functions:
```bash
firebase functions:log
```

หรือดูใน Firebase Console → Functions → Logs

## Cost Optimization

1. **Auto-lock Function**: ทำงานทุก 1 นาที = 43,200 ครั้ง/เดือน
   - อยู่ใน Free tier (2M invocations/month)
   
2. **Firestore Triggers**: ทำงานเมื่อมี event เท่านั้น
   - ค่าใช้จ่ายขึ้นกับจำนวน requests ที่เกิดขึ้นจริง

3. **Optimization Tips**:
   - ใช้ composite indexes สำหรับ query ที่ซับซ้อน
   - จำกัดจำนวน documents ที่ query ใน auto-lock
   - ใช้ batch operations แทนการ write ทีละ document

## Security

1. **Function ต้องมี Authentication**:
   - ใช้ `context.auth` เพื่อตรวจสอบผู้ใช้
   - ตรวจสอบ role จาก custom claims

2. **Firestore Rules**:
   - activity_logs: allow write = false (เฉพาะ Cloud Functions)
   - requests, riders: ตรวจสอบ permission ตาม role

3. **API Keys**:
   - ใช้ Environment Variables สำหรับ sensitive data
   - ไม่ commit API keys ลง Git

## Next Steps

1. สร้าง functions folder และไฟล์ตามด้านบน
2. Deploy functions
3. ทดสอบ auto-lock โดยสร้าง request ที่เลย deadline
4. ตรวจสอบ activity_logs ใน Firestore Console
5. ดู logs ที่ /admin/logs
