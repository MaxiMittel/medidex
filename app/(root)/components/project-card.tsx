"use client"

import { useCallback, useEffect, useMemo, useState, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
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
import { Calendar, ArrowRight, UserPlus, Check, Settings, FileUp, ClipboardCheck } from "lucide-react";
import type { ProjectDto, ProjectAssigneeDto } from "@/types/apiDTOs";
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

type UsersResponse = {
  users?: UserDto[];
};

interface ProjectCardProps {
  project: ProjectDto;
  index?: number;
  assignableUsers?: UserDto[];
  onAssigneesChange?: (payload: { projectId: string; userIds: string[] }) => void;
  currentUserId?: string;
  isProjectOwner?: boolean;
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
  currentUserId,
  isProjectOwner = false,
  onAssigneesChange,
}: ProjectCardProps) {
  const router = useRouter();
  const [assigneeIds, setAssigneeIds] = useState<string[]>(() =>
    (project.assignees ?? []).map((assignee) => assignee.userId),
  );
  const [isAssigneePopoverOpen, setIsAssigneePopoverOpen] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<UserDto[]>(withMediBot(assignableUsers));

  useEffect(() => {
    setAssigneeIds((project.assignees ?? []).map((assignee) => assignee.userId));
  }, [project.assignees]);

  useEffect(() => {
    setAvailableUsers(withMediBot(assignableUsers));
  }, [assignableUsers]);

  useEffect(() => {
    let active = true;

    const fetchAssignableUsers = async () => {
      try {
        const response = await fetch("/api/users", { cache: "no-store" });
        if (!response.ok) {
          if (response.status !== 403) {
            console.error("Failed to load users", await response.text());
          }
          return;
        }

        const data: UsersResponse = await response.json();
        if (active && Array.isArray(data?.users)) {
          setAvailableUsers(withMediBot(data.users));
        }
      } catch (error) {
        console.error("Failed to load users", error);
      }
    };

    fetchAssignableUsers();

    return () => {
      active = false;
    };
  }, []);

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

  const overflowCount = Math.max(resolvedAssignees.length - 3, 0);
  const hasAssignees = assigneeIds.length > 0;
  const ownerName = useMemo(() => {
    if (!project.owner) return "Unassigned";
    return knownUsers.get(project.owner)?.name ?? project.owner;
  }, [project.owner, knownUsers]);

  const toggleAssignee = (userId: string) => {
    setAssigneeIds((prev) => {
      const isSelected = prev.includes(userId);
      const next = isSelected ? prev.filter((id) => id !== userId) : [...prev, userId];
      onAssigneesChange?.({ projectId: project.projectId, userIds: next });
      return next;
    });
  };

  const handleProjectNavigation = (projectId: string) => {
    router.push(`/projects/${projectId}`);
  };

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

  const totalReports = Math.max(project.numberReports, 1);
  const processedCount = clamp(project.numberReportsProcessed ?? 0, 0, totalReports);
  const pdfUploadedCount = clamp(project.numberReportsWithPdf ?? 0, 0, totalReports);
  const reviewCompletedCount = clamp(project.numberReportsReady ?? 0, 0, totalReports);

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

  const handleStartStudification = useCallback(() => {
    router.push(`/projects/${project.projectId}`);
  }, [project.projectId, router]);

  const stageMetrics = [
    {
      id: "processing",
      label: "Processing",
      icon: Settings,
      value: processedCount,
      total: totalReports,
      fillClass: "bg-primary/70",
      description:
        processedCount >= totalReports
          ? "Processing complete"
          : `${processedCount} processed`,
    },
    {
      id: "pdf",
      label: "PDF Upload",
      icon: FileUp,
      value: pdfUploadedCount,
      total: totalReports,
      fillClass: "bg-sky-500/70",
      description:
        pdfUploadedCount >= totalReports
          ? "PDFs uploaded"
          : `${pdfUploadedCount} uploaded`,
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
      description: `${reviewCompletedCount} ready (${progressPercent}%)`,
      cta: {
        label: "Start Review",
        onClick: handleStartReview,
      },
    },
  ];

  const getReviewerProgress = (userId: string) =>
    clamp(((assigneeMap.get(userId)?.numberReportsLinked ?? 0) / totalReports) * 100);

  const isCurrentUserAssigned = currentUserId ? assigneeIds.includes(currentUserId) : false;
  const personalAssignment = currentUserId
    ? assigneeMap.get(currentUserId) ?? (isCurrentUserAssigned ? { userId: currentUserId, numberReportsLinked: 0 } : undefined)
    : undefined;
  const showPersonalProgress = Boolean(personalAssignment);
  const personalReportsLinked = personalAssignment?.numberReportsLinked ?? 0;
  const personalProgressPercent = showPersonalProgress
    ? clamp((personalReportsLinked / totalReports) * 100)
    : 0;
  const personalProgressRounded = Math.round(personalProgressPercent);
  const personalProgressDescription =
    personalReportsLinked >= totalReports
      ? "All assigned reports linked"
      : personalReportsLinked > 0
        ? `${personalReportsLinked} of ${totalReports} reports linked`
        : "You haven't linked any reports yet";

  const handlePersonalProgressKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleProjectNavigation(project.projectId);
    }
  };

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
          <p className="text-[11px] text-muted-foreground/80 mt-1">Owner · {ownerName}</p>
        </div>
        <ArrowRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0 mt-0.5" />
      </div>

      {(isProjectOwner || showPersonalProgress) && (
        <div className="mt-4 space-y-3">
          {isProjectOwner && (
            <>
              <div className="flex items-center gap-3">
                {stageMetrics.map((stage) => {
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
                {stageMetrics.map((stage) => {
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
                      <p className="text-xs text-muted-foreground/80">{stage.description}</p>
                      {stage.cta && (
                        <Button
                          type="button"
                          size="sm"
                          className="mt-3 w-full"
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
            </>
          )}

          {showPersonalProgress && (
            <div
              className="rounded-lg border bg-muted/40 p-4 cursor-pointer"
              role="button"
              tabIndex={0}
              onClick={() => handleProjectNavigation(project.projectId)}
              onKeyDown={handlePersonalProgressKeyDown}
            >
              <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <span>Personal Progress</span>
                <span>{personalProgressRounded}%</span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full bg-primary" style={{ width: `${personalProgressPercent}%` }} />
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground/80">{personalProgressDescription}</p>
              <Button
                type="button"
                size="sm"
                className="mt-3 w-full sm:w-auto"
                onClick={(event) => {
                  event.stopPropagation();
                  handleStartStudification();
                }}
              >
                Start Studification
              </Button>
            </div>
          )}
        </div>
      )}

      <div className="mt-4 space-y-3 border-t border-border/50 pt-3">
        <div className="flex items-center gap-2">
          <div className="flex flex-1 items-center gap-2 min-h-10">
            {hasAssignees ? (
              <>
                <div className="flex -space-x-2">
                  {resolvedAssignees.slice(0, 3).map(({ userId, profile }) => {
                    const name = profile?.name ?? userId;
                    const reviewerProgress = getReviewerProgress(userId);
                    return (
                      <div
                        key={userId}
                        className="relative h-9 w-9"
                        title={`${name} · ${Math.round(reviewerProgress)}%`}
                      >
                        <div
                          className="absolute inset-0 rounded-full"
                          style={{
                            background:
                              reviewerProgress > 0
                                ? `conic-gradient(hsl(var(--primary)) ${reviewerProgress}%, hsl(var(--muted)) ${reviewerProgress}%)`
                                : "hsl(var(--muted))",
                          }}
                        />
                        <div className="absolute inset-[2px] rounded-full bg-card shadow-sm border border-border flex items-center justify-center text-[11px] font-semibold">
                          {getUserInitials(name)}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {overflowCount > 0 && (
                  <Badge variant="secondary" className="text-[11px] font-medium">
                    +{overflowCount} more
                  </Badge>
                )}
              </>
            ) : (
              <p className="text-xs text-muted-foreground">No reviewers assigned yet.</p>
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
                            onSelect={() => toggleAssignee(user.id)}
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
