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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useBatchReportsStore } from "@/hooks/use-batch-reports-store";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Check, X } from "lucide-react";
import { toast } from "sonner";
import { COUNTRY_OPTIONS } from "./constants";
import type {
  ComparisonGroup,
  ComparisonSideKey,
} from "@/types/comparisons";
import {
  createComparisonGroup,
  hasValidComparisonGroups,
} from "@/lib/comparisonUtils";
import { useCallback, useEffect, useState } from "react";

const cloneComparisonGroups = (
  groups?: ComparisonGroup[]
): ComparisonGroup[] =>
  groups && groups.length > 0
    ? groups.map((group) => ({
        id: group.id,
        a: [...group.a],
        b: [...group.b],
      }))
    : [createComparisonGroup()];

const buildEmptyComparisonGroups = () => [createComparisonGroup()];

type SuggestionField = {
  groupId: string;
  side: ComparisonSideKey;
};

interface AddStudyDialogProps {
  currentBatchHash?: string;
  //currentReportIndex?: number;
  currentReportId?: number;
  highlight?: boolean;
  onStudySaved?: () => void;
}

export function AddStudyDialog({
  currentBatchHash,
  //currentReportIndex,
  currentReportId,
  highlight = false,
  onStudySaved,
}: AddStudyDialogProps) {
  const [durationValue, setDurationValue] = useState("");
  const [durationUnit, setDurationUnit] = useState("");
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [countryOpen, setCountryOpen] = useState(false);
  const [shortName, setShortName] = useState("");
  const [statusOfStudy, setStatusOfStudy] = useState("");
  const [numberOfParticipants, setNumberOfParticipants] = useState("");
  const [comparisonGroups, setComparisonGroups] = useState<ComparisonGroup[]>(
    buildEmptyComparisonGroups()
  );
  const [comparisonDrafts, setComparisonDrafts] = useState<
    Record<string, Record<ComparisonSideKey, string>>
  >({});
  const [activeSuggestionField, setActiveSuggestionField] = useState<
    SuggestionField | null
  >(null);
  const [suggestionQuery, setSuggestionQuery] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);
  const [suggestionError, setSuggestionError] = useState<string | null>(null);
  const {
    addStudyDialogOpen,
    setAddStudyDialogOpen,
    newStudyForm,
    setNewStudyForm,
    resetNewStudyForm,
    submitNewStudy,
    creatingStudy,
  } = useBatchReportsStore();
  const resetLocalFormState = useCallback(() => {
    setShortName("");
    setStatusOfStudy("");
    setSelectedCountries([]);
    setDurationValue("");
    setDurationUnit("");
    setNumberOfParticipants("");
    setComparisonGroups(buildEmptyComparisonGroups());
    setComparisonDrafts({});
    setActiveSuggestionField(null);
    setSuggestionQuery("");
    setSuggestions([]);
    setIsFetchingSuggestions(false);
    setSuggestionError(null);
  }, []);
  useEffect(() => {
    if (!addStudyDialogOpen) {
      resetLocalFormState();
      return;
    }

    setShortName(newStudyForm.short_name || "");
    setStatusOfStudy(newStudyForm.status_of_study || "");
    setSelectedCountries(
      newStudyForm.countries && newStudyForm.countries.length > 0
        ? [...newStudyForm.countries]
        : []
    );
    const parts = (newStudyForm.duration || "").split(" ");
    if (parts.length === 2 && !Number.isNaN(Number(parts[0]))) {
      setDurationValue(parts[0]);
      setDurationUnit(parts[1]);
    } else if (newStudyForm.duration?.toLowerCase() === "uncertain") {
      setDurationValue("");
      setDurationUnit("uncertain");
    } else {
      setDurationValue("");
      setDurationUnit("");
    }
    setNumberOfParticipants(newStudyForm.number_of_participants || "");
    setComparisonGroups(
      cloneComparisonGroups(newStudyForm.comparisonGroups)
    );
  }, [
    addStudyDialogOpen,
    newStudyForm,
    resetLocalFormState,
  ]);

  const handleAddStudySubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    if (creatingStudy) return;

    try {
      const payloadCountries =
        selectedCountries.length > 0 ? [...selectedCountries] : ["Unclear"];
      setNewStudyForm({
        short_name: shortName,
        status_of_study: statusOfStudy,
        countries: payloadCountries,
        duration: computedDuration,
        number_of_participants: numberOfParticipants,
        comparisonGroups,
      });

      await submitNewStudy({
        batchHash: currentBatchHash,
        reportId: currentReportId,
      });
      toast.success("Study created successfully.");
      onStudySaved?.();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create study."
      );
    }
  };

  const handleDurationChange = (value: string, unit: string) => {
    if (unit === "uncertain") {
      setDurationValue("");
      setDurationUnit("uncertain");
      return;
    }

    setDurationValue(value);
    setDurationUnit(unit);
  };

  const toggleCountrySelection = (country: string) => {
    setSelectedCountries((previous) =>
      previous.includes(country)
        ? previous.filter((entry) => entry !== country)
        : [...previous, country]
    );
  };

  const updateComparisonValue = (
    groupId: string,
    side: ComparisonSideKey,
    index: number,
    value: string
  ) => {
    setComparisonGroups((previous) =>
      previous.map((group) => {
        if (group.id !== groupId) return group;
        const updatedSide = [...group[side]];
        updatedSide[index] = value;
        return {
          ...group,
          [side]: updatedSide,
        };
      })
    );
  };

  const removeInterventionField = (
    groupId: string,
    side: ComparisonSideKey,
    index: number
  ) => {
    setComparisonGroups((previous) =>
      previous.map((group) => {
        if (group.id !== groupId) return group;
        const updatedSide = [...group[side]];
        updatedSide.splice(index, 1);
        return {
          ...group,
          [side]: updatedSide,
        };
      })
    );
  };

  const addComparisonGroup = () => {
    setComparisonGroups((previous) => [...previous, createComparisonGroup()]);
  };

  const removeComparisonGroup = (groupId: string) => {
    setComparisonGroups((previous) =>
      previous.length <= 1
        ? previous
        : previous.filter((group) => group.id !== groupId)
    );
  };

  const getComparisonDraft = (
    groupId: string,
    side: ComparisonSideKey
  ) => comparisonDrafts[groupId]?.[side] ?? "";

  const setComparisonDraft = (
    groupId: string,
    side: ComparisonSideKey,
    value: string
  ) => {
    setComparisonDrafts((previous) => ({
      ...previous,
      [groupId]: {
        ...previous[groupId],
        [side]: value,
      },
    }));
  };

  const appendComparisonValue = (
    groupId: string,
    side: ComparisonSideKey,
    value: string
  ) => {
    const trimmed = value.trim();
    if (!trimmed) return;

    setComparisonGroups((previous) =>
      previous.map((group) =>
        group.id !== groupId
          ? group
          : {
              ...group,
              [side]: [...group[side], trimmed],
            }
      )
    );
  };

  const isSuggestionFieldActive = (
    groupId: string,
    side: ComparisonSideKey
  ) =>
    activeSuggestionField?.groupId === groupId &&
    activeSuggestionField?.side === side;

  const fetchComparisonSuggestions = async (
    query: string,
    groupId: string,
    side: ComparisonSideKey
  ) => {
    const trimmedQuery = query.trim();
    setActiveSuggestionField({ groupId, side });
    setSuggestionQuery(trimmedQuery);
    setSuggestionError(null);

    if (!trimmedQuery) {
      setSuggestions([]);
      setIsFetchingSuggestions(false);
      return;
    }

    setIsFetchingSuggestions(true);
    try {
      const response = await fetch(
        "/api/meerkat/intervention-suggestions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ query: trimmedQuery, side }),
        }
      );
      if (!response.ok) {
        const message = await response.text();
        throw new Error(
          message || "Unable to load intervention suggestions." 
        );
      }
      const data = await response.json();
      const fetched = Array.isArray(data?.suggestions) ? data.suggestions : [];
      setSuggestions(fetched);
    } catch (error) {
      setSuggestions([]);
      setSuggestionError(
        error instanceof Error
          ? error.message
          : "Failed to load intervention suggestions."
      );
    } finally {
      setIsFetchingSuggestions(false);
    }
  };

  const handleComparisonDraftKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>,
    groupId: string,
    side: ComparisonSideKey
  ) => {
    if (event.key !== "Enter") return;
    event.preventDefault();

    const draftValue = getComparisonDraft(groupId, side);
    appendComparisonValue(groupId, side, draftValue);
    setComparisonDraft(groupId, side, "");
    void fetchComparisonSuggestions(draftValue, groupId, side);
  };

  const renderComparisonSideInputs = (
    group: ComparisonGroup,
    placeholderLabel: string,
    side: ComparisonSideKey
  ) => (
    <div className="space-y-2">
        <div className="text-sm font-semibold leading-tight">{placeholderLabel}</div>
        <Input
          placeholder={`Search ${placeholderLabel.toLowerCase()}...`}
          value={getComparisonDraft(group.id, side)}
          onChange={(event) =>
            setComparisonDraft(group.id, side, event.target.value)
          }
          onKeyDown={(event) =>
            handleComparisonDraftKeyDown(event, group.id, side)
          }
          spellCheck={false}
        />
        <div className="space-y-2 mt-1">
          {group[side].map((value, index) => (
            <div
              key={`${group.id}-${side}-${index}`}
              className="flex items-center justify-between gap-2 rounded-md border border-border/20 bg-muted px-3 py-1 text-sm text-muted-foreground"
            >
              <span className="flex-1 truncate">{value}</span>
              <Button
                variant="ghost"
                size="sm"
                type="button"
                onClick={() => removeInterventionField(group.id, side, index)}
                aria-label={`Remove ${placeholderLabel.toLowerCase()} ${index + 1}`}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>
  );

  const computedDuration =
    durationUnit === "uncertain"
      ? "Uncertain"
      : durationValue && durationUnit
        ? `${durationValue} ${durationUnit}`
        : "";
  const normalizedCountry =
    selectedCountries.length > 0 ? selectedCountries.join(", ") : "Unclear";
  const comparisonValid = hasValidComparisonGroups(comparisonGroups);

  const isSubmitDisabled =
    creatingStudy ||
    shortName.trim().length === 0 ||
    statusOfStudy.trim().length === 0 ||
    normalizedCountry.trim().length === 0 ||
    computedDuration.trim().length === 0 ||
    !comparisonValid ||
    numberOfParticipants.trim().length === 0;

  const handleOpenDialog = useCallback(() => {
    setAddStudyDialogOpen(true);
  }, [setAddStudyDialogOpen]);

  return (
    <Dialog open={addStudyDialogOpen} onOpenChange={setAddStudyDialogOpen}>
      <Button
        type="button"
        size="sm"
        className={`h-8 ${highlight ? "ai-new-study-glow" : ""}`}
        aria-haspopup="dialog"
        aria-expanded={addStudyDialogOpen}
        onClick={handleOpenDialog}
      >
        Add New Study
      </Button>
      <DialogContent
        className="max-w-[900px] sm:max-w-[720px] w-[min(92vw,900px)]"
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Add New Study</DialogTitle>
          <DialogDescription>
            Link this report to a new study.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4 w-full" onSubmit={handleAddStudySubmit}>
          <div className="grid gap-4 grid-cols-[7fr_3fr] w-full items-start">
            <div className="space-y-2">
              <Label htmlFor="study-short-name">Short name</Label>
              <Input
                id="study-short-name"
                placeholder="e.g. Steiner 1995"
                value={shortName}
                onChange={(event) => setShortName(event.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Status of study</Label>
              <Select
                value={statusOfStudy}
                onValueChange={(value) => setStatusOfStudy(value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Closed">Closed</SelectItem>
                  <SelectItem value="Stopped early">Stopped early</SelectItem>
                  <SelectItem value="Open/Ongoing">Open/Ongoing</SelectItem>
                  <SelectItem value="Planned">Planned</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="study-countries">Countries</Label>
            <Popover open={countryOpen} onOpenChange={setCountryOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={countryOpen}
                  className="w-full justify-between"
                >
                  {normalizedCountry}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[480px] max-w-screen-sm p-0 overflow-x-auto">
                <Command className="min-w-[420px]">
                  <CommandInput placeholder="Search country..." />
                  <CommandList className="max-h-[300px] overflow-y-auto overflow-x-auto">
                    <CommandEmpty>No country found.</CommandEmpty>
                    <CommandGroup>
                      {COUNTRY_OPTIONS.map((country) => {
                        const isSelected = selectedCountries.includes(country);
                        return (
                          <CommandItem
                            key={country}
                            value={country}
                            onSelect={() => toggleCountrySelection(country)}
                            aria-pressed={isSelected}
                          >
                            <span className="flex-1">{country}</span>
                            {isSelected && (
                              <Check className="h-4 w-4 text-primary" />
                            )}
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          <div className="grid gap-4 grid-cols-[7fr_3fr] items-start">
            <div className="space-y-2">
              <Label htmlFor="study-duration">Duration</Label>
              <Input
                id="study-duration"
                placeholder="12"
                type="number"
                min="0"
                value={durationValue}
                onChange={(event) =>
                  handleDurationChange(event.target.value, durationUnit)
                }
                disabled={durationUnit === "uncertain"}
                required={durationUnit !== "uncertain"}
              />
            </div>
            <div className="space-y-2">
              <Label>Unit</Label>
              <Select
                value={durationUnit}
                onValueChange={(value) =>
                  handleDurationChange(durationValue, value)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="days">days</SelectItem>
                  <SelectItem value="weeks">weeks</SelectItem>
                  <SelectItem value="months">months</SelectItem>
                  <SelectItem value="years">years</SelectItem>
                  <SelectItem value="uncertain">Uncertain</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="study-participants">Number of participants</Label>
            <Input
              id="study-participants"
              type="number"
              min="0"
              placeholder="0"
              value={numberOfParticipants}
              onChange={(event) => {
                const value = event.target.value;
                setNumberOfParticipants(value);
              }}
              required
            />
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <Label className="text-sm font-semibold">Comparisons</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={addComparisonGroup}
              >
                + Add comparison
              </Button>
            </div>
            <div className="space-y-3">
              {comparisonGroups.map((group, index) => (
                <div
                  key={group.id}
                  className="space-y-3 rounded-lg border border-border/60 p-3.5"
                >

                  <div
                    className="grid gap-3 items-start"
                    style={{
                      gridTemplateColumns:
                        "minmax(0,45%) minmax(0,10%) minmax(0,45%)",
                    }}
                  >
                    {renderComparisonSideInputs(group, "Intervention", "a")}
                    <div className="text-xs font-semibold text-muted-foreground flex items-center justify-center self-center mt-8">
                      vs.
                    </div>
                    {renderComparisonSideInputs(group, "Control", "b")}
                  </div>
                  <div className="flex justify-end">
                    {comparisonGroups.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        type="button"
                        onClick={() => removeComparisonGroup(group.id)}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">Press enter to add interventions and controls.</p>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                resetLocalFormState();
                resetNewStudyForm();
                setAddStudyDialogOpen(false);
              }}
              disabled={creatingStudy}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitDisabled}
            >
              {creatingStudy ? "Saving..." : "Save Study"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
