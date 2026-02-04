export type UserRole = "user" | "rider" | "admin";

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: UserRole;
}
