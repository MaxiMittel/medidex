import { getBatches } from "@/lib/api/batchApi";
import { getMeerkatHeaders } from "@/lib/server/meerkatHeaders";
import { BatchList } from "./components/batch-list";
import { auth } from "../../lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { HomeHero } from "./components/home-hero";
import { QuickStats } from "./components/quick-stats";
import { FeaturesShowcase } from "./components/features-showcase";

async function fetchBatches() {
  try {
    const headers = await getMeerkatHeaders();
    return await getBatches({ headers });
  } catch (error) {
    console.error("Failed to fetch batches:", error);
    return [];
  }
}

export default async function Home() {
  const batches = await fetchBatches();

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return redirect("/login");
  }

  // Calculate stats
  const totalReports = batches.reduce((sum, b) => sum + b.number_reports, 0);
  const totalAssigned = batches.reduce((sum, b) => sum + b.assigned, 0);
  const totalEmbedded = batches.reduce((sum, b) => sum + b.embedded, 0);

  return (
    <div className="flex-1 overflow-auto">
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-bl from-primary/[0.03] via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-primary/[0.02] via-transparent to-transparent" />
      </div>

      <div className="p-4 md:px-8 md:py-6 max-w-7xl mx-auto">
        <HomeHero userName={session.user.name || "there"} />

        <QuickStats
          totalBatches={batches.length}
          totalReports={totalReports}
          totalAssigned={totalAssigned}
          totalEmbedded={totalEmbedded}
        />

        <div className="mt-10">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">Your Batches</h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Select a batch to view and manage its reports
              </p>
            </div>
          </div>

          <BatchList batches={batches} />
        </div>

        <FeaturesShowcase />
      </div>
    </div>
  );
}
