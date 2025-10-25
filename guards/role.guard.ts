import { forbidden } from "next/navigation";
import { Role } from "../enums/role.enum";
import { auth } from "../lib/auth";
import { headers } from "next/headers";

export async function adminGuard(): Promise<boolean> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session?.roles.includes(Role.ADMIN)) {
    return true;
  }

  forbidden();
}
