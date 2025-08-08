import React, { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Bookmark } from "lucide-react";
import { cn } from "@/lib/utils";
import useSWR from "swr";
import { fetcher } from "@/lib/swr";

interface QuestionNavigationButtonProps {
  id: string;
  setId: string;
  questionNumber: number;
  isActive: boolean;

  activeBtnRef?: React.RefObject<HTMLButtonElement | null>;
}

export const QuestionNavigationButton: React.FC<
  QuestionNavigationButtonProps
> = ({
  id,
  setId,
  questionNumber,
  isActive,

  activeBtnRef,
}) => {
  const { data, isLoading } = useSWR(`/api/user/question/state/${id}`, fetcher);

  if (isLoading) {
    return null;
  }
  console.log("QuestionNavigationButton data:", id, data);

  const isCorrect = data.isCorrect;
  const isMarked = data.isMarked;

  const getButtonVariant = () => {
    if (isActive) return "default";
    if (isCorrect === true) return "outline"; // Will be overridden by green background
    if (isCorrect === false) return "outline"; // Will be overridden by red background
    return "outline";
  };

  const getButtonClassName = () => {
    const baseClasses = "relative min-w-8 justify-center"; // <- add min width & centering

    if (isActive) {
      return cn(baseClasses, "pointer-events-none");
    }

    if (isCorrect === true) {
      return cn(
        baseClasses,
        "bg-green-500 hover:bg-green-600 text-white border-green-500"
      );
    }

    if (isCorrect === false) {
      return cn(
        baseClasses,
        "bg-red-500 hover:bg-red-600 text-white border-red-500"
      );
    }

    return baseClasses;
  };

  return (
    <Button
      key={id}
      ref={isActive ? activeBtnRef : null}
      asChild
      size="sm"
      variant={getButtonVariant()}
      className={getButtonClassName()}
      aria-current={isActive ? "page" : undefined}
      aria-label={`Go to question ${questionNumber}${isMarked ? " (bookmarked)" : ""}${
        isCorrect === true
          ? " (correct)"
          : isCorrect === false
            ? " (incorrect)"
            : ""
      }`}
    >
      <Link
        prefetch={true}
        href={`/dashboard/question/${encodeURIComponent(setId)}/${id}`}
      >
        {questionNumber}
        {/* Bookmark icon in top-right corner */}
        {isMarked && (
          <Bookmark className="absolute -top-1 -right-1 h-3 w-3 fill-yellow-400 text-yellow-400" />
        )}
      </Link>
    </Button>
  );
};
