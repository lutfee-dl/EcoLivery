export type LockerSize = "S" | "M" | "L" | "XL";

export interface Locker {
  id: string;
  name?: string;
  location?: string;
  size: LockerSize;
  available: boolean; // true = ว่าง, false = ถูกจอง
  createdAt?: any;
}

export interface LockerRequest {
  id: string;
  lockerId: string;
  userId: string;
  status: "pending" | "active" | "completed" | "cancelled";
  price: number;
  createdAt: Date;
  riderToken?: string;
}
