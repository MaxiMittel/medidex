import * as React from "react";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { AppSidebarClient } from "./app-sidebar-client";
import { Sidebar } from "@/components/ui/sidebar";

export async function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const user = session?.user
    ? {
        name: session.user.name || "User",
        email: session.user.email || "",
        avatar: session.user.image || "",
      }
    : null;

  return <AppSidebarClient user={user} {...props} />;
}
