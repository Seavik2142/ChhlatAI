import clsx from "clsx";
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

const control = "w-full rounded-md border border-line bg-surface px-3 py-2.5 text-body text-ink placeholder:text-muted outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15";

/** Figma component "Input" (label above, 44px field). */
export function Field({ label, hint, children }: { label: string; hint?: ReactNode; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-caption font-medium text-ink">{label}</span>
      {children}
      {hint && <span className="text-caption text-muted">{hint}</span>}
    </label>
  );
}

export const Input = ({ className, ...p }: InputHTMLAttributes<HTMLInputElement>) =>
  <input {...p} className={clsx(control, className)} />;

export const Textarea = ({ className, ...p }: TextareaHTMLAttributes<HTMLTextAreaElement>) =>
  <textarea {...p} className={clsx(control, "min-h-24 resize-y", className)} />;

export const Select = ({ className, ...p }: SelectHTMLAttributes<HTMLSelectElement>) =>
  <select {...p} className={clsx(control, "appearance-auto", className)} />;
