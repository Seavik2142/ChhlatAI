import clsx from "clsx";

/** Figma component "Toggle" (State=On|Off). */
export function Toggle({ checked, onChange, tone = "success", disabled, label }: {
  checked: boolean; onChange?: (v: boolean) => void; tone?: "success" | "brand" | "danger"; disabled?: boolean;
  label?: string;
}) {
  const on = { success: "bg-success", brand: "bg-brand", danger: "bg-danger" }[tone];
  return (
    <button
      type="button" role="switch" aria-checked={checked} aria-label={label} disabled={disabled}
      onClick={() => onChange?.(!checked)}
      className={clsx("relative h-[22px] w-10 shrink-0 rounded-full transition-colors disabled:opacity-60",
        checked ? on : "bg-line-strong")}
    >
      <span className={clsx("absolute top-[3px] size-4 rounded-full bg-white shadow transition-all",
        checked ? "left-[21px]" : "left-[3px]")} />
    </button>
  );
}
