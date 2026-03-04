import { getProjects } from "@/lib/api/projectApi";
import { getMeerkatHeaders } from "@/lib/server/meerkatHeaders";
import { ProjectCard } from "./components/project-card";
import { auth } from "../../lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { HomeHero } from "./components/home-hero";
import { QuickStats } from "./components/quick-stats";
import { FeaturesShowcase } from "./components/features-showcase";
import { Role } from "@/enums/role.enum";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { FileText, Plus } from "lucide-react";

async function fetchProjects() {
  try {
    const headers = await getMeerkatHeaders();
    return await getProjects({ headers });
  } catch (error) {
    console.error("Failed to fetch projects:", error);
    return [];
  }
}

export default async function Home() {
  const projects = await fetchProjects();

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return redirect("/login");
  }

  const isAdmin = session.user.roles?.includes(Role.ADMIN) ?? false;
  const currentUserId = session.user.id ?? undefined;

  // Calculate stats
  const totalReports = projects.reduce((sum, b) => sum + b.numberReports, 0);
  const totalAssigned = projects.reduce((sum, b) => sum + b.numberReportsReady, 0);
  const totalEmbedded = projects.reduce((sum, b) => sum + b.numberReportsProcessed, 0);

  const projectsWithOwnership = projects.map((project) => {
    const normalizedUserId = currentUserId ?? "";
    const isOwner = normalizedUserId == project.owner;

    return {
      project,
      isOwner
    };
  });

  const visibleProjects = projectsWithOwnership.filter((entry) => entry.isOwner)
  const hasVisibleProjects = visibleProjects.length > 0;

  return (
    <div className="flex-1 overflow-auto">
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-bl from-primary/[0.03] via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-primary/[0.02] via-transparent to-transparent" />
      </div>

      <div className="p-4 md:px-8 md:py-6 max-w-7xl mx-auto">
        <HomeHero userName={session.user.name || "there"} />

        <QuickStats
          totalProjects={projects.length}
          totalReports={totalReports}
          totalAssigned={totalAssigned}
          totalEmbedded={totalEmbedded}
        />

        <div className="mt-10">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">Your Projects</h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Select a project to start linking the new reports to studies
              </p>
            </div>
          </div>

          {projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-muted-foreground/20 bg-muted/30">
              <div className="w-16 h-16 bg-primary/10 flex items-center justify-center mb-5 rounded-full">
                <FileText className="w-7 h-7 text-primary" />
              </div>
              <h2 className="text-xl font-semibold mb-2">No projects yet</h2>
              <p className="text-muted-foreground max-w-sm mb-6">
                Create your first project to start analyzing reports and discovering study connections.
              </p>
              {isAdmin ? (
                <Button asChild>
                  <Link href="/upload">
                    <Plus className="mr-2 h-4 w-4" />
                    Create your first project.
                  </Link>
                </Button>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Only administrators can create new projects.
                </p>
              )}
            </div>
          ) : (
            <>
              {!hasVisibleProjects ? (
                <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-muted-foreground/30 bg-muted/20">
                  <FileText className="w-10 h-10 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-1">Owner access required</h3>
                  <p className="text-sm text-muted-foreground max-w-md">
                    You are not listed as an owner for any projects yet. Ask an administrator to add you as an owner so you can view and manage specific projects.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-2">
                  {visibleProjects.map(({ project, isOwner }, index) => (
                    <ProjectCard
                      key={project.projectId}
                      project={project}
                      index={index}
                      isProjectOwner={isOwner}
                      currentUserId={currentUserId}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        <FeaturesShowcase />
      </div>
    </div>
  );
}
