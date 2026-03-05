"use client"

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Calendar, UserPlus, Check, Settings, FileUp, ClipboardCheck, Trash2, Download, Bot } from "lucide-react";
import type { ProjectDetailsDto, ProjectAssigneeDto } from "@/types/apiDTOs";
import type { UserDto } from "@/types/user/user.dto";

const EMPTY_USERS: UserDto[] = [];
const MEDIBOT_USER: UserDto = {
  id: "medibot",
  name: "MediBot",
  email: "",
  roles: [],
  isApproved: true,
};

const withMediBot = (users: UserDto[]) => {
  const hasMediBot = users.some((user) => user.id === MEDIBOT_USER.id);
  return hasMediBot ? users : [...users, MEDIBOT_USER];
};

interface ProjectCardProps {
  project: ProjectDetailsDto;
  index?: number;
  assignableUsers?: UserDto[];
  onAssigneesChange?: (payload: { projectId: string; userIds: string[] }) => void;
}

const getUserInitials = (name?: string) => {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts
    .map((part) => part.charAt(0).toUpperCase())
    .join("")
    .slice(0, 2);
};

const clamp = (value: number, min = 0, max = 100) => {
  if (Number.isNaN(value)) return min;
  return Math.min(Math.max(value, min), max);
};

export function ProjectCard({
  project,
  index = 0,
  assignableUsers = EMPTY_USERS,
  onAssigneesChange,
}: ProjectCardProps) {
  const router = useRouter();
  const [assigneeIds, setAssigneeIds] = useState<string[]>(() =>
    (project.assignees ?? []).map((assignee) => assignee.userId),
  );
  const [isAssigneePopoverOpen, setIsAssigneePopoverOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [pendingAssigneeId, setPendingAssigneeId] = useState<string | null>(null);
  const availableUsers = useMemo(() => withMediBot(assignableUsers), [assignableUsers]);
  const isUpdatingAssignees = pendingAssigneeId !== null;

  useEffect(() => {
    setAssigneeIds((project.assignees ?? []).map((assignee) => assignee.userId));
  }, [project.assignees]);

  const sortedUsers = useMemo(
    () => [...availableUsers].sort((a, b) => a.email.localeCompare(b.email)),
    [availableUsers],
  );

  const knownUsers = useMemo(() => {
    const map = new Map<string, UserDto>();
    sortedUsers.forEach((user) => map.set(user.id, user));
    return map;
  }, [sortedUsers]);

  const assigneeMap = useMemo(() => {
    const map = new Map<string, ProjectAssigneeDto>();
    (project.assignees ?? []).forEach((assignee) => map.set(assignee.userId, assignee));
    return map;
  }, [project.assignees]);

  const resolvedAssignees = assigneeIds.map((userId) => ({
    userId,
    profile: knownUsers.get(userId),
  }));

  const hasAssignees = assigneeIds.length > 0;

  const toggleAssignee = useCallback(
    async (userId: string) => {
      if (isUpdatingAssignees) {
        return;
      }
      const normalizedUserId = userId.trim();
      if (!normalizedUserId) {
        return;
      }
      const isSelected = assigneeIds.includes(normalizedUserId);
      const endpoint = isSelected
        ? `/api/meerkat/projects/${project.projectId}/assignees/${encodeURIComponent(normalizedUserId)}`
        : `/api/meerkat/projects/${project.projectId}/assignees`;
      const requestInit: RequestInit = isSelected
        ? { method: "DELETE" }
        : {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(normalizedUserId),
          };

      setPendingAssigneeId(normalizedUserId);
      try {
        const response = await fetch(endpoint, requestInit);
        if (!response.ok) {
          let detail = "Failed to update project assignees.";
          try {
            const data = await response.json();
            if (typeof data?.detail === "string") {
              detail = data.detail;
            } else if (data) {
              detail = JSON.stringify(data);
            }
          } catch {
            const text = await response.text();
            if (text) {
              detail = text;
            }
          }
          throw new Error(detail);
        }

        setAssigneeIds((prev) => {
          const next = isSelected
            ? prev.filter((id) => id !== normalizedUserId)
            : [...prev, normalizedUserId];
          onAssigneesChange?.({ projectId: project.projectId, userIds: next });
          return next;
        });
      } catch (error) {
        console.error(`Failed to update assignee ${normalizedUserId}`, error);
        window.alert(
          error instanceof Error
            ? error.message
            : "Unable to update project assignees. Please try again."
        );
      } finally {
        setPendingAssigneeId(null);
      }
    },
    [assigneeIds, isUpdatingAssignees, onAssigneesChange, project.projectId]
  );

  const handleDeleteProject = useCallback(async () => {
    if (isDeleting) return;
    const confirmed = window.confirm(`Delete project "${project.name}"? This cannot be undone.`);
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/meerkat/projects/${project.projectId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to delete project");
      }

      router.refresh();
    } catch (error) {
      console.error("Failed to delete project", error);
      window.alert("Unable to delete project. Please try again or contact an administrator.");
    } finally {
      setIsDeleting(false);
    }
  }, [isDeleting, project.name, project.projectId, router]);

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const getRelativeTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays === 0) return "Today";
      if (diffDays === 1) return "Yesterday";
      if (diffDays < 7) return `${diffDays} days ago`;
      if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
      return formatDate(dateString);
    } catch {
      return formatDate(dateString);
    }
  };

  const totalReports = Math.max(project.numberReportsTotal, 1);
  const processedCount = clamp(project.numberReportsPreProcessed ?? 0, 0, totalReports);
  const pdfUploadedCount = clamp(project.numberReportsReadyForProcessing ?? 0, 0, totalReports);
  const reviewCompletedCount = clamp(project.numberReportsReadyForReview ?? 0, 0, totalReports);

  const progressPercent = totalReports > 0 ? Math.round((reviewCompletedCount / totalReports) * 100) : 0;

  const buildReviewUrl = useCallback(
    (intent?: "review" | "studification") => {
      const params = new URLSearchParams({ project : project.projectId });
      if (intent) {
        params.set("intent", intent);
      }
      return `/reports?${params.toString()}`;
    },
    [project.projectId],
  );

  const handleStartPdfUpload = useCallback(() => {
    const params = new URLSearchParams({ project: project.projectId });
    router.push(`/upload?${params.toString()}`);
  }, [project.projectId, router]);

  const handleStartReview = useCallback(() => {
    router.push(buildReviewUrl("review"));
  }, [buildReviewUrl, router]);

  const handleStartExport = useCallback(() => {
    window.alert("Export is coming soon. We'll start the download once all reports are ready.");
  }, []);

  const isExportReady = reviewCompletedCount >= totalReports;

  const stageMetrics = [
    {
      id: "processing",
      label: "Preprocessing",
      icon: Settings,
      value: processedCount,
      total: totalReports,
      fillClass: "bg-primary/70",
    },
    {
      id: "pdf",
      label: "PDF Upload",
      icon: FileUp,
      value: pdfUploadedCount,
      total: totalReports,
      fillClass: "bg-sky-500/70",
      cta: {
        label: "Start PDF Upload",
        variant: "secondary",
        onClick: handleStartPdfUpload,
      },
    },
    {
      id: "review",
      label: "Ready for Review",
      icon: ClipboardCheck,
      value: reviewCompletedCount,
      total: totalReports,
      fillClass: "bg-emerald-500/70",
      cta: {
        label: "Start Review",
        onClick: handleStartReview,
      },
    },
    {
      id: "export",
      label: "Ready for Export",
      icon: Download,
      value: reviewCompletedCount,
      total: totalReports,
      fillClass: "bg-amber-500/70",
      cta: {
        label: "Start Export",
        variant: "secondary",
        onClick: handleStartExport,
        disabled: !isExportReady,
      },
    },
  ];

  const processingStage = stageMetrics.find((stage) => stage.id === "processing");
  const actionableStageMetrics = stageMetrics.filter((stage) => stage.id !== "processing");
  const ProcessingStageIcon = processingStage?.icon;
  const processingStagePercent = processingStage && processingStage.total > 0
    ? Math.round((processingStage.value / processingStage.total) * 100)
    : 0;

  const getReviewerProgress = (userId: string) =>
    clamp(((assigneeMap.get(userId)?.numberReportsLinked ?? 0) / totalReports) * 100);

  const assigneeProgressPanels = resolvedAssignees.map(({ userId, profile }) => {
    const linkedReports = assigneeMap.get(userId)?.numberReportsLinked ?? 0;
    return {
      userId,
      name: profile?.name ?? userId,
      percent: getReviewerProgress(userId),
      linkedReports,
    };
  });
  const orderedAssigneePanels = assigneeProgressPanels.length
    ? [
        ...assigneeProgressPanels.filter((panel) => panel.userId === MEDIBOT_USER.id),
        ...assigneeProgressPanels.filter((panel) => panel.userId !== MEDIBOT_USER.id),
      ]
    : assigneeProgressPanels;
  const hasAssigneePanels = orderedAssigneePanels.length > 0;

  return (
    <div
      className="group relative min-w-[22rem] text-left bg-card border p-5 transition-all hover:border-primary/40 hover:shadow-md"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="absolute top-0 left-0 right-0 h-1 bg-muted overflow-hidden">
        <div className="h-full bg-primary/60 transition-all duration-500" style={{ width: `${progressPercent}%` }} />
      </div>

      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-base group-hover:text-primary transition-colors line-clamp-2 leading-snug">
            {project.name}
          </h3>
          <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1.5">
            <Calendar className="w-3 h-3" />
            {getRelativeTime(project.createdAt)}
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={(event) => {
            event.stopPropagation();
            handleDeleteProject();
          }}
          disabled={isDeleting}
        >
          <Trash2 className="w-4 h-4 text-destructive" />
          <span className="sr-only">Delete project</span>
        </Button>
      </div>

      <div className="mt-4 space-y-3">
        {processingStage && ProcessingStageIcon && (
          <div className="rounded-md border border-dashed border-border/60 bg-muted/20 px-3 py-2">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1 font-semibold uppercase tracking-wide">
                <ProcessingStageIcon className="h-3.5 w-3.5" />
                <span>{processingStage.label}</span>
              </div>
              <span className="text-sm font-semibold text-foreground">
                {processingStage.value} / {processingStage.total}
              </span>
            </div>
            <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full ${processingStage.fillClass}`}
                style={{ width: `${processingStagePercent}%` }}
              />
            </div>
            
          </div>
        )}

        <div className="flex items-center gap-3">
          {actionableStageMetrics.map((stage) => {
            const percent = stage.total > 0 ? Math.round((stage.value / stage.total) * 100) : 0;
            return (
              <div key={stage.id} className="flex-1">
                <div className="relative h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className={`absolute inset-y-0 left-0 ${stage.fillClass}`} style={{ width: `${percent}%` }} />
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 gap-2 text-sm text-muted-foreground sm:grid-cols-3">
          {actionableStageMetrics.map((stage) => {
            const StageIcon = stage.icon;
            return (
              <div
                key={stage.id}
                className="rounded-lg border bg-muted/30 p-3 transition-colors group-hover:border-primary/30"
              >
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <StageIcon className="h-3.5 w-3.5" />
                  {stage.label}
                </div>
                <div className="mt-2 text-base font-semibold text-foreground">
                  {stage.value} / {stage.total}
                </div>
                {stage.cta && (
                  <Button
                    type="button"
                    size="sm"
                    className="mt-3 w-full"
                    disabled={stage.cta?.disabled}
                    onClick={(event) => {
                      event.stopPropagation();
                      stage.cta?.onClick();
                    }}
                  >
                    {stage.cta.label}
                  </Button>
                )}
              </div>
            );
          })}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <span>Studification Progress</span>
          </div>
          <div
            className="flex gap-3 overflow-x-auto pb-1 snap-x snap-mandatory items-stretch"
            style={{ height: "5.5rem" }}
          >
            {hasAssigneePanels ? (
              orderedAssigneePanels.map((panel) => {
                const isMediBot = panel.userId === MEDIBOT_USER.id;
                const description = panel.linkedReports >= totalReports
                  ? "All reports linked"
                  : `${panel.linkedReports} of ${totalReports} reports linked`;

                return (
                  <div
                    key={panel.userId}
                    className="min-w-[15rem] rounded-lg border bg-muted/40 p-4 text-left flex flex-col justify-between h-full"
                  >
                    <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      <span className="truncate flex items-center gap-1.5">
                        {isMediBot && <Bot className="h-4 w-4" aria-hidden />}
                        <span className="truncate">{panel.name}</span>
                      </span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${panel.percent}%` }} />
                    </div>
                    <p className="mt-1.5 text-xs text-muted-foreground/80">{description}</p>
                  </div>
                );
              })
            ) : (
              <div className="flex-1 min-w-full flex-shrink-0 rounded-lg border border-dashed bg-muted/30 p-4 text-sm text-muted-foreground flex flex-col justify-between h-full">
                
                <p className="mt-3 text-xs text-muted-foreground/80 text-center">
                  Assign at least one studificator to start tracking progress.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-3 border-t border-border/50 pt-3">
        <div className="flex items-center gap-2">
          <div className="flex flex-1 items-center min-h-10">
            {hasAssignees ? (
              <p className="text-xs text-muted-foreground">
                {resolvedAssignees.length} studificator{resolvedAssignees.length === 1 ? "" : "s"} assigned.
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">No studificators assigned yet.</p>
            )}
          </div>
          <Popover open={isAssigneePopoverOpen} onOpenChange={setIsAssigneePopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="ml-auto h-8 w-8"
                onClick={(event) => event.stopPropagation()}
              >
                <UserPlus className="h-4 w-4" />
                <span className="sr-only">Assign reviewers</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-64 p-0"
              align="end"
              sideOffset={8}
              onClick={(event) => event.stopPropagation()}
              onKeyDown={(event) => event.stopPropagation()}
            >
              <Command>
                <CommandInput placeholder="Search users..." />
                <CommandList className="max-h-64 overflow-y-auto">
                  <CommandEmpty>No users found.</CommandEmpty>
                  {sortedUsers.length ? (
                    <CommandGroup heading="Team">
                      {sortedUsers.map((user) => {
                        const isSelected = assigneeIds.includes(user.id);
                        return (
                          <CommandItem
                            key={user.id}
                            disabled={isUpdatingAssignees}
                            onSelect={() => {
                              if (isUpdatingAssignees) return;
                              void toggleAssignee(user.id);
                            }}
                            className="flex items-center gap-2"
                          >
                            <Avatar className="h-7 w-7 border border-border/70 bg-muted">
                              <AvatarFallback className="text-[11px] font-semibold">
                                {getUserInitials(user.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 truncate">
                              <p className="text-sm font-medium leading-tight truncate">{user.name}</p>
                            </div>
                            {isSelected && <Check className="h-4 w-4 text-primary" />}
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                  ) : (
                    <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                      No reviewers available yet.
                    </div>
                  )}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
}
