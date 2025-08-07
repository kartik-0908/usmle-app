"use client";

import { type Icon } from "@tabler/icons-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { ChevronRight, type LucideIcon } from "lucide-react";
import Link from "next/link";

export function NavMain({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon?: Icon;
    isComingSoon?: boolean;
    isActive?: boolean;
    items?: {
      title: string;
      url: string;
    }[];
  }[];
}) {
  return (
    <SidebarGroup>
      <SidebarMenu>
        {items.map((item) => (
          <Collapsible
            key={item.title}
            asChild
            defaultOpen={item.isActive}
            className="group/collapsible"
          >
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                {/* <SidebarMenuButton tooltip={item.title}>
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                  <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                </SidebarMenuButton> */}
                <SidebarMenuButton
                  tooltip={
                    item.isComingSoon
                      ? `${item.title} - Coming Soon`
                      : item.title
                  }
                  disabled={item.isComingSoon}
                  className={
                    item.isComingSoon ? "opacity-50 cursor-not-allowed" : ""
                  }
                >
                  {item.isComingSoon ? (
                    <div className="flex items-center gap-2 w-full">
                      {item.icon && <item.icon className="opacity-50" />}
                      <span className="opacity-50">{item.title}</span>
                      <span className="ml-auto text-xs text-muted-foreground">
                        Coming Soon
                      </span>
                    </div>
                  ) : (
                    <>
                      <Link
                        className="flex items-center gap-2 w-full"
                        href={item.url}
                      >
                        {item.icon && <item.icon />}
                        <span>{item.title}</span>
                      </Link>
                      {item.items && item.items.length > 0 && (
                        <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                      )}
                    </>
                  )}
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  {item.items?.map((subItem) => (
                    <SidebarMenuSubItem key={subItem.title}>
                      <SidebarMenuSubButton asChild>
                        <a href={subItem.url}>
                          <span>{subItem.title}</span>
                        </a>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  ))}
                </SidebarMenuSub>
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
