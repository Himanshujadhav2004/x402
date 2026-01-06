"use client";

import { useState } from "react";
import { AppSidebar } from "@/components/app-sidebar"
import { ApiPlayground } from "@/components/api-playground"
import { EndpointRegistry } from "@/components/endpoint-registry"
import { AnalyticsDashboard } from "@/components/analytics-dashboard"
import { DocsGettingStarted } from "@/components/docs-getting-started"
import { DocsApiReference } from "@/components/docs-api-reference"
import { DocsX402Protocol } from "@/components/docs-x402-protocol"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

export default function Page() {
  const [selectedItem, setSelectedItem] = useState<string | null>("API Playground");

  const getBreadcrumbTitle = () => {
    switch (selectedItem) {
      case "API Playground":
        return "API Playground";
      case "Endpoint Registry":
        return "Endpoint Registry";
      case "Analytics":
        return "Analytics";
      case "Getting Started":
        return "Getting Started";
      case "API Reference":
        return "API Reference";
      case "x402 Protocol":
        return "x402 Protocol";
      default:
        return "Dashboard";
    }
  };

  return (
    <div className="pt-8">
      <SidebarProvider>
        <AppSidebar onItemSelect={setSelectedItem} selectedItem={selectedItem} />
        <SidebarInset>
          <header className="sticky top-16 z-10 flex h-12 shrink-0 items-center gap-2 border-b border-border/50 px-4 bg-background">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage className="font-medium text-sm">{getBreadcrumbTitle()}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4 pb-20">
          {selectedItem === "API Playground" ? (
            <ApiPlayground />
          ) : selectedItem === "Endpoint Registry" ? (
            <EndpointRegistry />
          ) : selectedItem === "Analytics" ? (
            <AnalyticsDashboard />
          ) : selectedItem === "Getting Started" ? (
            <DocsGettingStarted />
          ) : selectedItem === "API Reference" ? (
            <DocsApiReference />
          ) : selectedItem === "x402 Protocol" ? (
            <DocsX402Protocol />
          ) : (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
              <p className="text-muted-foreground">Select a menu item to get started</p>
            </div>
          )}
        </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  )
}
