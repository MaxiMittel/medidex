import { forbidden } from "next/navigation";
import { Role } from "../enums/role.enum";
import { auth } from "../lib/auth";
import { headers } from "next/headers";

export async function adminGuard(): Promise<boolean> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // Check if user is approved AND has admin role
  if (session?.roles.includes(Role.ADMIN) && (session as any)?.isApproved) {
    return true;
  }

  forbidden();
}
