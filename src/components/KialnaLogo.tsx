import React from "react";

interface KialnaLogoProps {
  className?: string;
  size?: number; // Size in pixels for the mark
  variant?: "full" | "icon" | "mark-with-text";
  theme?: "dark" | "light" | "auto";
  subtitle?: boolean;
}

/**
 * KialnaLogo - Official brand logo for Kialna Artisanal Marketplace.
 * Combines the silhouette of an artisanal Vietnamese ceramic vessel and woven silk ribbon
 * forming a modern geometric letter 'K' with sapphire and liquid gold gradients.
 */
export default function KialnaLogo({
  className = "",
  size = 40,
  variant = "icon",
  subtitle = false,
}: KialnaLogoProps) {
  // Unique IDs for SVG gradients to prevent DOM collisions
  const gradBlueId = `kialna-grad-blue-${size}`;
  const gradGoldId = `kialna-grad-gold-${size}`;
  const gradStemId = `kialna-grad-stem-${size}`;

  const mark = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0 drop-shadow-sm select-none"
      aria-label="Kialna Logo"
    >
      <defs>
        {/* Deep sapphire into cobalt silk gradient */}
        <linearGradient id={gradBlueId} x1="15" y1="15" x2="85" y2="85" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1e3a8a" />
          <stop offset="45%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#38bdf8" />
        </linearGradient>

        {/* Radiant imperial amber into champagne gold gradient */}
        <linearGradient id={gradGoldId} x1="30" y1="20" x2="90" y2="90" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#d97706" />
          <stop offset="50%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#fbbf24" />
        </linearGradient>

        {/* Vertical artisan spindle spine */}
        <linearGradient id={gradStemId} x1="20" y1="15" x2="35" y2="85" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0f172a" />
          <stop offset="60%" stopColor="#1e293b" />
          <stop offset="100%" stopColor="#334155" />
        </linearGradient>

        {/* Soft shadow filter */}
        <filter id={`shadow-${size}`} x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.15" />
        </filter>
      </defs>

      {/* Rounded squircle subtle backdrop badge */}
      <rect
        x="2"
        y="2"
        width="96"
        height="96"
        rx="26"
        className="fill-slate-900"
      />

      {/* Geometric 'K' spine: Crafted pillar with slight bevel */}
      <path
        d="M26 22C26 19.7909 27.7909 18 30 18H34C36.2091 18 38 19.7909 38 22V78C38 80.2091 36.2091 82 34 82H30C27.7909 82 26 80.2091 26 78V22Z"
        fill={`url(#${gradGoldId})`}
      />

      {/* Upper diagonal arm: Smooth sweeping arch evoking ceramic lip & silk flutter */}
      <path
        d="M36 50C42 42 54 28 68 20C72 17.5 76 19 76 23.5C76 27 72 32 63 39C52 47 43 54 36 58V50Z"
        fill={`url(#${gradBlueId})`}
        filter={`url(#shadow-${size})`}
      />

      {/* Ceramic amphora vessel contour / lower diagonal arm sweeping down & around */}
      <path
        d="M38 52C48 58 60 70 70 78C73 80.5 77 79 76 75C74 67 66 58 56 50C65 44 73 34 74 25C74.5 20.5 70 19 66 21C53 28 44 42 38 52Z"
        fill={`url(#${gradBlueId})`}
        opacity="0.35"
      />

      {/* Lower gold ribbon sweep finishing the letter 'K' */}
      <path
        d="M38 48C45 56 55 68 66 79C69 82 74 81 75 77C76 72 71 63 60 54C52 47 44 43 38 48Z"
        fill={`url(#${gradGoldId})`}
        filter={`url(#shadow-${size})`}
      />

      {/* Center artisan focal diamond knot */}
      <circle cx="44" cy="50" r="3.5" fill="#ffffff" opacity="0.9" />
    </svg>
  );

  if (variant === "icon") {
    return <div className={`inline-flex items-center justify-center ${className}`}>{mark}</div>;
  }

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      {mark}
      <div className="flex flex-col">
        <span className="font-extrabold tracking-tight text-text-primary text-lg sm:text-xl leading-none">
          KIALNA
        </span>
        {subtitle && (
          <span className="text-[9px] font-semibold tracking-wider text-text-secondary uppercase mt-0.5">
            Artisanal Crafts
          </span>
        )}
      </div>
    </div>
  );
}
