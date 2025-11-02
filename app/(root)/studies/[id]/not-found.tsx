import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="p-4 md:px-8 md:py-6">
      <Card className="max-w-2xl mx-auto mt-12">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            Study Not Found
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            The study you're looking for doesn't exist or has been removed.
          </p>
          <Link href="/studies">
            <Button className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Studies
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

