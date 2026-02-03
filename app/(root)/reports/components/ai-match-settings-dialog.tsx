"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Spinner } from "@/components/ui/spinner";
import { fetchDefaultPrompts } from "@/lib/api/genaiApi";
import type { AIModel } from "@/hooks/use-genai-evaluation";
import type { DefaultPrompts, PromptOverrides } from "@/types/apiDTOs";

const MODEL_OPTIONS: AIModel[] = ["gpt-5.2", "gpt-5", "gpt-5-mini", "gpt-4.1"];
const EMPTY_PROMPT_OVERRIDES: PromptOverrides = {
  background_prompt: "",
  initial_eval_prompt: "",
  likely_group_prompt: "",
  likely_compare_prompt: "",
  unsure_review_prompt: "",
  summary_prompt: "",
  pdf_prompt: "",
};

interface AIMatchSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEvaluate: (options: {
    model?: AIModel;
    includePdf?: boolean;
    promptOverrides?: PromptOverrides;
  }) => Promise<boolean>;
  isRunning: boolean;
  disableRun: boolean;
}

export function AIMatchSettingsDialog({
  open,
  onOpenChange,
  onEvaluate,
  isRunning,
  disableRun,
}: AIMatchSettingsDialogProps) {
  const [model, setModel] = useState<AIModel>("gpt-5-mini");
  const [includePdf, setIncludePdf] = useState(false);
  const [promptOverrides, setPromptOverrides] = useState<PromptOverrides>(
    EMPTY_PROMPT_OVERRIDES
  );
  const [defaultPrompts, setDefaultPrompts] = useState<DefaultPrompts | null>(null);
  const [promptsError, setPromptsError] = useState<string | null>(null);

  const updatePromptOverride = (
    key: keyof PromptOverrides,
    value: string
  ) => {
    setPromptOverrides((prev) => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    void (async () => {
      try {
        const data = await fetchDefaultPrompts();
        setDefaultPrompts(data);
        setPromptsError(null);
      } catch (error) {
        setPromptsError(
          error instanceof Error ? error.message : "Failed to load default prompts."
        );
      }
    })();
  }, []);

  const buildPromptOverridesPayload = () => {
    const cleaned: PromptOverrides = {
      background_prompt: promptOverrides.background_prompt?.trim() || undefined,
      initial_eval_prompt:
        promptOverrides.initial_eval_prompt?.trim() || undefined,
      likely_group_prompt:
        promptOverrides.likely_group_prompt?.trim() || undefined,
      likely_compare_prompt:
        promptOverrides.likely_compare_prompt?.trim() || undefined,
      unsure_review_prompt:
        promptOverrides.unsure_review_prompt?.trim() || undefined,
      summary_prompt: promptOverrides.summary_prompt?.trim() || undefined,
      pdf_prompt: promptOverrides.pdf_prompt?.trim() || undefined,
    };
    const hasOverrides = Object.values(cleaned).some((value) => value);
    return hasOverrides ? cleaned : undefined;
  };

  const handleRun = async () => {
    onOpenChange(false);
    await onEvaluate({
      model,
      includePdf,
      promptOverrides: buildPromptOverridesPayload(),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[720px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>AI Match Settings</DialogTitle>
          <DialogDescription>
            Configure the model, report PDF inclusion, and optional prompt overrides
            before running evaluation.
          </DialogDescription>
        </DialogHeader>
        {promptsError ? (
          <p className="text-sm text-destructive">{promptsError}</p>
        ) : null}
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ai-model">Model</Label>
              <Select value={model} onValueChange={(value) => setModel(value as AIModel)}>
                <SelectTrigger id="ai-model">
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  {MODEL_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ai-include-pdf">Include report PDF</Label>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="ai-include-pdf"
                  checked={includePdf}
                  onCheckedChange={(checked) => setIncludePdf(Boolean(checked))}
                />
                <span className="text-sm text-muted-foreground">
                  Attach the PDF for the report being matched.
                </span>
              </div>
            </div>
          </div>

          <Accordion type="single" collapsible>
            <AccordionItem value="prompt-overrides" className="border-b-0">
              <AccordionTrigger className="text-sm">
                Custom prompt overrides (advanced)
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-3">
                <div className="space-y-2">
                  <Label htmlFor="override-background-prompt">
                    Background prompt
                  </Label>
                  <Textarea
                    id="override-background-prompt"
                    value={promptOverrides.background_prompt || ""}
                    onChange={(event) =>
                      updatePromptOverride(
                        "background_prompt",
                        event.target.value
                      )
                    }
                    placeholder={
                      defaultPrompts?.background_prompt ||
                      "Leave blank to use BACKGROUND_PROMPT."
                    }
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="override-eval-prompt">
                    Initial evaluation prompt
                  </Label>
                  <Textarea
                    id="override-eval-prompt"
                    value={promptOverrides.initial_eval_prompt || ""}
                    onChange={(event) =>
                      updatePromptOverride(
                        "initial_eval_prompt",
                        event.target.value
                      )
                    }
                    placeholder={
                      defaultPrompts?.initial_eval_prompt ||
                      "Leave blank to use DEFAULT_EVAL_PROMPT."
                    }
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="override-likely-group-prompt">
                    Likely group prompt
                  </Label>
                  <Textarea
                    id="override-likely-group-prompt"
                    value={promptOverrides.likely_group_prompt || ""}
                    onChange={(event) =>
                      updatePromptOverride(
                        "likely_group_prompt",
                        event.target.value
                      )
                    }
                    placeholder={
                      defaultPrompts?.likely_group_prompt ||
                      "Leave blank to use DEFAULT_LIKELY_GROUP_PROMPT."
                    }
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="override-likely-compare-prompt">
                    Likely compare prompt
                  </Label>
                  <Textarea
                    id="override-likely-compare-prompt"
                    value={promptOverrides.likely_compare_prompt || ""}
                    onChange={(event) =>
                      updatePromptOverride(
                        "likely_compare_prompt",
                        event.target.value
                      )
                    }
                    placeholder={
                      defaultPrompts?.likely_compare_prompt ||
                      "Leave blank to use DEFAULT_LIKELY_COMPARE_PROMPT."
                    }
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="override-unsure-review-prompt">
                    Unsure review prompt
                  </Label>
                  <Textarea
                    id="override-unsure-review-prompt"
                    value={promptOverrides.unsure_review_prompt || ""}
                    onChange={(event) =>
                      updatePromptOverride(
                        "unsure_review_prompt",
                        event.target.value
                      )
                    }
                    placeholder={
                      defaultPrompts?.unsure_review_prompt ||
                      "Leave blank to use DEFAULT_UNSURE_REVIEW_PROMPT."
                    }
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="override-summary-prompt">
                    Summary prompt
                  </Label>
                  <Textarea
                    id="override-summary-prompt"
                    value={promptOverrides.summary_prompt || ""}
                    onChange={(event) =>
                      updatePromptOverride("summary_prompt", event.target.value)
                    }
                    placeholder={
                      defaultPrompts?.summary_prompt ||
                      "Leave blank to use DEFAULT_SUMMARY_PROMPT."
                    }
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="override-pdf-prompt">
                    PDF attachment note
                  </Label>
                  <Textarea
                    id="override-pdf-prompt"
                    value={promptOverrides.pdf_prompt || ""}
                    onChange={(event) =>
                      updatePromptOverride("pdf_prompt", event.target.value)
                    }
                    placeholder={
                      defaultPrompts?.pdf_prompt ||
                      "Leave blank to use the default note (appended when Include report PDF is on)."
                    }
                    rows={3}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => void handleRun()}
            disabled={isRunning || disableRun}
          >
            {isRunning ? <Spinner className="h-4 w-4" /> : "Run"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
