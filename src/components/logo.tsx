import { cn } from "@/lib/utils";

/** The "S" mark used everywhere Schoolify's identity shows up — favicon (src/app/icon.tsx), OG image, and here in the actual UI, so all three stay visually consistent. */
export function Logo({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex size-6 shrink-0 items-center justify-center rounded-md bg-indigo-600 text-sm font-bold text-white",
        className,
      )}
    >
      S
    </div>
  );
}
