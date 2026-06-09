import type { ReactNode } from "react";

import { GuestGuard } from "@/components/auth/guest-guard";

export function AuthLayout({ children }: { children: ReactNode }) {
  return <GuestGuard>{children}</GuestGuard>;
}
