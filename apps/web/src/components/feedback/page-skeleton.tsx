import { Skeleton } from "@econmesh-app/ui/components/skeleton";

export function PageSkeleton() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-8">
      <Skeleton className="h-10 w-64 max-w-full" />
      <Skeleton className="h-4 w-48 max-w-full" />
      <Skeleton className="h-32 w-full max-w-md" />
    </div>
  );
}
