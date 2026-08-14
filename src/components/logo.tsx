import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * The real Schoolify mark (transparent PNG, provided directly rather than
 * drawn) -- used everywhere the brand shows up in the actual UI. Mirrored
 * as static files (not shared code -- this app doesn't render React
 * through the ImageResponse/Satori pipeline) at src/app/icon.png and
 * apple-icon.png so the favicon and home-screen icon match.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("relative size-6 shrink-0 overflow-hidden", className)}>
      {/* The source mark has a lot of built-in canvas padding around the
          artwork itself -- scaled up and re-centered so it actually reads
          at nav-icon sizes instead of shrinking to an illegible speck. */}
      <Image
        src="/logo-mark.png"
        alt="Schoolify"
        fill
        className="scale-[1.7] object-contain"
        priority
        sizes="56px"
      />
    </div>
  );
}
