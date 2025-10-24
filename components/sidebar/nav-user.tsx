import { SidebarMenu, SidebarMenuItem } from "@/components/ui/sidebar";
import { NavUserClient } from "./nav-user-client";

// Generate avatar initials from name
function getInitials(name: string) {
  const names = name.split(" ");
  if (names.length >= 2) {
    return `${names[0][0]}${names[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function NavUser({
  user,
}: {
  user: {
    name: string;
    email: string;
    avatar: string;
  };
}) {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <NavUserClient user={user} initials={getInitials(user.name)} />
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
