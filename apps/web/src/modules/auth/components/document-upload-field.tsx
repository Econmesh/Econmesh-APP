"use client";

import { cn } from "@econmesh-app/ui/lib/utils";
import { FileCheck2, Upload, X } from "lucide-react";
import { useId, useRef, useState, type ReactNode } from "react";

import { COMPLIANCE_ACCEPT } from "@/modules/companies/schemas";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentUploadField({
  id,
  title,
  description,
  required,
  file,
  error,
  onChange,
  hint,
}: {
  id: string;
  title: string;
  description: string;
  required?: boolean;
  file: File | null;
  error?: string;
  onChange: (file: File | null) => void;
  hint?: ReactNode;
}) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function applyFile(next: File | null) {
    onChange(next);
    if (!next && inputRef.current) {
      inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1.5">
          <label htmlFor={inputId} className="block text-base font-semibold tracking-tight">
            {title}
          </label>
          <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide uppercase",
            required
              ? "bg-primary/12 text-primary"
              : "bg-muted text-muted-foreground",
          )}
        >
          {required ? "Obrigatório" : "Opcional"}
        </span>
      </div>

      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          applyFile(event.dataTransfer.files?.[0] ?? null);
        }}
        className={cn(
          "relative rounded-xl border border-dashed px-4 py-8 text-center transition-colors",
          dragging && "border-primary bg-primary/8",
          error && "border-destructive/70 bg-destructive/5",
          !error && !dragging && file && "border-primary/40 bg-primary/5",
          !error && !dragging && !file && "border-border/90 bg-muted/20 hover:border-primary/40 hover:bg-muted/40",
        )}
      >
        <input
          id={inputId}
          ref={inputRef}
          type="file"
          accept={COMPLIANCE_ACCEPT}
          className="sr-only"
          onChange={(event) => applyFile(event.target.files?.[0] ?? null)}
        />
        <label htmlFor={inputId} className="flex cursor-pointer flex-col items-center gap-2">
          {file ? (
            <>
              <FileCheck2 className="size-8 text-primary" aria-hidden />
              <p className="max-w-full truncate text-sm font-medium">{file.name}</p>
              <p className="text-xs text-muted-foreground">
                {formatFileSize(file.size)} · Clique ou arraste para trocar
              </p>
            </>
          ) : (
            <>
              <Upload className="size-8 text-muted-foreground" aria-hidden />
              <p className="text-sm font-medium">Clique ou arraste o arquivo</p>
              <p className="text-xs text-muted-foreground">PDF, JPEG ou PNG até 10 MB</p>
            </>
          )}
        </label>
        {file ? (
          <button
            type="button"
            className="absolute top-3 right-3 rounded-md p-1 text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              applyFile(null);
            }}
            aria-label={`Remover ${title}`}
          >
            <X className="size-4" aria-hidden />
          </button>
        ) : null}
      </div>

      {hint ? <p className="text-xs leading-relaxed text-muted-foreground">{hint}</p> : null}
      {error ? (
        <p id={`${inputId}-error`} className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
