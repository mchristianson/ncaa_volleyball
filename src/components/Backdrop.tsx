/**
 * Arena hero behind every screen's header. The art fades to a deep navy at its
 * bottom edge, and --color-bg is set to that same navy, so the mask hands off
 * to the page with no visible seam.
 */
export function Backdrop() {
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[url('/backdrop.webp')] bg-[length:100%_auto] bg-[position:center_top] bg-no-repeat"
        style={{
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
