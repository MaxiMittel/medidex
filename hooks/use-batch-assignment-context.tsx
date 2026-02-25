"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";

interface BatchAssignmentContextValue {
  batchHash?: string;
  assignedStudiesByReport: Record<number, number[]>;
  updateAssignedStudies: (reportId: number, studyIds: number[]) => void;
}

const equals = (a?: number[], b?: number[]) => {
  if (a === b) return true;
  if (!a || !b) return false;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) {
      return false;
    }
  }
  return true;
};

const BatchAssignmentContext = createContext<BatchAssignmentContextValue | null>(null);

export function BatchAssignmentProvider({
  batchHash,
  children,
}: {
  batchHash?: string;
  children: ReactNode;
}) {
  const [assignedStudiesByReport, setAssignedStudies] = useState<Record<number, number[]>>({});

  const updateAssignedStudies = useCallback(
    (reportId: number, studyIds: number[]) => {
      setAssignedStudies((prev) => {
        const existing = prev[reportId];
        if (equals(existing, studyIds)) {
          return prev;
        }
        return { ...prev, [reportId]: studyIds };
      });
    },
    []
  );

  const value = useMemo(
    () => ({ batchHash, assignedStudiesByReport, updateAssignedStudies }),
    [assignedStudiesByReport, batchHash, updateAssignedStudies]
  );

  return (
    <BatchAssignmentContext.Provider value={value}>
      {children}
    </BatchAssignmentContext.Provider>
  );
}

export function useBatchAssignmentContext() {
  return useContext(BatchAssignmentContext);
}
