import clsx from "clsx";
import type { CSSProperties } from "react";

/**
 * Renders a Figma-exported SVG glyph (public/figma/<name>.svg) as a mask, so the exact
 * design glyph can take any text colour (active/inactive states). Use `original` to keep
 * the asset's own colours.
 */
export function FigmaIcon({ name, size = 18, className, original, style }: {
  name: string; size?: number; className?: string; original?: boolean; style?: CSSProperties;
}) {
  const src = `/figma/${name}.svg`;
  if (original) {
    return <img src={src} alt="" width={size} height={size} className={clsx("block shrink-0", className)} style={style} />;
  }
  return (
    <span
      aria-hidden
      className={clsx("inline-block shrink-0 bg-current", className)}
      style={{
        width: size, height: size,
        mask: `url(${src}) center / contain no-repeat`,
        WebkitMask: `url(${src}) center / contain no-repeat`,
        ...style,
      }}
    />
  );
}
