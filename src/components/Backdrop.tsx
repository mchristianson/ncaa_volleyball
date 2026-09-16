/**
 * Arena hero behind every screen's header. The art fades to a deep navy at its
 * bottom edge, and --color-bg is set to that same navy, so the mask hands off
 * to the page with no visible seam.
 *
 * ponytail: the source art is lit warm orange, so it is pushed through
 * grayscale -> sepia -> hue-rotate here, which lands every pixel in one blue
 * family, rather than re-rendering the art. Swap the .webp if it is ever
 * regenerated in brand colors, and drop the filter with it.
 */
export function Backdrop() {
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[url('/backdrop.webp')] bg-[length:100%_auto] bg-[position:center_top] bg-no-repeat"
        style={{
          filter: "grayscale(1) sepia(1) hue-rotate(175deg) saturate(2.6) brightness(0.95)",
          maskImage: "linear-gradient(to bottom, #000 40%, transparent 96%)",
          WebkitMaskImage: "linear-gradient(to bottom, #000 40%, transparent 96%)",
        }}
      />
      {/* Scrim: the art's brightest region sits exactly where the title and
          subtitle land, so darken the top before text goes over it. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[190px] bg-gradient-to-b from-bg/85 via-bg/45 to-transparent"
      />
    </>
  );
}
