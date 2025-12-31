import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { Role } from "@/enums/role.enum";
import { AppHeaderClient } from "./app-header-client";

export async function AppHeader() {
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

  return <AppHeaderClient user={user} />;
}

