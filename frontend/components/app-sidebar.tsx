"use client";

import * as React from "react";
import { IconInnerShadowTop, IconBook2 } from "@tabler/icons-react";

import { NavMain } from "@/components/nav-main";
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

const data = {
  user: {
    name: "Pengguna",
    email: "user@example.com",
    avatar: "",
  },
  navMain: [
    {
      title: "Courses",
      url: "#",
      icon: IconBook2,
      viewName: "dashboard" as const, // Tandai ini mengarah ke dashboard
    },
  ],
};

// Tambahkan interface props
interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  setView?: (view: "dashboard" | "create") => void; // Tambahkan tanda tanya (?)
}

export function AppSidebar({ setView, ...props }: AppSidebarProps) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="#">
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">EduTech Inc.</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {/* Pass setView ke NavMain */}
        <NavMain items={data.navMain} setView={setView} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  );
}
