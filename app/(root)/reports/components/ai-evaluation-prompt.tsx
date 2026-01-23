"use client";

import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface AIEvaluationPromptProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function AIEvaluationPrompt({
  value,
  onChange,
  disabled,
}: AIEvaluationPromptProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Label htmlFor="ai-prompt" className="text-sm font-medium">
          AI Evaluation Instructions (Optional)
        </Label>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-4 w-4 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p>
                Provide custom instructions to guide the AI evaluation. For example:
                &quot;Prefer randomized controlled trials&quot; or &quot;Focus on studies with
                participants over 65 years old&quot;.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <Textarea
        id="ai-prompt"
        placeholder="e.g., Prefer randomized controlled trials in older adults..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        rows={2}
        className="resize-none"
      />
    </div>
  );
}
