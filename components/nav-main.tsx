"use client";

import { type Icon } from "@tabler/icons-react";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import Link from "next/link";

export function NavMain({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon?: Icon;
    isComingSoon?: boolean;
  }[];
}) {
  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton 
                tooltip={item.isComingSoon ? `${item.title} - Coming Soon` : item.title}
                disabled={item.isComingSoon}
                className={item.isComingSoon ? "opacity-50 cursor-not-allowed" : ""}
              >
                {item.isComingSoon ? (
                  <div className="flex items-center gap-2 w-full">
                    {item.icon && <item.icon className="opacity-50" />}
                    <span className="opacity-50">{item.title}</span>
                    <span className="ml-auto text-xs text-muted-foreground">Coming Soon</span>
                  </div>
                ) : (
                  <Link className="flex items-center gap-2 w-full" href={item.url}>
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                  </Link>
                )}
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}