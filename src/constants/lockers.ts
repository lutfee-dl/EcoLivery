// ⚠️ Deprecated: ข้อมูล Locker ใช้จาก Firestore แล้ว
// ไฟล์นี้เก็บไว้เฉพาะ constants เท่านั้น

export const LOCKER_SIZE_LABELS: Record<string, string> = {
  S: "เล็ก",
  M: "กลาง",
  L: "ใหญ่",
  XL: "ใหญ่พิเศษ",
} as const;

export const LOCKER_SIZE_HEIGHTS: Record<string, string> = {
  S: "h-48",
  M: "h-56",
  L: "h-64",
  XL: "h-72",
} as const;

