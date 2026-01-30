"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
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
import type { AIModel } from "@/hooks/use-genai-evaluation";
import type { PromptOverrides } from "@/types/apiDTOs";

const MODEL_OPTIONS: AIModel[] = ["gpt-5.2", "gpt-5", "gpt-5-mini", "gpt-4.1"];
const TEMPERATURE_RANGE = { min: 0, max: 2, step: 0.05 };
const EMPTY_PROMPT_OVERRIDES: PromptOverrides = {
  initial_eval_prompt: "",
  likely_group_prompt: "",
  likely_compare_prompt: "",
  unsure_review_prompt: "",
  summary_prompt: "",
};

interface AIMatchSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEvaluate: (options: {
    model?: AIModel;
    temperature?: number;
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
  const [temperature, setTemperature] = useState(0.1);
  const [promptOverrides, setPromptOverrides] = useState<PromptOverrides>(
    EMPTY_PROMPT_OVERRIDES
  );

  const updatePromptOverride = (
    key: keyof PromptOverrides,
    value: string
  ) => {
    setPromptOverrides((prev) => ({ ...prev, [key]: value }));
  };

  const buildPromptOverridesPayload = () => {
    const cleaned: PromptOverrides = {
      initial_eval_prompt:
        promptOverrides.initial_eval_prompt?.trim() || undefined,
      likely_group_prompt:
        promptOverrides.likely_group_prompt?.trim() || undefined,
      likely_compare_prompt:
        promptOverrides.likely_compare_prompt?.trim() || undefined,
      unsure_review_prompt:
        promptOverrides.unsure_review_prompt?.trim() || undefined,
      summary_prompt: promptOverrides.summary_prompt?.trim() || undefined,
    };
    const hasOverrides = Object.values(cleaned).some((value) => value);
    return hasOverrides ? cleaned : undefined;
  };

  const handleTemperatureInput = (value: string) => {
    const parsed = Number.parseFloat(value);
    if (Number.isNaN(parsed)) {
      setTemperature(TEMPERATURE_RANGE.min);
      return;
    }
    const clamped = Math.min(
      TEMPERATURE_RANGE.max,
      Math.max(TEMPERATURE_RANGE.min, parsed)
    );
    setTemperature(Number(clamped.toFixed(2)));
  };

  const handleRun = async () => {
    onOpenChange(false);
    await onEvaluate({
      model,
      temperature,
      promptOverrides: buildPromptOverridesPayload(),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[720px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>AI Match Settings</DialogTitle>
          <DialogDescription>
            Configure the model, temperature, and optional prompt overrides
            before running evaluation.
          </DialogDescription>
        </DialogHeader>
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
              <Label htmlFor="ai-temperature">Temperature</Label>
              <div className="flex items-center gap-3">
                <Slider
                  id="ai-temperature"
                  min={TEMPERATURE_RANGE.min}
                  max={TEMPERATURE_RANGE.max}
                  step={TEMPERATURE_RANGE.step}
                  value={[temperature]}
                  onValueChange={(value) => setTemperature(value[0] ?? 0)}
                />
                <Input
                  type="number"
                  min={TEMPERATURE_RANGE.min}
                  max={TEMPERATURE_RANGE.max}
                  step={TEMPERATURE_RANGE.step}
                  value={temperature}
                  onChange={(event) => handleTemperatureInput(event.target.value)}
                  className="w-24"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Range {TEMPERATURE_RANGE.min} - {TEMPERATURE_RANGE.max}.
              </p>
            </div>
          </div>

          <Accordion type="single" collapsible>
            <AccordionItem value="prompt-overrides" className="border-b-0">
              <AccordionTrigger className="text-sm">
                Custom prompt overrides (advanced)
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-3">
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
                    placeholder="Leave blank to use DEFAULT_EVAL_PROMPT."
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
                    placeholder="Leave blank to use DEFAULT_LIKELY_GROUP_PROMPT."
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
                    placeholder="Leave blank to use DEFAULT_LIKELY_COMPARE_PROMPT."
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
                    placeholder="Leave blank to use DEFAULT_UNSURE_REVIEW_PROMPT."
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
                    placeholder="Leave blank to use DEFAULT_SUMMARY_PROMPT."
                    rows={4}
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
