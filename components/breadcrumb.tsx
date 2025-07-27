"use client";

import { usePathname } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Fragment } from "react";
import Link from "next/link";

export function MyBreadcrumb() {
  const pathname = usePathname();

  // Split the pathname and filter out empty strings
  const pathSegments = pathname.split("/").filter(Boolean);

  // Function to format segment names (remove hyphens, capitalize)
  const formatSegmentName = (segment: string) => {
    return segment
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Function to build breadcrumb path
  const buildPath = (index: number) => {
    return "/" + pathSegments.slice(0, index + 1).join("/");
  };

  // Generate breadcrumb items, filtering out dashboard and question segments
  const breadcrumbItems = pathSegments
    .map((segment, index) => {
      const isLast = index === pathSegments.length - 1;
      const path = buildPath(index);

      // Custom names for specific segments
      let displayName = formatSegmentName(segment);

      // Handle special cases
      if (segment === "dashboard") {
        return null; // Skip dashboard
      } else if (segment === "practice") {
        displayName = "Practice";
      } else if (segment === "question") {
        return null; // Skip question segment
      } else if (pathSegments[index - 1] === "question" && isLast) {
        // If this is a question ID (last segment after "question")
        displayName = "Question";
      }

      return {
        name: displayName,
        path: path,
        isLast: isLast,
      };
    })
    .filter(Boolean) // Remove null items
    .map((item, index, filteredArray) => ({
      ...item,
      isLast: index === filteredArray.length - 1, // Recalculate isLast after filtering
    }));

  // Don't show breadcrumb if we don't have any items or just at dashboard
  if (breadcrumbItems.length === 0 || pathSegments.length <= 1) {
    return <h1 className="text-base font-medium">Dashboard</h1>;
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {breadcrumbItems.map((item, index) => (
          <Fragment key={index}>
            <BreadcrumbItem>
              {item.isLast ? (
                <BreadcrumbPage className="text-base font-medium">
                  {item.name}
                </BreadcrumbPage>
              ) : (
                <BreadcrumbLink
                  asChild
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  <Link prefetch={true} href={item.path as string}>
                    {" "}
                    {item.name}
                  </Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
            {!item.isLast && <BreadcrumbSeparator />}
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
