"use client";

import { BookOpen } from "lucide-react";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

interface NavStudiesProps {
  studies: {
    id: string;
    title: string;
    status: string;
  }[];
}

export function NavStudies({ studies }: NavStudiesProps) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Recent Studies</SidebarGroupLabel>
      <SidebarMenu>
        {studies.map((study) => (
          <SidebarMenuItem key={study.id}>
            <SidebarMenuButton asChild tooltip={study.title}>
              <a href={`/studies/${study.id}`}>
                <BookOpen />
                <span>{study.title}</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
