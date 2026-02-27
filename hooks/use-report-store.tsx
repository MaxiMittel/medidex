import { ReportDetailDto } from "@/types/apiDTOs"
import {create} from "zustand"

const getReportStudyPath = (reportId: number, studyId: number) =>
    `/api/meerkat/reports/${reportId}/studies/${studyId}`

const ensureSuccess = async (response: Response, action: string) => {
    if (response.ok) {
        return
    }

    let detail = `${action} failed with status ${response.status}`
    try {
        const payload = await response.json()
        if (payload?.error) {
            detail = payload.error
        }
    } catch (error) {
        console.error("Failed to parse error payload", error)
    }

    throw new Error(detail)
}

const assignStudyViaApi = async (reportId: number, studyId: number) => {
    const response = await fetch(getReportStudyPath(reportId, studyId), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
    })
    await ensureSuccess(response, "Assigning study to report")
}

const removeStudyViaApi = async (reportId: number, studyId: number) => {
    const response = await fetch(getReportStudyPath(reportId, studyId), {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
    })
    await ensureSuccess(response, "Removing study from report")
}

type ReportState = {
    reports: Record<number, ReportDetailDto>
    setReports: (reports: ReportDetailDto[]) => void
    getReport: (reportId: number) => ReportDetailDto
    addAssignedStudy: (reportId: number, studyId: number) => Promise<void>
    removeAssignedStudy: (reportId: number, studyId: number) => Promise<void>
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

    addAssignedStudy: async (reportId, studyId) => {
        const report = get().reports[reportId]
        if (!report) {
            throw new Error(`Report ${reportId} not available`)
        }
        const currentStudies = report.assignedStudies ?? []
        if (currentStudies.includes(studyId)) {
            return
        }
        await assignStudyViaApi(reportId, studyId)
        set((state) => {
            const updatedReport = state.reports[reportId]
            if (!updatedReport) {
                return state
            }
            const nextStudies = updatedReport.assignedStudies ?? []
            return {
                reports: {
                    ...state.reports,
                    [reportId]: {
                        ...updatedReport,
                        assignedStudies: [...nextStudies, studyId],
                    },
                },
            }
        })
    },

    removeAssignedStudy: async (reportId, studyId) => {
        const report = get().reports[reportId]
        if (!report) {
            throw new Error(`Report ${reportId} not available`)
        }
        const currentStudies = report.assignedStudies ?? []
        if (!currentStudies.includes(studyId)) {
            return
        }
        await removeStudyViaApi(reportId, studyId)
        set((state) => {
            const updatedReport = state.reports[reportId]
            if (!updatedReport) {
                return state
            }
            return {
                reports: {
                    ...state.reports,
                    [reportId]: {
                        ...updatedReport,
                        assignedStudies: (updatedReport.assignedStudies ?? []).filter(
                            (id) => id !== studyId,
                        ),
                    },
                },
            }
        })
    },
}))