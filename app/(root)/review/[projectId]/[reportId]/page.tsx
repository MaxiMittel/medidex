"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useDetailsSheet } from "@/app/context/details-sheet-context";
import {
  useReviewAnnotations,
  useReviewAnnotationsActions,
} from "../components/review-annotations-context";
import type { StudyDto } from "@/types/apiDTOs";
import { Calendar, Scale, CircleCheckBig, CircleAlert, Users, Info } from "lucide-react";

interface GroupedUserStudy {
  userId: string;
  userName: string;
  studies: Array<{ studyId: number; studyShortName: string }>;
}

type UsersResponse = {
  users?: Array<{ id: string; name: string }>;
};

interface FinalDecisionStudyItem {
  study: StudyDto;
  selectedBy: string[];
  isUnanimous: boolean;
}

const formatParticipantCount = (value?: string | null) => {
  if (!value) return "-";
  const numericValue = Number(value.replace(/,/g, ""));
  if (Number.isFinite(numericValue)) {
    return numericValue.toLocaleString();
  }
  return value;
};

const getStudyConfirmationPath = (reportId: string, studyId: number) =>
  `/api/meerkat/reports/${reportId}/studies/${studyId}/confirmation`;

const toggleStudyConfirmation = async (
  reportId: string,
  studyId: number,
  shouldConfirm: boolean
) => {
  const response = await fetch(getStudyConfirmationPath(reportId, studyId), {
    method: shouldConfirm ? "PUT" : "DELETE",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });

  if (response.ok) {
    return;
  }

  let detail = `Failed to ${shouldConfirm ? "confirm" : "unconfirm"} study`;
  try {
    const payload = await response.json();
    if (payload?.error) {
      detail = payload.error;
    }
  } catch (error) {
    console.error("Failed to parse confirmation toggle error payload", error);
  }

  throw new Error(detail);
};

