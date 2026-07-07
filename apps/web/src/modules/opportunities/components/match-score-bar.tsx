"use client";

import { cn } from "@econmesh-app/ui/lib/utils";

type MatchScoreBarProps = {
	label: string;
	value: number;
	className?: string;
};

export function MatchScoreBar({ label, value, className }: MatchScoreBarProps) {
	const clamped = Math.max(0, Math.min(100, value));

	return (
		<div className={cn("space-y-1.5", className)}>
			<div className="flex items-center justify-between gap-2 text-sm">
				<span className="text-muted-foreground">{label}</span>
				<span className="font-semibold tabular-nums">{clamped}%</span>
			</div>
			<div className="h-2 overflow-hidden rounded-full bg-muted">
				<div
					className="h-full rounded-full bg-primary transition-all"
					style={{ width: `${clamped}%` }}
				/>
			</div>
		</div>
	);
}
