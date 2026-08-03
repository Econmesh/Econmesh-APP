"use client";

import { Toaster } from "@econmesh-app/ui/components/sonner";

import { AuthProvider } from "@/contexts/auth-context";
import { ConversationsProvider } from "@/contexts/conversations-context";
import { NotificationProvider } from "@/contexts/notification-context";
import { SupportProvider } from "@/contexts/support-context";
import { ThemeProvider } from "./theme-provider";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
      <AuthProvider>
        <NotificationProvider>
          <SupportProvider>
            <ConversationsProvider>
              {children}
              <Toaster richColors closeButton position="top-right" />
            </ConversationsProvider>
          </SupportProvider>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
