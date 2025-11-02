"use client";

import * as React from "react";
import { LifeBuoy, Search, Send, Table, Upload, Users } from "lucide-react";

import { NavMain } from "@/components/sidebar/nav-main";
import { NavSecondary } from "@/components/sidebar/nav-secondary";
import { NavUser } from "@/components/sidebar/nav-user";
import { NavStudies } from "@/components/sidebar/nav-studies";
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
import { Role } from "../../enums/role.enum";

const data = {
  navMain: [
    {
      title: "Search Studies",
      url: "/",
      icon: Search,
      isActive: true,
    },
    {
      title: "All Studies",
      url: "/studies",
      icon: Table,
    },
    {
      title: "Upload Studies",
      url: "/upload",
      icon: Upload,
    },
  ],
  navAdmin: [
    {
      title: "User Management",
      url: "/user-management",
      icon: Users,
    },
  ],
  navSecondary: [
    {
      title: "Support",
      url: "#",
      icon: LifeBuoy,
    },
    {
      title: "Feedback",
      url: "#",
      icon: Send,
    },
  ],
};

export function AppSidebarClient({
  user,
  studies,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  user: {
    name: string;
    email: string;
    avatar: string;
    roles: Role[];
  } | null;
  studies: {
    id: string;
    title: string;
    status: string;
  }[];
}) {
  const isAdmin = user?.roles.includes(Role.ADMIN);

  return (
    <Sidebar
      className="top-(--header-height) h-[calc(100svh-var(--header-height))]!"
      {...props}
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <div className="flex items-center justify-start">
                <Image
                  src="/images/logo.svg"
                  alt="logo"
                  width={40 * 2.5}
                  height={40}
                />
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} title="Platform" />
        <NavStudies studies={studies} />
        {isAdmin && <NavMain items={data.navAdmin} title="Administration" />}
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>{user && <NavUser user={user} />}</SidebarFooter>
    </Sidebar>
  );
}
