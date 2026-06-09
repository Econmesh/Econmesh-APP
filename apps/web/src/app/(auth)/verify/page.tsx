"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

import { PageSkeleton } from "@/components/feedback/page-skeleton";

function VerifyRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const query = searchParams.toString();
    router.replace(query ? `/verify-email?${query}` : "/verify-email");
  }, [router, searchParams]);

  return <PageSkeleton />;
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <VerifyRedirect />
    </Suspense>
  );
}
