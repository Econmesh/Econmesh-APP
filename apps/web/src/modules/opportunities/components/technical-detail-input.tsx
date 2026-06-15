"use client";

import { Input } from "@econmesh-app/ui/components/input";
import { useMemo, useState } from "react";

import { TECHNICAL_DETAIL_SUGGESTIONS } from "@/modules/opportunities/constants";

type TechnicalDetailInputProps = {
	id: string;
	value: string;
	onChange: (value: string) => void;
	error?: string;
	disabled?: boolean;
};

export function TechnicalDetailInput({
	id,
	value,
	onChange,
	error,
	disabled,
}: TechnicalDetailInputProps) {
	const [focused, setFocused] = useState(false);

	const suggestions = useMemo(() => {
		const query = value.trim().toLowerCase();
		if (!query) return TECHNICAL_DETAIL_SUGGESTIONS.slice(0, 6);
		return TECHNICAL_DETAIL_SUGGESTIONS.filter((item) =>
			item.toLowerCase().includes(query),
		).slice(0, 8);
	}, [value]);

	const showSuggestions = focused && suggestions.length > 0;

	return (
		<div className="relative">
			<Input
				id={id}
				value={value}
				onChange={(e) => onChange(e.target.value)}
				onFocus={() => setFocused(true)}
				onBlur={() => setTimeout(() => setFocused(false), 150)}
				placeholder="Ex.: PET, PEAD, Aço Inox 304"
				disabled={disabled}
				aria-invalid={!!error}
				aria-describedby={error ? `${id}-error` : undefined}
				aria-autocomplete="list"
				aria-expanded={showSuggestions}
				autoComplete="off"
			/>
      {showSuggestions ? (
        <div className="absolute top-full right-0 left-0 z-50 mt-1 max-h-48 overflow-auto border border-border bg-popover shadow-md">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              className="w-full px-3 py-2 text-left text-xs hover:bg-muted"
              onMouseDown={(e) => {
                e.preventDefault();
                onChange(suggestion);
                setFocused(false);
              }}
            >
              {suggestion}
            </button>
          ))}
        </div>
      ) : null}
		</div>
	);
}
