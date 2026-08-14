"use client";

import { useEffect, useRef, useState } from "react";
import { getLogEntries, type LogEntry } from "@/lib/actions/admin-logs";
import { cn } from "@/lib/utils";

const POLL_MS = 4000;
const MAX_BUFFERED = 300;

const LEVEL_STYLE: Record<LogEntry["level"], string> = {
  ERROR: "text-red-400",
  WARN: "text-amber-400",
  INFO: "text-sky-400",
};

function timeOf(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function LiveLogConsole({ initialEntries }: { initialEntries: LogEntry[] }) {
  const [entries, setEntries] = useState(initialEntries);
  const [freshIds, setFreshIds] = useState<Set<string>>(new Set());
  const [connected, setConnected] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const nearBottomRef = useRef(true);
  const latestAtRef = useRef(initialEntries.at(-1)?.at);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      nearBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 48;
    };
    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (el && nearBottomRef.current) el.scrollTop = el.scrollHeight;
  }, [entries]);

  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      try {
        const fresh = await getLogEntries(latestAtRef.current);
        if (cancelled) return;
        setConnected(true);
        if (fresh.length > 0) {
          latestAtRef.current = fresh.at(-1)!.at;
          setFreshIds(new Set(fresh.map((e) => e.id)));
          setEntries((prev) => [...prev, ...fresh].slice(-MAX_BUFFERED));
          window.setTimeout(() => setFreshIds(new Set()), 1200);
        }
      } catch {
        if (!cancelled) setConnected(false);
      }
    };
    const interval = window.setInterval(tick, POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  return (
    <div className="mt-6 overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950 shadow-sm">
      <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/60 px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="size-2.5 rounded-full bg-red-500/70" />
          <span className="size-2.5 rounded-full bg-amber-500/70" />
          <span className="size-2.5 rounded-full bg-emerald-500/70" />
          <span className="ml-2 font-mono text-xs text-zinc-500">admin@schoolify:~$ tail -f system.log</span>
        </div>
        <div className="flex items-center gap-1.5 font-mono text-xs">
          <span
            className={cn(
              "size-1.5 rounded-full",
              connected ? "bg-emerald-400 animate-pulse" : "bg-zinc-600",
            )}
          />
          <span className={connected ? "text-emerald-400" : "text-zinc-500"}>
            {connected ? "LIVE" : "RECONNECTING"}
          </span>
        </div>
      </div>

      <div ref={scrollRef} className="h-[420px] overflow-y-auto px-3 py-2 font-mono text-[0.8rem] leading-relaxed">
        {entries.length === 0 ? (
          <p className="text-zinc-600"># nothing logged yet</p>
        ) : (
          entries.map((e) => (
            <div
              key={e.id}
              className={cn(
                "flex gap-2 whitespace-pre-wrap break-words",
                freshIds.has(e.id) && "animate-in fade-in slide-in-from-bottom-1 duration-300",
              )}
            >
              <span className="shrink-0 text-zinc-600">[{timeOf(e.at)}]</span>
              <span className={cn("shrink-0 font-semibold", LEVEL_STYLE[e.level])}>
                [{e.level.padEnd(5, " ")}]
              </span>
              <span className="text-zinc-300">{e.message}</span>
            </div>
          ))
        )}
        <div className="flex gap-2">
          <span className="text-zinc-600">$</span>
          <span className="inline-block h-4 w-1.5 animate-pulse bg-zinc-400" />
        </div>
      </div>
    </div>
  );
}
