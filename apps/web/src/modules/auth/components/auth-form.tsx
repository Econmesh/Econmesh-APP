"use client";

import { Button } from "@econmesh-app/ui/components/button";
import { Input } from "@econmesh-app/ui/components/input";
import { Label } from "@econmesh-app/ui/components/label";
import { Loader2 } from "lucide-react";
import { useState, type ComponentProps, type FormEvent, type ReactNode } from "react";

export function AuthForm({
  onSubmit,
  children,
  submitLabel,
  loading,
  footer,
}: {
  onSubmit: (event: FormEvent<HTMLFormElement>) => void | Promise<void>;
  children: ReactNode;
  submitLabel: string;
  loading?: boolean;
  footer?: ReactNode;
}) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void onSubmit(e);
      }}
      className="space-y-4 rounded-xl border border-border/80 bg-card/80 p-6 shadow-lg backdrop-blur-sm"
      noValidate
    >
      {children}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Aguarde…
          </>
        ) : (
          submitLabel
        )}
      </Button>
      {footer}
    </form>
  );
}

export function FormField({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function FormInput(props: ComponentProps<typeof Input> & { id: string }) {
  const { id, "aria-invalid": ariaInvalid, ...rest } = props;
  return (
    <Input
      id={id}
      aria-invalid={ariaInvalid}
      aria-describedby={ariaInvalid ? `${id}-error` : undefined}
      {...rest}
    />
  );
}

export function useFormErrors<T extends string>() {
  const [errors, setErrors] = useState<Partial<Record<T, string>>>({});
  return { errors, setErrors, clear: () => setErrors({}) };
}
