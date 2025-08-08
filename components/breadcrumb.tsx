"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useMemo, useRef, KeyboardEvent } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Fragment } from "react";
import Link from "next/link";

type MyBreadcrumbProps = {
  /** Total number of questions in the set (e.g., 50) */
  totalQuestions?: number;
};

export function MyBreadcrumb({ totalQuestions = 50 }: MyBreadcrumbProps) {
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // If mobile, hide both breadcrumb & rail (adjust if you want it on mobile)
  if (isMobile) return null;

  // Match /dashboard/question/[setId]/[qid]
  const match = useMemo(
    () => /^\/dashboard\/question\/([^/]+)\/([^/]+)$/.exec(pathname ?? ""),
    [pathname]
  );

  if (match) {
    const [, setId, qidRaw] = match;
    // Assume qid is numeric (1-based). If yours is 0-based or a UUID, adjust logic.
    const current = Number(qidRaw) || 1;

    return (
      <QuestionRail
        setId={setId}
        current={current}
        total={totalQuestions}
        basePath="/dashboard/question"
      />
    );
  }

  // ---------- original breadcrumb below ----------
  const pathSegments = (pathname ?? "").split("/").filter(Boolean);

  const formatSegmentName = (segment: string) =>
    segment
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

  const buildPath = (index: number) =>
    "/" + pathSegments.slice(0, index + 1).join("/");

  const breadcrumbItems = pathSegments
    .map((segment, index) => {
      const isLast = index === pathSegments.length - 1;
      const path = buildPath(index);
      let displayName = formatSegmentName(segment);

      if (segment === "dashboard") return null;
      else if (segment === "practice") displayName = "Practice";
      else if (segment === "question") return null;
      else if (pathSegments[index - 1] === "question" && isLast) {
        displayName = "Question";
      }

      return { name: displayName, path, isLast };
    })
    .filter(Boolean)
    .map((item, index, arr) => ({
      ...item!,
      isLast: index === arr.length - 1,
    }));

  if (breadcrumbItems.length === 0 || pathSegments.length <= 1) {
    return <h1 className="text-base font-medium">Dashboard</h1>;
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {breadcrumbItems.map((item, index) => (
          <Fragment key={index}>
            <BreadcrumbItem>
              {item!.isLast ? (
                <BreadcrumbPage className="text-base font-medium">
                  {item!.name}
                </BreadcrumbPage>
              ) : (
                <BreadcrumbLink
                  asChild
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  <Link prefetch href={item!.path as string}>
                    {item!.name}
                  </Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
            {!item!.isLast && <BreadcrumbSeparator />}
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

/** A horizontally scrollable question number rail */
function QuestionRail({
  setId,
  current,
  total,
  basePath,
}: {
  setId: string;
  current: number; // 1-based index of current question
  total: number;
  basePath: string; // e.g. "/dashboard/question"
}) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const activeBtnRef = useRef<HTMLButtonElement | null>(null);

  // Auto-scroll active button into view
  useEffect(() => {
    const el = activeBtnRef.current;
    if (!el) return;
    el.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [current]);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowRight" && current < total) {
      router.push(`${basePath}/${encodeURIComponent(setId)}/${current + 1}`);
    } else if (e.key === "ArrowLeft" && current > 1) {
      router.push(`${basePath}/${encodeURIComponent(setId)}/${current - 1}`);
    }
  };

  return (
    <div
      role="navigation"
      aria-label="Question navigator"
      onKeyDown={onKeyDown}
      tabIndex={0}
      className="outline-none"
    >
      <ScrollArea className="w-full rounded-md border-0 p-0" ref={containerRef}>
        <div className="flex items-center gap-2 whitespace-nowrap">
          {Array.from({ length: total }).map((_, i) => {
            const idx = i + 1;
            const isActive = idx === current;
            return (
              <Button
                key={idx}
                ref={isActive ? activeBtnRef : null}
                asChild
                size="sm"
                variant={isActive ? "default" : "outline"}
                className={isActive ? "pointer-events-none" : undefined}
                aria-current={isActive ? "page" : undefined}
                aria-label={`Go to question ${idx}`}
              >
                <Link
                  prefetch
                  href={`${basePath}/${encodeURIComponent(setId)}/${idx}`}
                >
                  {idx}
                </Link>
              </Button>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
