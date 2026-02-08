"use client";

import { IconCirclePlusFilled, type Icon } from "@tabler/icons-react";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export function NavMain({
  items,
  setView, // Ini sekarang optional
}: {
  items: any[];
  setView?: (view: "dashboard" | "create") => void; // Tambahkan tanda tanya (?)
}) {
  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        {/* Tombol Quick Create HANYA muncul jika setView ada (artinya di Dashboard) */}
        {setView && (
          <SidebarMenu>
            <SidebarMenuItem className="flex items-center gap-2">
              <SidebarMenuButton
                tooltip="Quick Create"
                onClick={() => setView("create")}
                className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground min-w-8"
              >
                <IconCirclePlusFilled />
                <span>Quick Create</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        )}

        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                tooltip={item.title}
                // Jika setView ada, pakai itu. Jika tidak, jadikan link biasa atau null
                onClick={() =>
                  setView
                    ? setView(item.viewName)
                    : (window.location.href = "/")
                }
              >
                {item.icon && <item.icon />}
                <span>{item.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
