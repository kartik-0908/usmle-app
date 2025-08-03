"use client";

import * as React from "react";
import {
  IconHelp,
  IconInnerShadowTop,
  IconSettings,
  IconPencil,
  IconGraph,
  IconBrandLine,
} from "@tabler/icons-react";

import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import Image from "next/image";

const data = {
  navMain: [
    {
      title: "Practice",
      url: "#",
      icon: IconPencil,
      isComingSoon: false,
      isActive: true,
      items: [
        {
          title: "Topic-wise",
          url: "/dashboard/practice",
        },
        {
          title: "Build Your Own Set",
          url: "/dashboard/practice-custom",
        },
      ],
    },
    {
      title: "Analytics",
      url: "/dashboard/analytics",
      icon: IconGraph,
      isComingSoon: true,
    },
    {
      title: "Mock Interview",
      url: "#",
      icon: IconBrandLine,
      isComingSoon: true,
    },
  ],

  navSecondary: [
    {
      title: "Settings",
      url: "#",
      icon: IconSettings,
    },
    {
      title: "Get Help",
      url: "#",
      icon: IconHelp,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              // asChild
              className="h-8 w-32 hover:bg-transparent"
            >
              {/* <a href="#"> */}
                <Image src={'/logo-new.png'} alt="logo" width={512} height={32}></Image>
                {/* <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">Step Genie</span> */}
              {/* </a> */}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
