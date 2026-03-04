import { adminGuard } from "@/guards/role.guard";
import { UploadPageClient } from "./upload-page-client";

export default async function UploadPage() {
  await adminGuard();
  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4 md:px-8 md:py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Project Management</h1>
          <p className="text-sm text-gray-500">
            Create new projects and manage existing ones
          </p>
        </div>

        <UploadPageClient />
      </div>
    </div>
  );
}
