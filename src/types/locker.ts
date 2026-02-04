export type LockerSize = "S" | "M" | "L";
export type LockerStatus = "available" | "occupied" | "maintenance";

export interface Locker {
  id: string;
  size: LockerSize;
  status: LockerStatus;
  price: number;
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
