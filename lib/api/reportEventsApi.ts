export type ReportEventType = "start" | "end";

export interface ReportEventPayload {
  timestamp: string;
  type: ReportEventType;
  last_interaction: string | null;
}

/**
 * Sends a report event to track user interaction timing.
 * 
 * @param crgReportId - The CRG Report ID
 * @param type - Either "start" (when opening a report) or "end" (when assigning a study)
 * @param lastInteraction - Timestamp of last user interaction (or null if no interaction tracking)
 */
export async function sendReportEvent(
  crgReportId: number,
  type: ReportEventType,
  lastInteraction: string | null = null
): Promise<void> {
  const payload: ReportEventPayload = {
    timestamp: new Date().toISOString(),
    type,
    last_interaction: lastInteraction,
  };

  try {
    const response = await fetch(`/api/meerkat/reports/${crgReportId}/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error(`Failed to send ${type} event for report ${crgReportId}`);
    }
  } catch (error) {
    // Log but don't throw - event tracking should not break the main flow
    console.error(`Error sending ${type} event for report ${crgReportId}:`, error);
  }
}
