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
 * Featuring the Geometric Origami Paper Crane in Bold Cerulean Breeze:
 * - Rich, vibrant sky blue, tropical turquoise & azure faceted planes with deep contrast.
 * - Bold, crisp architectural fold crease outlines (#075985, 1.85px stroke width).
 * - Authoritative #164e63 luxury typography.
 */
export default function KialnaLogo({
  className = "",
  size = 40,
  variant = "icon",
  subtitle = false,
}: KialnaLogoProps) {
  const skyLightId = `crane-bold-sky-light-${size}`;
  const skyMidId = `crane-bold-sky-mid-${size}`;
  const mintLightId = `crane-bold-mint-light-${size}`;
  const mintMidId = `crane-bold-mint-mid-${size}`;
  const deepSkyId = `crane-bold-deep-sky-${size}`;
  const iceGlowId = `crane-bold-ice-glow-${size}`;
  const shadowId = `crane-bold-shadow-${size}`;

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
        {/* Bold luminous sky gradients */}
        <linearGradient id={skyLightId} x1="15%" y1="0%" x2="85%" y2="100%">
          <stop offset="0%" stopColor="#bae6fd" />
          <stop offset="50%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#0284c7" />
        </linearGradient>

        <linearGradient id={skyMidId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0284c7" />
          <stop offset="60%" stopColor="#0369a1" />
          <stop offset="100%" stopColor="#075985" />
        </linearGradient>

        {/* Rich vibrant tropical mint & turquoise gradients */}
        <linearGradient id={mintLightId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#99f6e4" />
          <stop offset="50%" stopColor="#2dd4bf" />
          <stop offset="100%" stopColor="#14b8a6" />
        </linearGradient>

        <linearGradient id={mintMidId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#14b8a6" />
          <stop offset="60%" stopColor="#0d9488" />
          <stop offset="100%" stopColor="#0f766e" />
        </linearGradient>

        {/* Deep cobalt/sapphire accent for deep crease folds */}
        <linearGradient id={deepSkyId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0284c7" />
          <stop offset="50%" stopColor="#0369a1" />
          <stop offset="100%" stopColor="#082f49" />
        </linearGradient>

        {/* Ambient bloom aura */}
        <radialGradient id={iceGlowId} cx="50%" cy="45%" r="50%">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.25" />
          <stop offset="60%" stopColor="#2dd4bf" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>

        {/* Bold crisp shadow */}
        <filter id={shadowId} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="3.5" stdDeviation="4.5" floodColor="#075985" floodOpacity="0.22" />
        </filter>
      </defs>

      {/* Subtle ambient light glow */}
      <circle cx="50" cy="46" r="42" fill={`url(#${iceGlowId})`} />

      {/* Origami Crane Polyhedral Facets with Bolder Lines and Saturated Colors */}
      <g
        filter={`url(#${shadowId})`}
        stroke="#075985"
        strokeWidth="1.85"
        strokeLinejoin="round"
        strokeLinecap="round"
      >
        {/* Rear Wing (pointing up-right) */}
        <polygon points="49,44 89,23 63,44" fill={`url(#mintLightId})`} />
        <polygon points="63,44 89,23 73,49" fill={`url(#mintMidId})`} />

        {/* Main Tall Wing - Lighted Front Face */}
        <polygon points="37,49 39,8 49,44" fill={`url(#skyLightId})`} />
        {/* Main Tall Wing - Shaded Angular Crease */}
        <polygon points="49,44 39,8 57,36" fill={`url(#skyMidId})`} />

        {/* Neck & Head Formations */}
        <polygon points="37,49 23,33 27,43" fill={`url(#deepSkyId})`} />
        <polygon points="23,33 14,43 21,44" fill={`url(#skyLightId})`} />
        <polygon points="14,43 21,44 27,43" fill={`url(#deepSkyId})`} />
        <polygon points="27,43 21,44 34,54" fill={`url(#skyLightId})`} />
        <polygon points="37,49 27,43 34,54" fill={`url(#mintLightId})`} />

        {/* Center Saddle / Body Diamond Fold */}
        <polygon points="34,54 37,49 45,68" fill={`url(#skyLightId})`} />
        <polygon points="37,49 49,44 45,68" fill={`url(#mintLightId})`} />
        <polygon points="49,44 59,53 45,68" fill={`url(#skyLightId})`} />

        {/* Tail Formations (pointing down-right) */}
        <polygon points="59,53 93,69 67,59" fill={`url(#skyMidId})`} />
        <polygon points="45,68 67,59 93,69" fill={`url(#mintMidId})`} />
      </g>

      {/* Crisp paper specular highlight sparkle */}
      <circle cx="39" cy="9" r="1.6" fill="#ffffff" opacity="0.95" />
      <circle cx="89" cy="23" r="1.6" fill="#ffffff" opacity="0.9" />
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
          className="font-black tracking-[0.22em] uppercase leading-none text-[#164e63] dark:text-cyan-200"
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
            Vietnam Direct Marketplace
          </span>
        )}
      </div>
    </div>
  );
}
