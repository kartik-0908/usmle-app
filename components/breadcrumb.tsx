"use client";

import { usePathname } from "next/navigation";
export function MyBreadcrumb() {
  const pathname = usePathname();
  if (pathname.includes("home")) {
    return <h1 className="text-base font-medium">Home</h1>;
  }
  if (pathname.includes("practice")) {
    return <h1 className="text-base font-medium">Practice</h1>;
  }
  return <h1 className="text-base font-medium">Documents</h1>;
}