export default function ReviewDetailsPage() {
  const annotations = useReviewAnnotations();
  const { updateConfirmedForReportStudy } = useReviewAnnotationsActions();
  const params = useParams();
  const { openWithStudyId } = useDetailsSheet();

  const [userNameById, setUserNameById] = useState<Map<string, string>>(new Map());
  const [studyById, setStudyById] = useState<Record<number, StudyDto>>({});
  const [loadingStudyIds, setLoadingStudyIds] = useState<Set<number>>(new Set());
  const [selectedFinalStudyIds, setSelectedFinalStudyIds] = useState<Set<number>>(new Set());
  const [syncingFinalStudyIds, setSyncingFinalStudyIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    let isMounted = true;

    const loadUsers = async () => {
      try {
        const response = await fetch("/api/users", { cache: "no-store" });
        if (!response.ok) return;

        const data = (await response.json()) as UsersResponse;
        const nextMap = new Map<string, string>();

        for (const user of data.users ?? []) {
          nextMap.set(user.id, user.name);
        }

        if (isMounted) {
          setUserNameById(nextMap);
        }
      } catch (error) {
        console.error("Failed to resolve user names:", error);
      }
    };

    void loadUsers();

    return () => {
      isMounted = false;
    };
  }, []);

  const reportIdParam =
    typeof params.reportId === "string"
      ? params.reportId
      : Array.isArray(params.reportId)
      ? params.reportId[0]
      : undefined;

  useEffect(() => {
    if (!reportIdParam) {
      setSelectedFinalStudyIds(new Set());
      return;
    }

    const confirmedStudyIds = new Set<number>();
    for (const annotation of annotations[reportIdParam] ?? []) {
      if (annotation.confirmed) {
        confirmedStudyIds.add(annotation.studyId);
      }
    }

    setSelectedFinalStudyIds(confirmedStudyIds);
  }, [annotations, reportIdParam]);

  const groupedByUser = useMemo<GroupedUserStudy[]>(() => {
    if (!reportIdParam) {
      return [];
    }

    const reportAnnotations = annotations[reportIdParam] ?? [];
    const userToStudies = new Map<string, Map<number, string>>();

    for (const annotation of reportAnnotations) {
      if (!userToStudies.has(annotation.user)) {
        userToStudies.set(annotation.user, new Map<number, string>());
      }
      userToStudies
        .get(annotation.user)
        ?.set(annotation.studyId, annotation.studyShortName);
    }

    return Array.from(userToStudies.entries())
      .map(([userId, studiesMap]) => ({
        userId,
        userName: userNameById.get(userId) ?? "Unknown user",
        studies: Array.from(studiesMap.entries())
          .map(([studyId, studyShortName]) => ({ studyId, studyShortName }))
          .sort((a, b) => a.studyShortName.localeCompare(b.studyShortName)),
      }))
      .sort((a, b) => a.userName.localeCompare(b.userName));
  }, [annotations, reportIdParam, userNameById]);

  const studyIdsToLoad = useMemo(() => {
    const ids = new Set<number>();

    for (const group of groupedByUser) {
      for (const study of group.studies) {
        ids.add(study.studyId);
      }
    }

    return Array.from(ids);
  }, [groupedByUser]);

  useEffect(() => {
    if (studyIdsToLoad.length === 0) {
      setStudyById({});
      setLoadingStudyIds(new Set());
      return;
    }

    let isMounted = true;
    const nextLoading = new Set(studyIdsToLoad);
    setLoadingStudyIds(nextLoading);

    const loadStudies = async () => {
      const entries = await Promise.all(
        studyIdsToLoad.map(async (studyId) => {
          try {
            const response = await fetch(`/api/meerkat/studies/${studyId}`, {
              cache: "no-store",
            });

            if (!response.ok) {
              throw new Error(`Failed to load study ${studyId}`);
            }

            const data = (await response.json()) as StudyDto;
            return [studyId, data] as const;
          } catch (error) {
            console.error(`Failed to resolve study ${studyId}:`, error);
            return null;
          }
        })
      );

      if (!isMounted) return;

      const nextStudyById: Record<number, StudyDto> = {};
      for (const entry of entries) {
        if (!entry) continue;
        const [studyId, study] = entry;
        nextStudyById[studyId] = study;
      }

      setStudyById(nextStudyById);
      setLoadingStudyIds(new Set());
    };

    void loadStudies();

    return () => {
      isMounted = false;
      setLoadingStudyIds(nextLoading);
    };
  }, [studyIdsToLoad]);

  const finalDecisionStudies = useMemo<FinalDecisionStudyItem[]>(() => {
    const totalAnnotators = groupedByUser.length;

    return studyIdsToLoad
      .map((studyId) => {
        const study = studyById[studyId];
        if (!study) return null;

        const selectedBy = groupedByUser
          .filter((group) => group.studies.some((studyRef) => studyRef.studyId === studyId))
          .map((group) => group.userName)
          .sort((a, b) => a.localeCompare(b));

        return {
          study,
          selectedBy,
          isUnanimous: totalAnnotators > 0 && selectedBy.length === totalAnnotators,
        };
      })
      .filter((item): item is FinalDecisionStudyItem => Boolean(item))
      .sort((a, b) => a.study.shortName.localeCompare(b.study.shortName));
  }, [groupedByUser, studyById, studyIdsToLoad]);

  const isLoadingFreshStudies = studyIdsToLoad.length > 0 && loadingStudyIds.size > 0;

  const toggleFinalStudySelection = async (studyId: number) => {
    if (!reportIdParam || syncingFinalStudyIds.has(studyId)) {
      return;
    }

    const wasSelected = selectedFinalStudyIds.has(studyId);
    const shouldConfirm = !wasSelected;

    // Optimistic UI update, then roll back if the backend toggle fails.
    setSelectedFinalStudyIds((prev) => {
      const next = new Set(prev);
      if (shouldConfirm) {
        next.add(studyId);
      } else {
        next.delete(studyId);
      }
      return next;
    });
    setSyncingFinalStudyIds((prev) => {
      const next = new Set(prev);
      next.add(studyId);
      return next;
    });
    updateConfirmedForReportStudy(reportIdParam, studyId, shouldConfirm);

    try {
      await toggleStudyConfirmation(reportIdParam, studyId, shouldConfirm);
    } catch (error) {
      setSelectedFinalStudyIds((prev) => {
        const next = new Set(prev);
        if (wasSelected) {
          next.add(studyId);
        } else {
          next.delete(studyId);
        }
        return next;
      });
      updateConfirmedForReportStudy(reportIdParam, studyId, wasSelected);
      console.error("Failed to sync study confirmation state:", error);
    } finally {
      setSyncingFinalStudyIds((prev) => {
        const next = new Set(prev);
        next.delete(studyId);
        return next;
      });
    }
  };

  if (!reportIdParam) {
    return (
      <div className="h-full p-6">
        <Empty className="h-full border">
          <EmptyHeader>
            <EmptyTitle>No report selected</EmptyTitle>
            <EmptyDescription>
              Select a report from the list to view assigned studies by annotator.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  return (
    <div className="pt-4">
      <div className="px-4 pb-2 border-b border-border">
        <div className="flex items-center gap-2">
          <CircleCheckBig className="h-6 w-6 text-primary" />
          <h2 className="text-xl font-semibold">Review Annotations</h2>
        </div>
      </div>

      <div className="px-4 py-4">
        <section className="mb-8 space-y-4 rounded-none border border-border bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-foreground">
                Final Decision
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Select one or more studies from the annotator suggestions.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8"
                onClick={() => setSelectedFinalStudyIds(new Set())}
                disabled={selectedFinalStudyIds.size === 0}
              >
                Clear
              </Button>
            </div>
          </div>

          {groupedByUser.length === 0 ? (
            <Empty className="border">
              <EmptyHeader>
                <EmptyTitle>No annotations found</EmptyTitle>
                <EmptyDescription>
                  This report does not have annotation assignments yet.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : isLoadingFreshStudies && finalDecisionStudies.length === 0 ? (
            <div className="space-y-3">
              {studyIdsToLoad.slice(0, 4).map((studyId) => (
                <div
                  key={`loading-study-${studyId}`}
                  className="h-32 rounded-lg border border-border bg-card p-4"
                >
                  <div className="flex h-full flex-col justify-between">
                    <div className="space-y-3">
                      <Skeleton className="h-5 w-48" />
                      <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-56" />
                      </div>
                    </div>
                    <Skeleton className="h-4 w-64" />
                  </div>
                </div>
              ))}
            </div>
          ) : finalDecisionStudies.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border/70 bg-background/60 p-4 text-sm text-muted-foreground">
              No study suggestions available yet.
            </div>
          ) : (
            <div className="space-y-3">
              {finalDecisionStudies.map((item) => {
                const isLoading = loadingStudyIds.has(item.study.studyId) || !studyById[item.study.studyId];
                const isSelected = selectedFinalStudyIds.has(item.study.studyId);
                const isSyncing = syncingFinalStudyIds.has(item.study.studyId);
                const rowClass = isSelected
                  ? "border-emerald-300 bg-emerald-100"
                  : item.isUnanimous
                  ? "border-border bg-emerald-50/20 hover:bg-emerald-50/35"
                  : "border-border bg-amber-50/40 hover:bg-amber-50/60";

                return (
                  <div
                    key={item.study.studyId}
                    role="button"
                    tabIndex={0}
                    aria-pressed={isSelected}
                    aria-label={isSelected ? `Deselect ${item.study.shortName}` : `Select ${item.study.shortName}`}
                    onClick={() => {
                      void toggleFinalStudySelection(item.study.studyId);
                    }}
                    onKeyDown={(event) => {
                      if (isSyncing) {
                        return;
                      }
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        void toggleFinalStudySelection(item.study.studyId);
                      }
                    }}
                    className={`p-4 bg-card rounded-lg relative w-full max-w-full overflow-hidden transition-all duration-200 border flex items-center gap-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${isSyncing ? "cursor-wait opacity-70" : "cursor-pointer"} ${rowClass}`}
                  >
                    {isLoading ? (
                      <div className="flex flex-col gap-3 flex-1 min-w-0">
                        <Skeleton className="h-5 w-48" />
                        <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                          <Skeleton className="h-4 w-28" />
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-4 w-64" />
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex flex-col gap-3 flex-1 min-w-0">
                          <div className="flex items-start gap-3">
                            <div className="flex-1 min-w-0">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <h4 className="text-base font-semibold truncate max-w-full">
                                    {item.study.shortName}
                                  </h4>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{item.study.shortName}</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 shrink-0"
                                  aria-label={`Open details for ${item.study.shortName}`}
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    openWithStudyId(item.study.studyId);
                                  }}
                                >
                                  <Info className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Open study details</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>

                          <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs w-full">
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <div className="p-0.5">
                                <Users className="h-3 w-3" />
                              </div>
                              <span>{formatParticipantCount(item.study.numberParticipants)} participants</span>
                            </div>

                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <div className="p-0.5 rounded">
                                <Calendar className={`h-3 w-3 ${item.study.duration ? "" : "text-muted-foreground/50"}`} />
                              </div>
                              <span className={item.study.duration ? "" : "text-muted-foreground/50"}>
                                {item.study.duration || "No duration"}
                              </span>
                            </div>

                            {item.study.comparison && (
                              <div className="flex items-center gap-1.5 text-muted-foreground flex-1 min-w-0 basis-0 max-w-full overflow-hidden">
                                <div className="p-0.5 rounded">
                                  <Scale className="h-3 w-3" />
                                </div>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="truncate block w-full max-w-full">
                                      {item.study.comparison}
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent className="max-w-xs">
                                    <p>{item.study.comparison}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                            )}
                          </div>

                          <div className="border-t border-border/60 pt-2">
                            {item.isUnanimous ? (
                              <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                                <CircleCheckBig className="h-3.5 w-3.5" />
                                <span>Consensus (all annotators selected this study)</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 text-xs font-medium text-amber-700">
                                <CircleAlert className="h-3.5 w-3.5" />
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="cursor-help">
                                      No consensus ({item.selectedBy.length} of {groupedByUser.length} annotators selected this study)
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent className="max-w-xs">
                                    <p>Selected by: {item.selectedBy.join(", ")}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                            )}
                          </div>
                        </div>

                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
