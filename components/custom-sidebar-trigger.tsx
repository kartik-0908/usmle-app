"use client";
import { SidebarTrigger, useSidebar } from "./ui/sidebar";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
export default function CustomSidebarTrigger() {
  const { state } = useSidebar();

  return (
    <Tooltip>
      <TooltipTrigger>
        <SidebarTrigger className="-ml-1" />
      </TooltipTrigger>
      <TooltipContent>
        {state === "expanded" ? "Collapse Sidebar" : "Expand Sidebar"}
      </TooltipContent>
    </Tooltip>
  );
}
