import type {
  EvaluateRequest,
  StreamEvent,
  StreamCallbacks,
} from "@/types/apiDTOs";

const GENAI_BASE_URL = process.env.NEXT_PUBLIC_GENAI_API_URL;

export const evaluateStudiesStream = (
  request: EvaluateRequest,
  callbacks: StreamCallbacks
): (() => void) => {
  const { onEvent, onComplete, onError } = callbacks;
  const abortController = new AbortController();

  const startStream = async () => {
    try {
      const response = await fetch(`${GENAI_BASE_URL}/evaluate/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
        signal: abortController.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Stream request failed: ${response.status} ${response.statusText}. ${errorText}`
        );
      }

      if (!response.body) {
        throw new Error("Response body is null");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6).trim();

            if (!data) continue;

            try {
              const parsed = JSON.parse(data);

              if (parsed.event === "complete") {
                onComplete();
                return;
              }

              const streamEvent: StreamEvent = {
                event: parsed.event || "unknown",
                node: parsed.node,
                message: parsed.message,
                details: parsed.details,
                timestamp: Date.now(),
              };

              onEvent(streamEvent);
            } catch (parseError) {
              console.error("Failed to parse SSE data:", data, parseError);
            }
          }
        }
      }

      onComplete();
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }

      console.error("Stream error:", error);
      onError(
        error instanceof Error
          ? error
          : new Error("Unknown stream error occurred")
      );
    }
  };

  startStream();

  return () => {
    abortController.abort();
  };
};
