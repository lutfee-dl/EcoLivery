export interface RequestData {
  id: string;
  lockerId: string;
  userId: string;
  userEmail: string;
  status: "pending" | "active" | "completed" | "cancelled";
  price: number;
  riderToken?: string;
  createdAt: Date | any;
  updatedAt?: Date | any;
  completedAt?: Date | any;
}

export interface CreateRequestInput {
  lockerId: string;
  price: number;
}
