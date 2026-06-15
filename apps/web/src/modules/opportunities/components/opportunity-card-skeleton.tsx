import { Skeleton } from "@econmesh-app/ui/components/skeleton";

export function OpportunityCardSkeleton() {
	return (
		<div className="overflow-hidden rounded-xl border border-border/80 bg-card/80">
			<Skeleton className="aspect-[4/3] w-full rounded-none" />
			<div className="space-y-3 p-4">
				<Skeleton className="h-4 w-3/4" />
				<Skeleton className="h-3 w-1/2" />
				<div className="flex gap-2">
					<Skeleton className="h-5 w-16" />
					<Skeleton className="h-5 w-20" />
				</div>
				<Skeleton className="h-5 w-24" />
			</div>
		</div>
	);
}

export function OpportunityListSkeleton({ count = 6 }: { count?: number }) {
	return (
		<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }, (_, index) => `skeleton-${index}`).map((key) => (
        <OpportunityCardSkeleton key={key} />
      ))}
		</div>
	);
}
