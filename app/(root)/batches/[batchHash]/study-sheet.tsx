"use client";

import { StudyDetails } from "@/components/ui/study-view/study-details";
import { useDetailsSheet } from "@/app/context/details-sheet-context";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";

function StudyDetailsSkeleton() {
    const statPlaceholders = Array.from({ length: 4 });
    const sectionPlaceholders = Array.from({ length: 3 });

    return (
        <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto pb-8">
            <SheetHeader className="border-b border-border/60">
                <SheetTitle>
                    <Skeleton className="h-6 w-40" />
                </SheetTitle>
            </SheetHeader>

            <div className="mt-6 space-y-6 px-4">
                <div className="space-y-3">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {statPlaceholders.map((_, index) => (
                        <div key={index} className="space-y-2 border border-border/60 rounded-md p-3">
                            <Skeleton className="h-4 w-1/2" />
                            <Skeleton className="h-3 w-2/3" />
                            <Skeleton className="h-3 w-1/3" />
                        </div>
                    ))}
                </div>

                <div className="space-y-3">
                    <Skeleton className="h-5 w-36" />
                    {sectionPlaceholders.map((_, index) => (
                        <div key={index} className="space-y-2 border border-border/60 rounded-md p-3">
                            <Skeleton className="h-4 w-2/3" />
                            <Skeleton className="h-3 w-full" />
                            <Skeleton className="h-3 w-11/12" />
                        </div>
                    ))}
                </div>
            </div>
        </SheetContent>
    );
}
export default function StudySheet() {

    const {isOpen, study, loading, close} = useDetailsSheet()

    return (
        <Sheet
            open={isOpen}
            onOpenChange={(open) => {
                if (!open){
                    close();
                }
            }}
        >
            <StudyDetails study={study} />
        </Sheet>
    );
}