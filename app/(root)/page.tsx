import { getBatches } from "@/lib/api/batchApi";
import { getMeerkatHeaders } from "@/lib/server/meerkatHeaders";
import { BatchList } from "./components/batch-list";

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

  return (
    <div className="p-4 md:px-8 md:py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Medidex</h1>
        <p className="text-muted-foreground mt-1">
          Select a batch to view and manage its reports
        </p>
      </div>

      <BatchList batches={batches} />
    </div>
  );
}
