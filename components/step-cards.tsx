"use client";
import { IconChevronRight } from "@tabler/icons-react";
import Link from "next/link";

import {
  Card,
  CardAction,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";

export function StepCards({
  data = [],
}: {
  data: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
  }[];
}) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
        {data.length === 0 ? (
          <div className="col-span-full text-center py-8 text-muted-foreground">
            No steps available. Please check back later.
          </div>
        ) : (
          data.map((step) => (
            <Link
              key={step.id}
              href={`/dashboard/practice/${step.slug}`}
              className="group"
            >
              <Card className="@container/card h-36 cursor-pointer transition-all hover:shadow-md hover:scale-[1.02] bg-gradient-to-t from-primary/5 to-card dark:bg-card shadow-xs flex flex-col">
                <CardHeader className="flex-1 min-h-0">
                  <CardTitle className="text-xl font-semibold tabular-nums @[250px]/card:text-2xl line-clamp-2 leading-tight">
                    {step.name}
                  </CardTitle>
                  <CardAction>
                    <div className="flex items-center gap-2">
                      <IconChevronRight className="size-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </div>
                  </CardAction>
                </CardHeader>

                <CardFooter className="flex-col items-start gap-1.5 text-sm mt-auto">
                  {/* <div className="line-clamp-1 flex gap-2 font-medium items-center w-full">
                    <span className="line-clamp-1 flex-1">{step.description}</span>
                  </div> */}
                  <div className="text-muted-foreground line-clamp-1 w-full">
                    {step.description}
                  </div>
                </CardFooter>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
