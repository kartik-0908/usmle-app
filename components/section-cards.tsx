"use client";
import {
  IconChevronRight,
  IconMinus,
  IconSearch,
  IconTrendingDown,
  IconTrendingUp,
} from "@tabler/icons-react";
import Link from "next/link";

import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useState } from "react";
import { TopicWithProgress } from "@/lib/types/topic";

export function TopicCards({
  step,
  topics,
}: {
  step: string;
  topics: TopicWithProgress[];
}) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTopics = topics.filter((topic) =>
    topic.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <IconTrendingUp className="size-4 text-green-600" />;
      case "down":
        return <IconTrendingDown className="size-4 text-red-600" />;
      default:
        return <IconMinus className="size-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="px-4 lg:px-6">
        <div className="relative max-w-md">
          <IconSearch className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-input bg-background pl-10 pr-4 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
        {filteredTopics.length === 0 ? (
          <div className="col-span-full text-center py-8 text-muted-foreground">
            {searchQuery
              ? "No topics found matching your search."
              : "No topics available."}
          </div>
        ) : (
          filteredTopics.map((topic) => (
            <Link
              key={topic.id}
              href={`/dashboard/practice/${step}/${topic.slug}`}
              className="group"
            >
              <Card className="@container/card h-48 cursor-pointer transition-all hover:shadow-md hover:scale-[1.02] bg-gradient-to-t from-primary/5 to-card dark:bg-card shadow-xs flex flex-col">
                <CardHeader className="flex-1 min-h-0">
                  <CardDescription>
                    {topic.practiced} / {topic.total} Questions
                    {topic.practiced > 0 && (
                      <span className="ml-2 text-xs">
                        ({Math.round(topic.accuracy)}% accuracy)
                      </span>
                    )}
                  </CardDescription>
                  <CardTitle className="text-xl font-semibold tabular-nums @[250px]/card:text-2xl line-clamp-2 leading-tight">
                    {topic.name}
                  </CardTitle>
                  <CardAction>
                    <div className="flex items-center gap-2">
                      <IconChevronRight className="size-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </div>
                  </CardAction>
                </CardHeader>
                <CardFooter className="flex-col items-start gap-1.5 text-sm mt-auto">
                  <div className="line-clamp-1 flex gap-2 font-medium items-center w-full">
                    <span className="line-clamp-1 flex-1">{topic.note}</span>
                    {getTrendIcon(topic.trend)}
                  </div>
                  <div className="text-muted-foreground line-clamp-1 w-full">
                    {topic.detail}
                  </div>
                  {topic.streak > 0 && (
                    <div className="text-xs text-orange-600 font-medium">
                      🔥 {topic.streak} day streak
                    </div>
                  )}
                </CardFooter>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
