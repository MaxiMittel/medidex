import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { toast } from "sonner";
import { COUNTRY_OPTIONS } from "./constants";
import { useEffect, useState } from "react";

interface AddStudyDialogProps {
  currentBatchHash?: string;
  currentReportIndex?: number;
  currentReportCRGId?: number;
}

export function AddStudyDialog({
  currentBatchHash,
  currentReportIndex,
  currentReportCRGId
}: AddStudyDialogProps) {
  const [durationValue, setDurationValue] = useState("");
  const [durationUnit, setDurationUnit] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("");
  const [countryOpen, setCountryOpen] = useState(false);
  const {
    addStudyDialogOpen,
    setAddStudyDialogOpen,
    newStudyForm,
    updateNewStudyForm,
    resetNewStudyForm,
    submitNewStudy,
    creatingStudy,
  } = useBatchReportsStore();
  useEffect(() => {
    if (addStudyDialogOpen) {
      setSelectedCountry(newStudyForm.countries || "Unclear");
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
    } else {
      setDurationValue("");
      setDurationUnit("");
      setSelectedCountry("");
    }
  }, [addStudyDialogOpen, newStudyForm.countries, newStudyForm.duration]);

  const handleAddStudySubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    if (creatingStudy) return;

    try {
      await submitNewStudy({
        reportIndex:
          typeof currentReportIndex === "number" ? currentReportIndex : undefined,
        batchHash: currentBatchHash,
        reportCRGId: currentReportCRGId,
      });
      toast.success("Study created successfully.");
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
      updateNewStudyForm("duration", "Uncertain");
      return;
    }

    setDurationValue(value);
    setDurationUnit(unit);
    if (value && unit) {
      updateNewStudyForm("duration", `${value} ${unit}`);
    } else {
      updateNewStudyForm("duration", "");
    }
  };

  return (
    <Dialog open={addStudyDialogOpen} onOpenChange={setAddStudyDialogOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-8">
          Add New Study
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add New Study</DialogTitle>
          <DialogDescription>
            Add a study to this report without leaving the page.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleAddStudySubmit}>
          <div className="space-y-2">
            <Label htmlFor="study-short-name">Short name</Label>
            <Input
              id="study-short-name"
              placeholder="e.g. Cardiovascular Outcomes Trial"
              value={newStudyForm.short_name}
              onChange={(event) =>
                updateNewStudyForm("short_name", event.target.value)
              }
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Status of study</Label>
            <Select
              value={newStudyForm.status_of_study}
              onValueChange={(value) => updateNewStudyForm("status_of_study", value)}
            >
              <SelectTrigger>
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
          <div className="space-y-2">
            <Label>CENTRAL submission status</Label>
            <Select
              value={newStudyForm.central_submission_status}
              onValueChange={(value) =>
                updateNewStudyForm("central_submission_status", value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Accepted">Accepted</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Rejected">Rejected</SelectItem>
                <SelectItem value="Not Cochrane">Not Cochrane</SelectItem>
              </SelectContent>
            </Select>
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
                  {selectedCountry || "Unclear"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[480px] max-w-screen-sm p-0 overflow-x-auto">
                <Command className="min-w-[420px]">
                  <CommandInput placeholder="Search country..." />
                  <CommandList className="max-h-[300px] overflow-y-auto overflow-x-auto">
                    <CommandEmpty>No country found.</CommandEmpty>
                    <CommandGroup>
                      {COUNTRY_OPTIONS.map((country) => (
                        <CommandItem
                          key={country}
                          value={country}
                          onSelect={(value) => {
                            setSelectedCountry(value);
                            updateNewStudyForm("countries", value);
                            setCountryOpen(false);
                          }}
                        >
                      {country}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-2">
            <Label htmlFor="study-duration">Duration</Label>
            <div className="grid grid-cols-[1fr,auto] gap-2">
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
              <Select
                value={durationUnit}
                onValueChange={(value) =>
                  handleDurationChange(durationValue, value)
                }
              >
                <SelectTrigger className="w-32">
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
              value={newStudyForm.number_of_participants}
              onChange={(event) =>
                updateNewStudyForm("number_of_participants", event.target.value)
              }
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="study-comparison">Comparison</Label>
            <Input
              id="study-comparison"
              placeholder="e.g. Drug A vs placebo"
              value={newStudyForm.comparison}
              onChange={(event) =>
                updateNewStudyForm("comparison", event.target.value)
              }
              required
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                resetNewStudyForm();
                setAddStudyDialogOpen(false);
              }}
              disabled={creatingStudy}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                creatingStudy ||
                newStudyForm.short_name.trim().length === 0 ||
                newStudyForm.status_of_study.trim().length === 0 ||
                newStudyForm.central_submission_status.trim().length === 0 ||
                newStudyForm.countries.trim().length === 0 ||
                newStudyForm.duration.trim().length === 0 ||
                newStudyForm.comparison.trim().length === 0 ||
                newStudyForm.number_of_participants.trim().length === 0
              }
            >
              {creatingStudy ? "Saving..." : "Save Study"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

