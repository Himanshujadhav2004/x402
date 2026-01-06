"use client";

import * as React from "react"
import { GalleryVerticalEnd, Minus, Plus } from "lucide-react"

import { SearchForm } from "@/components/search-form"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar"

const data = {
  navMain: [
    {
      title: "Merchant Dashboard",
      url: "#",
      items: [
        {
          title: "API Playground",
          url: "#",
        },
        {
          title: "Endpoint Registry",
          url: "#",
        },
        {
          title: "Analytics",
          url: "#",
        },
      ],
    },
    {
      title: "Documentation",
      url: "#",
      items: [
        {
          title: "Getting Started",
          url: "#",
        },
        {
          title: "API Reference",
          url: "#",
        },
        {
          title: "x402 Protocol",
          url: "#",
        },
      ],
    },
  ],
}

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  onItemSelect?: (itemTitle: string) => void;
  selectedItem?: string | null;
}

export function AppSidebar({ onItemSelect, selectedItem, ...props }: AppSidebarProps) {
  const handleItemClick = (e: React.MouseEvent<HTMLAnchorElement>, title: string) => {
    e.preventDefault();
    onItemSelect?.(title);
  };

  return (
    <Sidebar className="border-r border-sidebar-border/50" {...props}>
      <SidebarHeader className="p-4">
        <SearchForm />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {data.navMain.map((item, index) => (
              <Collapsible
                key={item.title}
                defaultOpen={index === 0}
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton>
                      {item.title}{" "}
                      <Plus className="ml-auto group-data-[state=open]/collapsible:hidden" />
                      <Minus className="ml-auto group-data-[state=closed]/collapsible:hidden" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  {item.items?.length ? (
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.items.map((subItem) => (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={selectedItem === subItem.title}
                            >
                              <a 
                                href={subItem.url}
                                onClick={(e) => handleItemClick(e, subItem.title)}
                              >
                                {subItem.title}
                              </a>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  ) : null}
                </SidebarMenuItem>
              </Collapsible>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
