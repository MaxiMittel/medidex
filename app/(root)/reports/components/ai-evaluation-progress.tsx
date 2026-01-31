import { Alert, AlertDescription } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";

interface AiEvaluationProgressProps {
  currentMessage: string | null;
  isStreaming: boolean;
}

export function AiEvaluationProgress({
  currentMessage,
  isStreaming,
}: AiEvaluationProgressProps) {
  if (!isStreaming) {
    return null;
  }

  return (
    <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-900 dark:bg-blue-950">
      <div className="flex items-center gap-3">
        <Spinner className="h-4 w-4 flex-shrink-0 text-blue-600 dark:text-blue-400" />
        <p className="flex-1 text-sm font-medium text-blue-900 dark:text-blue-100">
          {currentMessage || "AI evaluation in progress..."}
        </p>
      </div>
    </div>
  );
}
