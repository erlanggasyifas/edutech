"use client";

import * as React from "react";
import {
  IconInnerShadowTop,
  IconBook2,
  IconLayoutDashboard,
} from "@tabler/icons-react";
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

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user: { name: string; email: string; avatar: string };
  setView?: (view: "dashboard" | "create") => void; // setView Wajib ada untuk mode dashboard
  courseData?: {
    id: number;
    title: string;
    chapters: {
      id: number;
      chapter_number: number;
      title: string;
    }[];
  };
  currentChapterId?: number;
}

export function AppSidebar({
  user,
  setView,
  courseData,
  currentChapterId,
  ...props
}: AppSidebarProps) {
  const navItems = courseData
    ? [
        // --- MODE DI DALAM COURSE ---
        {
          title: "Kembali ke Dashboard",
          url: "/", // Ini akan me-refresh ke halaman utama
          icon: IconLayoutDashboard,
          isActive: false,
          items: [],
        },
        {
          title: courseData.title,
          url: "#",
          icon: IconBook2,
          isActive: true,
          items: courseData.chapters.map((ch) => ({
            title: `Bab ${ch.chapter_number}: ${ch.title}`,
            url: `/course/${courseData.id}/chapter/${ch.id}`,
            isActive: Number(ch.id) === Number(currentChapterId),
          })),
        },
      ]
    : [
        // --- MODE DASHBOARD UTAMA ---
        {
          title: "Dashboard",
          url: "#",
          icon: IconLayoutDashboard,
          isActive: true,
          onClick: () => setView && setView("dashboard"), // KLIK DISINI MENGUBAH VIEW
          items: [],
        },
        {
          title: "My Courses",
          url: "#",
          icon: IconBook2,
          isActive: false,
          onClick: () => setView && setView("dashboard"), // KLIK DISINI JUGA KE DASHBOARD
          items: [],
        },
      ];

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <IconInnerShadowTop className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">EduTech Inc.</span>
                  <span className="truncate text-xs">Learning Platform</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavMain
          items={navItems}
          label={courseData ? "Materi Pembelajaran" : "Menu Utama"}
          onQuickCreate={setView ? () => setView("create") : undefined}
        />
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
