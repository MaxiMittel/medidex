import * as React from "react";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { AppSidebarClient } from "./app-sidebar-client";
import { Sidebar } from "@/components/ui/sidebar";
import { Role } from "../../enums/role.enum";

export async function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const user = session?.user
    ? {
        name: session.user.name || "User",
        email: session.user.email || "",
        avatar: session.user.image || "",
        roles: session.roles as Role[],
      }
    : null;

  // Placeholder studies data for design evaluation
  const studies = [
    { id: "1", title: "COVID-19 Vaccine Efficacy Study", status: "ACTIVE" },
    { id: "2", title: "Diabetes Prevention Trial", status: "ACTIVE" },
    { id: "3", title: "Cardiovascular Health Research", status: "COMPLETED" },
    { id: "4", title: "Mental Health Assessment", status: "DRAFT" },
    { id: "5", title: "Cancer Treatment Protocol", status: "ACTIVE" },
    { id: "6", title: "Neurological Disorder Study", status: "ARCHIVED" },
    { id: "7", title: "Pediatric Nutrition Research", status: "ACTIVE" },
    { id: "8", title: "Sleep Pattern Analysis", status: "COMPLETED" },
  ];

  return <AppSidebarClient user={user} studies={studies} {...props} />;
}
