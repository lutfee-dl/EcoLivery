import type { User } from "firebase/auth";
import { ROLE_COOKIE_NAME, type UserRole } from "@/lib/auth/roles";

export async function setRoleCookieFromUser(user: User | null, fallbackRole?: UserRole) {
  if (!user) {
    document.cookie = `${ROLE_COOKIE_NAME}=; path=/; max-age=0`;
    return;
  }

  try {
    const tokenResult = await user.getIdTokenResult(true);
    const role = (tokenResult.claims.role as UserRole | undefined) || fallbackRole;

    if (!role) {
      document.cookie = `${ROLE_COOKIE_NAME}=; path=/; max-age=0`;
      return;
    }

    document.cookie = `${ROLE_COOKIE_NAME}=${role}; path=/; max-age=86400`;
  } catch {
    if (fallbackRole) {
      document.cookie = `${ROLE_COOKIE_NAME}=${fallbackRole}; path=/; max-age=86400`;
      return;
    }
    document.cookie = `${ROLE_COOKIE_NAME}=; path=/; max-age=0`;
  }
}
