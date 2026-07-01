"use client";

import { Toaster } from "@econmesh-app/ui/components/sonner";

import { AuthProvider } from "@/contexts/auth-context";
import { NotificationProvider } from "@/contexts/notification-context";
import { ThemeProvider } from "./theme-provider";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
      <AuthProvider>
        <NotificationProvider>
          {children}
          <Toaster richColors closeButton position="top-right" />
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
