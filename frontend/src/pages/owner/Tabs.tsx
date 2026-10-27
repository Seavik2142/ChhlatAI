import clsx from "clsx";

export function Tabs<T extends string>({ value, onChange, items }: {
  value: T; onChange: (v: T) => void; items: { key: T; label: string }[];
}) {
  return (
    <div className="mb-6 inline-flex gap-1 rounded-full bg-surface p-1 shadow-card">
      {items.map((i) => (
        <button key={i.key} onClick={() => onChange(i.key)} className={clsx(
          "rounded-full px-4 py-2 text-body",
          value === i.key ? "bg-ink font-semibold text-white" : "font-medium text-ink-2 hover:bg-subtle")}>
          {i.label}
        </button>
      ))}
    </div>
  );
}
