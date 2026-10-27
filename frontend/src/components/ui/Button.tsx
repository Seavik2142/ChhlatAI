import clsx from "clsx";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "success";

const VARIANT: Record<Variant, string> = {
  primary: "bg-brand text-on-brand hover:bg-[#4338ca]",
  secondary: "border border-line bg-surface text-ink hover:bg-subtle",
  ghost: "text-ink-2 hover:bg-subtle",
  danger: "bg-danger text-on-brand hover:bg-[#b91c1c]",
  success: "bg-success text-on-brand hover:bg-[#15803d]",
};

/** Figma component "Button" (Variant=Primary|Secondary|Ghost|Danger|Success). */
export function Button({ variant = "primary", size = "md", icon, loading, className, children, ...rest }: {
  variant?: Variant; size?: "sm" | "md" | "lg"; icon?: ReactNode; loading?: boolean;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...rest}
      disabled={rest.disabled || loading}
      className={clsx(
        "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md font-semibold transition-colors disabled:opacity-50",
        size === "lg" ? "px-[22px] py-[14px] text-h3 leading-[22px]" : size === "sm" ? "px-3 py-1.5 text-caption" : "px-4 py-2 text-body",
        VARIANT[variant],
        className,
      )}
    >
      {loading ? <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> : icon}
      {children}
    </button>
  );
}
