"use client";

import { SidebarIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import { SearchForm } from "@/components/sidebar/search-form";
import { BatchSelector } from "@/components/sidebar/batch-selector";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useSidebar } from "@/components/ui/sidebar";

type BreadcrumbConfig = {
  label: string;
  href?: string;
};

// Map of pathname to breadcrumb configuration
const breadcrumbMap: Record<string, BreadcrumbConfig[]> = {
  "/": [{ label: "Search Studies" }],
  "/login": [{ label: "Authentication", href: "#" }, { label: "Login" }],
  "/register": [{ label: "Authentication", href: "#" }, { label: "Register" }],
  "/studies": [
    { label: "Studies", href: "#" },
    { label: "All Studies" },
  ],
  "/upload": [
    { label: "Platform", href: "#" },
    { label: "Upload Studies" },
  ],
  "/user-management": [
    { label: "Administration", href: "#" },
    { label: "User Management" },
  ],
};

// Helper function to get breadcrumbs for dynamic routes
function getBreadcrumbs(pathname: string): BreadcrumbConfig[] {
  // Check for exact match first
  if (breadcrumbMap[pathname]) {
    return breadcrumbMap[pathname];
  }

  // Handle dynamic routes by checking path segments
  const segments = pathname.split("/").filter(Boolean);
  const breadcrumbs: BreadcrumbConfig[] = [];

  // Build breadcrumbs from segments
  if (segments.length > 0) {
    let currentPath = "";
    segments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const isLast = index === segments.length - 1;

      // Check if we have a mapping for this path
      if (breadcrumbMap[currentPath]) {
        breadcrumbs.push(...breadcrumbMap[currentPath]);
      } else {
        // Generate breadcrumb from segment
        const label = segment
          .split("-")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");

        breadcrumbs.push({
          label,
          href: isLast ? undefined : currentPath,
        });
      }
    });
  }

  return breadcrumbs.length > 0 ? breadcrumbs : [{ label: "Home" }];
}

export function SiteHeader() {
  const { toggleSidebar } = useSidebar();
  const pathname = usePathname();
  const breadcrumbs = getBreadcrumbs(pathname || "/");
  const isReportsPage = pathname === "/reports";

  return (
    <header className="bg-background fixed left-0 right-0 top-0 z-50 flex w-full items-center border-b">
      <div className="flex h-(--header-height) w-full items-center gap-2 px-4">
        <Button
          className="h-8 w-8"
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
        >
          <SidebarIcon />
        </Button>
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb className="hidden sm:block">
          <BreadcrumbList>
            {breadcrumbs.map((breadcrumb, index) => {
              const isLast = index === breadcrumbs.length - 1;
              return (
                <div key={index} className="contents">
                  <BreadcrumbItem>
                    {isLast || !breadcrumb.href ? (
                      <BreadcrumbPage>{breadcrumb.label}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink href={breadcrumb.href}>
                        {breadcrumb.label}
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                  {!isLast && <BreadcrumbSeparator />}
                </div>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>
        {isReportsPage ? (
          <div className="w-full sm:ml-auto sm:w-auto">
            <BatchSelector />
          </div>
        ) : (
          <SearchForm className="w-full sm:ml-auto sm:w-auto" />
        )}
      </div>
    </header>
  );
}
