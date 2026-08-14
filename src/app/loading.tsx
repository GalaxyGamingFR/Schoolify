import { Skeleton } from "@/components/ui/skeleton";

// Root-level fallback Next shows during a route's initial data fetch
// (App Router wraps every route in a Suspense boundary keyed to the
// nearest loading.tsx). Sized to roughly match AppNav + a page header so
// there's minimal layout shift once the real content swaps in.
export default function Loading() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 px-4 py-3">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Skeleton className="h-6 w-28" />
          <div className="flex gap-2">
            <Skeleton className="size-9 rounded-md" />
            <Skeleton className="size-9 rounded-md" />
            <Skeleton className="size-9 rounded-full" />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
        <Skeleton className="h-8 w-48" />
        <div className="mt-6 space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      </main>
    </div>
  );
}
