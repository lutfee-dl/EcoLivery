import type { Locker } from "@/types/locker";

export const LOCKERS: readonly Locker[] = [
  { id: "A-01", size: "S", status: "occupied", price: 30 },
//   { id: "A-01", size: "S", status: "available", price: 30 },
  { id: "A-02", size: "S", status: "available", price: 30 },
  { id: "A-03", size: "S", status: "occupied", price: 30 },
  { id: "B-01", size: "M", status: "occupied", price: 50 },
  { id: "B-02", size: "M", status: "occupied", price: 50 },
  { id: "B-03", size: "M", status: "occupied", price: 50 },
  { id: "C-01", size: "L", status: "occupied", price: 80 },
  { id: "C-02", size: "L", status: "occupied", price: 80 },
  { id: "C-03", size: "L", status: "occupied", price: 80 },
] as const;

export const LOCKER_SIZE_LABELS: Record<string, string> = {
  S: "เล็ก",
  M: "กลาง",
  L: "ใหญ่",
} as const;

export const LOCKER_SIZE_HEIGHTS: Record<string, string> = {
  S: "h-48",
  M: "h-56",
  L: "h-64",
} as const;
