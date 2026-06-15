"use client";

import { Label } from "@econmesh-app/ui/components/label";
import { HelpCircle } from "lucide-react";
import type { ReactNode } from "react";
import { useId, useState } from "react";

type FormFieldWithTooltipProps = {
	id?: string;
	label: string;
	tooltip: string;
	error?: string;
	children: ReactNode;
};

export function FormFieldWithTooltip({
	id: externalId,
	label,
	tooltip,
	error,
	children,
}: FormFieldWithTooltipProps) {
	const generatedId = useId();
	const id = externalId ?? generatedId;
	const [showTooltip, setShowTooltip] = useState(false);

	return (
		<div className="space-y-2">
			<div className="flex items-center gap-1.5">
				<Label htmlFor={id}>{label}</Label>
				<div className="relative">
					<button
						type="button"
						className="text-muted-foreground transition-colors hover:text-foreground"
						aria-label={`Informações sobre ${label}`}
						onMouseEnter={() => setShowTooltip(true)}
						onMouseLeave={() => setShowTooltip(false)}
						onFocus={() => setShowTooltip(true)}
						onBlur={() => setShowTooltip(false)}
					>
						<HelpCircle className="size-3.5" aria-hidden />
					</button>
					{showTooltip ? (
						<div
							role="tooltip"
							className="absolute top-full left-0 z-50 mt-1 w-64 rounded-md border border-border bg-popover p-2 text-popover-foreground text-xs shadow-md"
						>
							{tooltip}
						</div>
					) : null}
				</div>
			</div>
			{children}
			{error ? (
				<p id={`${id}-error`} className="text-destructive text-sm" role="alert">
					{error}
				</p>
			) : null}
		</div>
	);
}
