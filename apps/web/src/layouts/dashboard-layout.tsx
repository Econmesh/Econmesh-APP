"use client";

import type { ReactNode } from "react";
import { Suspense } from "react";

import { AuthGuard } from "@/components/auth/auth-guard";
import { BillingProvider } from "@/contexts/billing-context";
import { SubscriptionGate } from "@/modules/billing/components/subscription-gate";
import { DashboardHeader } from "@/modules/dashboard/components/dashboard-header";
import { DashboardMobileNav } from "@/modules/dashboard/components/dashboard-mobile-nav";
import { DashboardSidebar } from "@/modules/dashboard/components/dashboard-sidebar";

export function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <BillingProvider>
        <div className="flex min-h-svh bg-background">
          <DashboardSidebar />
          <div className="flex min-w-0 flex-1 flex-col">
            <DashboardHeader />
            <main className="flex-1 overflow-auto p-4 pb-24 md:p-6 md:pb-6 lg:p-8 lg:pb-8">
              <Suspense fallback={null}>
                <SubscriptionGate>{children}</SubscriptionGate>
              </Suspense>
            </main>
          </div>
          <DashboardMobileNav />
        </div>
      </BillingProvider>
    </AuthGuard>
  );
}
