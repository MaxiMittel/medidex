import { UploadSection } from "./upload-section";

export default async function UploadPage() {
  return (
    <div className="p-4 md:px-8 md:py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Upload Studies</h1>
        <p className="text-sm text-gray-500">
          Import studies from RIS files
        </p>
      </div>
      
      <UploadSection />
    </div>
  );
}

