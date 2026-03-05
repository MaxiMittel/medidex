
interface PdfPageProps {
  params: {
    projectId: string;
    reportId: string;
  };
}

export default async function PdfDetailsPage({ params }: PdfPageProps) {
  return (
    <p>Test</p>
  );
}