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

  const containerRef = useRef<HTMLDivElement | null>(null);
  const activeBtnRef = useRef<HTMLButtonElement | null>(null);

  const idx = useMemo(() => {
    if (!data?.questionIds) return -1;
    return data.questionIds.findIndex((id) => id === qid);
  }, [data, qid]);

  // Auto-scroll active into view
  useEffect(() => {
    activeBtnRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [idx]);

  if (isLoading) {
    return (
      <div className="text-sm text-muted-foreground border rounded-md p-2">
        Loading questions…
      </div>
    );
  }
  if (error || !data) {
    return (
      <div className="text-sm text-destructive border rounded-md p-2">
        Failed to load question list
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
      <ScrollArea className="w-full rounded-md border-0 p-2" ref={containerRef}>
        <div className="flex items-center gap-2 whitespace-nowrap">
          {questionIds.map((id, i) => {
            const isActive = i === idx;
            return (
              <QuestionNavigationButton
                key={id}
                id={id}
                setId={setId}
                questionNumber={i + 1}
                isActive={isActive}
                activeBtnRef={isActive ? activeBtnRef : undefined}
              />
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
