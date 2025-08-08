"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef } from "react";
import useSWR from "swr";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { QuestionNavigationButton } from "./quesNavButton";

type RailData = {
  setId: string;
  count: number;
  questionIds: string[];
};

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error(`Failed: ${r.status}`);
    return r.json();
  });

export function QuestionRailOrBreadcrumb({
  fallbackBreadcrumb,
}: {
  fallbackBreadcrumb: React.ReactNode;
}) {
  const pathname = usePathname();

  const match = useMemo(
    () => /^\/dashboard\/question\/([^/]+)\/([^/]+)$/.exec(pathname ?? ""),
    [pathname]
  );

  // Not on question page? Show whatever you used before (breadcrumb).
  if (!match) return <>{fallbackBreadcrumb}</>;

  const [, setId, qid] = match;

  return <QuestionRail setId={setId} qid={qid} />;
}

function QuestionRail({ setId, qid }: { setId: string; qid: string }) {
  const router = useRouter();
  const { data, error, isLoading } = useSWR<RailData>(
    `/api/question-ids/${encodeURIComponent(setId)}`,
    fetcher,
    { revalidateOnFocus: false }
  );

 const activeBtnRef = useRef<HTMLButtonElement | null>(null);

  const idx = useMemo(() => {
    if (!data?.questionIds) return -1;
    return data.questionIds.findIndex((id) => id === qid);
  }, [data, qid]);

  useEffect(() => {
    activeBtnRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [idx]);

  if (isLoading) {
    return null
  }
  if (error || !data) {
    return (
      <div className="text-sm text-destructive border rounded-md p-2">
        Failed to load question list, Please reload the page.
      </div>
    );
  }
  const { questionIds } = data;

  const goPrev = () => {
    if (idx > 0) {
      router.push(
        `/dashboard/question/${encodeURIComponent(setId)}/${questionIds[idx - 1]}`
      );
    }
  };
  const goNext = () => {
    if (idx >= 0 && idx < questionIds.length - 1) {
      router.push(
        `/dashboard/question/${encodeURIComponent(setId)}/${questionIds[idx + 1]}`
      );
    }
  };

   const NEIGHBORS = 5; // tweak to taste
  // Always show this many items at the start & end (anchors)
  const ANCHORS = 1;

  const makeCondensedIndexList = () => {
    const n = questionIds.length;
    if (n === 0) return [];

    const set = new Set<number>();

    // Always include first/last anchors
    for (let i = 0; i < Math.min(ANCHORS, n); i++) set.add(i);
    for (let i = Math.max(0, n - ANCHORS); i < n; i++) set.add(i);

    // Include window around active
    if (idx >= 0) {
      for (let i = Math.max(0, idx - NEIGHBORS); i <= Math.min(n - 1, idx + NEIGHBORS); i++) {
        set.add(i);
      }
    }

    // Turn into sorted array
    const ordered = Array.from(set).sort((a, b) => a - b);

    // Insert gap markers (ellipses) where needed
    type Item = { kind: "index"; i: number } | { kind: "gap"; key: string };
    const items: Item[] = [];
    for (let k = 0; k < ordered.length; k++) {
      const current = ordered[k];
      items.push({ kind: "index", i: current });

      const next = ordered[k + 1];
      if (next !== undefined && next > current + 1) {
        items.push({ kind: "gap", key: `${current}-${next}` });
      }
    }
    return items;
  };

  const condensed = makeCondensedIndexList();

 return (
  <div
    role="navigation"
    aria-label="Question navigator"
    tabIndex={0}
    onKeyDown={(e) => {
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    }}
    className="outline-none"
  >
    <ScrollArea className="w-full rounded-md border-0 p-2">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={goPrev}
          disabled={idx <= 0}
          className="px-2 py-1 text-sm rounded-md border disabled:opacity-50"
          aria-label="Previous question"
          title="Previous (←)"
        >
          ←
        </button>

        <div className="flex items-center gap-2 whitespace-nowrap">
          {condensed.map((it) => {
            if (it.kind === "gap") {
              return (
                <span
                  key={`gap-${it.key}`}
                  className="px-2 text-muted-foreground select-none"
                  aria-hidden
                >
                  …
                </span>
              );
            }

            const i = it.i;
            const idAtI = data!.questionIds[i];
            const isActiveAtI = i === idx;

            return (
              <QuestionNavigationButton
                key={idAtI}
                id={idAtI}
                setId={setId}
                questionNumber={i + 1}
                isActive={isActiveAtI}
                activeBtnRef={isActiveAtI ? activeBtnRef : undefined}
              />
            );
          })}
        </div>

        <button
          type="button"
          onClick={goNext}
          disabled={idx < 0 || idx >= (data?.questionIds.length ?? 0) - 1}
          className="px-2 py-1 text-sm rounded-md border disabled:opacity-50"
          aria-label="Next question"
          title="Next (→)"
        >
          →
        </button>
      </div>

      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  </div>
);
}
