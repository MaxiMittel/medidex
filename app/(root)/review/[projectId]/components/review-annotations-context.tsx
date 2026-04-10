"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { ProjectAnnotationsDto } from "@/types/apiDTOs";

const ReviewAnnotationsContext = createContext<ProjectAnnotationsDto>({});

interface ReviewAnnotationsProviderProps {
  annotations: ProjectAnnotationsDto;
  children: ReactNode;
}

export function ReviewAnnotationsProvider({
  annotations,
  children,
}: ReviewAnnotationsProviderProps) {
  return (
    <ReviewAnnotationsContext.Provider value={annotations}>
      {children}
    </ReviewAnnotationsContext.Provider>
  );
}

export function useReviewAnnotations(): ProjectAnnotationsDto {
  return useContext(ReviewAnnotationsContext);
}
