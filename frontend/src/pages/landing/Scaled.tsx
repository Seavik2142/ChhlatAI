import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

/** Renders a 1x screen (e.g. 1440×900) scaled to fit its container width, keeping aspect ratio. */
export function Scaled({ width, height, maxScale = 1, clip = true, children, className }: {
  width: number; height: number; maxScale?: number; clip?: boolean; children: ReactNode; className?: string;
}) {
  const box = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(maxScale);
  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setScale(Math.min(maxScale, e.contentRect.width / width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, [width, maxScale]);
  return (
    <div ref={box} className={className} style={{ width: "100%", maxWidth: width * maxScale }}>
      <div style={{ height: height * scale, position: "relative", overflow: clip ? "hidden" : "visible" }}>
        <div inert style={{ width, height, transform: `scale(${scale})`, transformOrigin: "top left", position: "absolute" }}>
          {children}
        </div>
      </div>
    </div>
  );
}
