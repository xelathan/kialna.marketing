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
 * Featuring the Geometric Origami Paper Crane with Cerulean Breeze light color:
 * - Faceted origami paper folds in luminous sky blue, soft mint turquoise, and crystalline accents.
 * - Elegant luxury typography in oceanic slate with vibrant cerulean craft accents.
 */
export default function KialnaLogo({
  className = "",
  size = 40,
  variant = "icon",
  subtitle = false,
}: KialnaLogoProps) {
  const skyLightId = `crane-sky-light-${size}`;
  const skyMidId = `crane-sky-mid-${size}`;
  const mintLightId = `crane-mint-light-${size}`;
  const mintMidId = `crane-mint-mid-${size}`;
  const deepSkyId = `crane-deep-sky-${size}`;
  const iceGlowId = `crane-ice-glow-${size}`;
  const shadowId = `crane-shadow-${size}`;

  const mark = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0 select-none transition-transform hover:scale-105 duration-200"
      aria-label="Kialna Origami Crane Logo"
    >
      <defs>
        {/* Soft crystalline sky gradients */}
        <linearGradient id={skyLightId} x1="20%" y1="0%" x2="80%" y2="100%">
          <stop offset="0%" stopColor="#f0f9ff" />
          <stop offset="50%" stopColor="#e0f2fe" />
          <stop offset="100%" stopColor="#7dd3fc" />
        </linearGradient>

        <linearGradient id={skyMidId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#bae6fd" />
          <stop offset="60%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#0284c7" />
        </linearGradient>

        {/* Luminous pastel mint turquoise gradients */}
        <linearGradient id={mintLightId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f0fdfa" />
          <stop offset="50%" stopColor="#ccfbf1" />
          <stop offset="100%" stopColor="#5eead4" />
        </linearGradient>

        <linearGradient id={mintMidId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#99f6e4" />
          <stop offset="100%" stopColor="#14b8a6" />
        </linearGradient>

        {/* Deeper cobalt accent for fold depths */}
        <linearGradient id={deepSkyId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0ea5e9" />
          <stop offset="100%" stopColor="#0369a1" />
        </linearGradient>

        {/* Ambient bloom aura */}
        <radialGradient id={iceGlowId} cx="50%" cy="45%" r="50%">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.18" />
          <stop offset="70%" stopColor="#99f6e4" stopOpacity="0.06" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>

        {/* Soft elegant shadow */}
        <filter id={shadowId} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#0284c7" floodOpacity="0.15" />
        </filter>
      </defs>

      {/* Subtle ambient light glow */}
      <circle cx="50" cy="46" r="42" fill={`url(#${iceGlowId})`} />

      {/* Origami Crane Polyhedral Facets */}
      <g
        filter={`url(#${shadowId})`}
        stroke="#0284c7"
        strokeWidth="1.15"
        strokeLinejoin="round"
        strokeLinecap="round"
      >
        {/* Rear Wing (pointing up-right) */}
        <polygon points="49,44 89,23 63,44" fill={`url(#${mintLightId})`} strokeOpacity="0.8" />
        <polygon points="63,44 89,23 73,49" fill={`url(#${mintMidId})`} strokeOpacity="0.8" />

        {/* Main Tall Wing - Lighted Front Face */}
        <polygon points="37,49 39,8 49,44" fill={`url(#${skyLightId})`} strokeOpacity="0.8" />
        {/* Main Tall Wing - Shaded Angular Crease */}
        <polygon points="49,44 39,8 57,36" fill={`url(#${skyMidId})`} strokeOpacity="0.8" />

        {/* Neck & Head Formations */}
        <polygon points="37,49 23,33 27,43" fill={`url(#deepSkyId})`} strokeOpacity="0.85" />
        <polygon points="23,33 14,43 21,44" fill={`url(#skyLightId})`} strokeOpacity="0.85" />
        <polygon points="14,43 21,44 27,43" fill={`url(#deepSkyId})`} strokeOpacity="0.85" />
        <polygon points="27,43 21,44 34,54" fill={`url(#skyLightId})`} strokeOpacity="0.8" />
        <polygon points="37,49 27,43 34,54" fill={`url(#mintLightId})`} strokeOpacity="0.8" />

        {/* Center Saddle / Body Diamond Fold */}
        <polygon points="34,54 37,49 45,68" fill={`url(#skyLightId})`} strokeOpacity="0.8" />
        <polygon points="37,49 49,44 45,68" fill={`url(#mintLightId})`} strokeOpacity="0.8" />
        <polygon points="49,44 59,53 45,68" fill={`url(#skyLightId})`} strokeOpacity="0.8" />

        {/* Tail Formations (pointing down-right) */}
        <polygon points="59,53 93,69 67,59" fill={`url(#skyMidId})`} strokeOpacity="0.8" />
        <polygon points="45,68 67,59 93,69" fill={`url(#mintMidId})`} strokeOpacity="0.8" />
      </g>

      {/* Delicate paper highlight sparkle */}
      <circle cx="39" cy="9" r="1.5" fill="#ffffff" opacity="0.95" />
      <circle cx="89" cy="23" r="1.5" fill="#ffffff" opacity="0.9" />
    </svg>
  );

  if (variant === "icon") {
    return <div className={`inline-flex items-center justify-center ${className}`}>{mark}</div>;
  }

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      {mark}
      <div className="flex flex-col select-none">
        <span
          className="font-black tracking-[0.22em] uppercase leading-none bg-gradient-to-r from-sky-600 via-cyan-500 to-teal-400 bg-clip-text text-transparent"
          style={{
            fontSize: `${Math.max(16, Math.round(size * 0.44))}px`,
          }}
        >
          KIALNA
        </span>
        {subtitle && (
          <span
            className="tracking-[0.26em] uppercase text-sky-700/80 dark:text-sky-300/80 font-bold leading-tight mt-1"
            style={{
              fontSize: `${Math.max(9, Math.round(size * 0.17))}px`,
            }}
          >
            Artisanal Marketplace
          </span>
        )}
      </div>
    </div>
  );
}
