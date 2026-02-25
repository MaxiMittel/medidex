import { ReportDetailDto } from "@/types/apiDTOs"
import {create} from "zustand"

type ReportState = {
    reports: Record<number, ReportDetailDto>
    setReports: (reports: ReportDetailDto[]) => void
    getReport: (reportId: number) => ReportDetailDto
    updateAssignedStudies: (reportId: number, assignedStudies: number[]) => void
}

export const useReportStore = create<ReportState>((set, get) => ({
    reports: {},

    setReports: (reports) => set({
        reports: Object.fromEntries(
            reports.map((r) => [r.report.reportId, r]),
        ),
    }),

    getReport: (reportId) => {
        const report = get().reports[reportId]
        if (!report) {
            throw new Error(`Report ${reportId} not available`)
        }
        return report
    },

    updateAssignedStudies: (reportId, assignedStudies) =>
        set((state) => ({
            reports: {
                ...state.reports,
                [reportId]: {
                    ...state.reports[reportId],
                    assignedStudies,
                },
            },
        })),
}))