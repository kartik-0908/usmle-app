"use client";

import * as React from "react";
import {
  IconPencil,
  IconGraph,
  IconBrandLine,
  IconHome,
  IconBrandWhatsapp,
  IconMessage,
} from "@tabler/icons-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

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
import { FeedBack } from "./feedback";

const data = {
  navMain: [
    {
      title: "Home",
      url: "/dashboard/home",
      icon: IconHome,
      isComingSoon: false,
    },
    {
      title: "Practice",
      url: "#",
      icon: IconPencil,
      isComingSoon: false,
      isActive: true,
      items: [
        {
          title: "Create New Set",
          url: "/dashboard/practice",
        },
        {
          title: "Previous Practice Sets",
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
    // {
    //   title: "Settings",
    //   url: "#",
    //   icon: IconSettings,
    // },
    // {
    //   title: "Get Help",
    //   url: "#",
    //   icon: IconHelp,
    // },
    {
      title: "Join Whatsapp Group",
      url: "https://chat.whatsapp.com/KQLaXNhJKEu2w0KqtEP5Cs",
      icon: IconBrandWhatsapp,
      isExternal: true,
      color: "text-green-500",
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
              <Image
                src={"/logo-new.png"}
                alt="logo"
                width={512}
                height={32}
              ></Image>
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
        <FeedBack />
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
