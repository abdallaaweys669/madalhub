"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { useIsClient } from "@/hooks/useIsClient";
import { cn } from "@/lib/utils";

type Props = {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
};

/** Mount charts only after hydration and when the container has real dimensions. */
export default function ChartContainer({ children, className, style }: Props) {
  const mounted = useIsClient();
  const ref = useRef<HTMLDivElement>(null);
  const [sized, setSized] = useState(false);

  useEffect(() => {
    if (!mounted) return;
    const el = ref.current;
    if (!el) return;

    const update = () => {
      const { width, height } = el.getBoundingClientRect();
      setSized(width > 0 && height > 0);
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [mounted]);

  return (
    <div ref={ref} className={cn("min-w-0", className)} style={style}>
      {mounted && sized ? children : null}
    </div>
  );
}
