"use client";

import { type ReactNode } from "react";
import { PanelGroup, Panel, PanelResizeHandle } from "react-resizable-panels";
import ReportList from "./components/report-list";
import { DetailsSheetProvider } from "@/app/context/details-sheet-context";
import StudySheet from "./study-sheet";

interface ReportColumnProps {
    children: ReactNode;
}

export default function ReportColumn({ children }: ReportColumnProps) {

    return (
        <DetailsSheetProvider>
            <PanelGroup direction="horizontal" className="h-full">
                <Panel defaultSize={55} minSize={25} className="border-r bg-background min-w-0">
                    <ReportList/>
                </Panel>

                <PanelResizeHandle className="w-1 bg-border hover:bg-primary transition-colors cursor-col-resize" />

                <Panel defaultSize={45} minSize={35} className="min-w-0">
                    {children}
                </Panel>
            </PanelGroup>
            <StudySheet></StudySheet>

        </DetailsSheetProvider>
    );
}