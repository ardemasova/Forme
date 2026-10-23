"use client";

import { useEffect, useRef, useState } from "react";
import { getRef, unsplash } from "@/lib/catalog";

interface PhotoProps {
  refId: string;
  alt?: string;
  className?: string;
  /** Requested width in px (served by the CDN) */
  w?: number;
  sizes?: string;
  priority?: boolean;
}

/**
 * Remote photo with a graceful offline fallback: if the image can't load we
 * draw an architectural "plate" from the reference's own palette, so layouts
 * never collapse into broken-image icons.
 */
export function Photo({ refId, alt, className = "", w = 1200, sizes = "100vw", priority }: PhotoProps) {
  const ref = getRef(refId);
  const [failed, setFailed] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  // An SSR-rendered <img> may fail before React attaches onError: check once on mount.
  useEffect(() => {
    const el = imgRef.current;
    if (el && el.complete && el.naturalWidth === 0) setFailed(true);
  }, []);
  if (!ref) return <div className={`bg-chalk ${className}`} aria-hidden />;
  const label = alt ?? `${ref.title}. ${ref.caption}`;

  if (failed) return <FallbackPlate palette={ref.palette} title={ref.title} className={className} label={label} />;

  const srcSet = [400, 800, 1200, 1800]
    .filter((x) => x <= Math.max(w * 1.5, 400))
    .map((x) => `${unsplash(ref.image, x)} ${x}w`)
    .join(", ");

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={imgRef}
      src={unsplash(ref.image, w)}
      srcSet={srcSet}
      sizes={sizes}
      alt={label}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={priority ? "high" : "auto"}
      onError={() => setFailed(true)}
      className={`object-cover bg-chalk ${className}`}
      style={{ backgroundColor: ref.palette[0] }}
    />
  );
}

export function FallbackPlate({
  palette,
  title,
  className = "",
  label,
}: {
  palette: [string, string, string, string];
  title: string;
  className?: string;
  label: string;
}) {
  const [wall, accent, light, deep] = palette;
  return (
    <div role="img" aria-label={label} className={`@container overflow-hidden ${/\b(absolute|fixed)\b/.test(className) ? "" : "relative"} ${className}`} style={{ background: wall }}>
      <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full" aria-hidden>
        <rect width="400" height="300" fill={wall} />
        <polygon points="0,215 400,205 400,300 0,300" fill={deep} opacity="0.22" />
        <path d="M250 205 V95 a45 45 0 0 1 90 0 V205 Z" fill={light} opacity="0.85" />
        <path d="M250 205 L170 300 H330 L340 205 Z" fill={light} opacity="0.25" />
        <rect x="40" y="160" width="150" height="45" rx="18" fill={accent} opacity="0.9" />
        <rect x="52" y="140" width="40" height="30" rx="12" fill={accent} opacity="0.7" />
        <circle cx="215" cy="120" r="16" fill={light} />
        <line x1="215" y1="136" x2="215" y2="205" stroke={deep} strokeWidth="2" opacity="0.6" />
      </svg>
      <span className="absolute bottom-2 left-3 hidden pr-3 text-[10px] tracking-[0.14em] uppercase text-espresso/60 @[260px]:block">
        {title} · imagen sin conexión
      </span>
    </div>
  );
}
