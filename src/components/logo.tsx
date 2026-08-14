import { cn } from "@/lib/utils";

/**
 * Three ascending bars on an indigo tile — reads as grade progress / growth,
 * not a generic monogram. Bar sizes are all in % so the mark scales cleanly
 * from a 16px favicon up to a hero-sized logo. Mirrored (not shared code,
 * this app doesn't render React through the ImageResponse/Satori pipeline)
 * in src/app/icon.tsx, apple-icon.tsx, and opengraph-image.tsx so favicon,
 * home-screen icon, and social preview all match what's in the actual UI.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex size-6 shrink-0 items-end justify-center gap-[10%] rounded-md bg-indigo-600 px-[18%] pt-[18%] pb-[14%]",
        className,
      )}
    >
      <span className="h-[38%] w-[20%] rounded-full bg-white" />
      <span className="h-[64%] w-[20%] rounded-full bg-white" />
      <span className="h-[90%] w-[20%] rounded-full bg-white" />
    </div>
  );
}
