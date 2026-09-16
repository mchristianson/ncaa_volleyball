"use client";

import { useState } from "react";
import { logoUrl } from "@/lib/ncaa";

/**
 * NCAA publishes school marks as SVGs keyed on the team's seoname. Not every
 * school has one, so fall back to the abbreviation.
 */
export function TeamLogo({
  seoname,
  label,
  size = 32,
}: {
  seoname: string | null | undefined;
  label: string;
  size?: number;
}) {
  const [failed, setFailed] = useState(false);

  if (!seoname || failed) {
    return (
      <span
        className="inline-flex shrink-0 items-center justify-center rounded-full bg-surface font-semibold text-muted"
        style={{ width: size, height: size, fontSize: size * 0.34 }}
        aria-hidden
      >
        {label.slice(0, 3).toUpperCase()}
      </span>
    );
  }

  // Schools publish light- and dark-background marks; <picture> picks one
  // without a second request or a hydration-sensitive media query in JS.
  return (
    <picture>
      <source
        media="(prefers-color-scheme: dark)"
        srcSet={logoUrl(seoname, "dark")}
        type="image/svg+xml"
      />
      <img
        src={logoUrl(seoname)}
        alt=""
        width={size}
        height={size}
        loading="lazy"
        onError={() => setFailed(true)}
        className="shrink-0 object-contain"
        style={{ width: size, height: size }}
      />
    </picture>
  );
}
