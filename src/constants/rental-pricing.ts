// Rental Duration Pricing Structure

export type RentalDuration = "3h" | "6h" | "12h" | "1d" | "3d" | "7d";

export interface RentalPlan {
  id: RentalDuration;
  label: string;
  hours: number;
  basePrice: number;
  overtimeRate: number; // ค่าปรับต่อชั่วโมง
}

export const RENTAL_PLANS: Record<RentalDuration, RentalPlan> = {
  "3h": {
    id: "3h",
    label: "3 ชั่วโมง",
    hours: 3,
    basePrice: 30,
    overtimeRate: 15,
  },
  "6h": {
    id: "6h",
    label: "6 ชั่วโมง",
    hours: 6,
    basePrice: 50,
    overtimeRate: 12,
  },
  "12h": {
    id: "12h",
    label: "12 ชั่วโมง",
    hours: 12,
    basePrice: 80,
    overtimeRate: 10,
  },
  "1d": {
    id: "1d",
    label: "1 วัน",
    hours: 24,
    basePrice: 120,
    overtimeRate: 8,
  },
  "3d": {
    id: "3d",
    label: "3 วัน",
    hours: 72,
    basePrice: 300,
    overtimeRate: 8,
  },
  "7d": {
    id: "7d",
    label: "7 วัน",
    hours: 168,
    basePrice: 600,
    overtimeRate: 5,
  },
};

export const RENTAL_DURATIONS: RentalDuration[] = ["3h", "6h", "12h", "1d", "3d", "7d"];

export function calculateDeadline(startTime: Date, duration: RentalDuration): Date {
  const plan = RENTAL_PLANS[duration];
  const deadline = new Date(startTime);
  deadline.setHours(deadline.getHours() + plan.hours);
  return deadline;
}

export function calculateOvertime(deadline: Date, currentTime: Date = new Date()): {
  isOvertime: boolean;
  overtimeHours: number;
} {
  if (currentTime <= deadline) {
    return { isOvertime: false, overtimeHours: 0 };
  }
  
  const diffMs = currentTime.getTime() - deadline.getTime();
  const overtimeHours = Math.ceil(diffMs / (1000 * 60 * 60));
  
  return { isOvertime: true, overtimeHours };
}

export function calculateOvertimeFee(
  duration: RentalDuration,
  overtimeHours: number
): number {
  const plan = RENTAL_PLANS[duration];
  return overtimeHours * plan.overtimeRate;
}
