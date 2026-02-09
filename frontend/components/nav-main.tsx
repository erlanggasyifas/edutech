"use client";

import { ChevronRight, type LucideIcon } from "lucide-react";
import { IconCirclePlusFilled } from "@tabler/icons-react";
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

export function NavMain({
  items,
  label,
  onQuickCreate,
}: {
  items: {
    title: string;
    url: string;
    icon?: LucideIcon;
    isActive?: boolean;
    onClick?: () => void;
    items?: {
      title: string;
      url: string;
      isActive?: boolean;
    }[];
  }[];
  label?: string;
  onQuickCreate?: () => void;
}) {
  return (
    <SidebarGroup>
      {label && <SidebarGroupLabel>{label}</SidebarGroupLabel>}
      <SidebarMenu>
        {/* TOMBOL QUICK CREATE */}
        {onQuickCreate && (
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Quick Create"
              onClick={onQuickCreate}
              className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground mb-4"
            >
              <IconCirclePlusFilled />
              <span className="font-bold">Quick Create</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        )}

        {/* MENU LOOPS */}
        {items.map((item) => {
          const hasSubMenu = item.items && item.items.length > 0;

          // KONDISI 1: JIKA PUNYA SUB-MENU (DROPDOWN)
          if (hasSubMenu) {
            return (
              <Collapsible
                key={item.title}
                asChild
                defaultOpen={item.isActive}
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton tooltip={item.title}>
                      {item.icon && <item.icon />}
                      <span className="truncate flex-1 text-left">
                        {item.title}
                      </span>
                      <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 shrink-0" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.items?.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton
                            asChild
                            isActive={subItem.isActive}
                          >
                            <a href={subItem.url}>
                              <span className="truncate">{subItem.title}</span>
                            </a>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            );
          }

          // KONDISI 2: JIKA MENU BIASA (TOMBOL KLIK)
          return (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                tooltip={item.title}
                isActive={item.isActive}
              >
                {/* PERBAIKAN DISINI:
                    Tambahkan class 'flex items-center gap-2 w-full'
                    agar Icon dan Teks sejajar rapi.
                */}
                <button
                  onClick={item.onClick}
                  className="flex items-center gap-2 w-full text-left"
                >
                  {/* Pastikan href ada jika url bukan # */}
                  {item.url !== "#" ? (
                    <a
                      href={item.url}
                      className="flex items-center gap-2 w-full"
                    >
                      {item.icon && <item.icon className="size-4 shrink-0" />}
                      <span className="truncate flex-1">{item.title}</span>
                    </a>
                  ) : (
                    <>
                      {item.icon && <item.icon className="size-4 shrink-0" />}
                      <span className="truncate flex-1">{item.title}</span>
                    </>
                  )}
                </button>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
