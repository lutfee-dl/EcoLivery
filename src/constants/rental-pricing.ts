// Rental Duration Pricing Structure

export type RentalDuration = "1h" | "2h" | "3h" | "1d" | "3d" | "7d";

export interface RentalPlan {
  id: RentalDuration;
  label: string;
  hours: number;
  basePrice: number;
  overtimeRate: number;
}

export const RENTAL_PLANS: Record<RentalDuration, RentalPlan> = {
  "1h": {
    id: "1h",
    label: "1 ชั่วโมง",
    hours: 1,
    basePrice: 19,
    overtimeRate: 15,
  },
  "2h": {
    id: "2h",
    label: "2 ชั่วโมง",
    hours: 2,
    basePrice: 35,
    overtimeRate: 12,
  },
  "3h": {
    id: "3h",
    label: "3 ชั่วโมง",
    hours: 3,
    basePrice: 60,
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

export const RENTAL_DURATIONS: RentalDuration[] = ["1h", "2h", "3h", "1d", "3d", "7d"];

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
