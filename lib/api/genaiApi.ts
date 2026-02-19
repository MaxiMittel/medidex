import axios from "axios";
import type { DefaultPrompts, EvaluateRequest, EvaluateResponse } from "@/types/apiDTOs";

const genaiClient = axios.create({
  baseURL: "/api/genai",
  headers: { "Content-Type": "application/json" },
});

let cachedDefaultPrompts: DefaultPrompts | null = null;
let defaultPromptsPromise: Promise<DefaultPrompts> | null = null;

/**
 * Evaluates a report against a list of studies using AI to find matches.
 * 
 * @param request - Contains the report, studies to evaluate, and optional AI settings
 * @returns Evaluation response with matched, likely matches, unsure, and not matched studies
 */
export const evaluateStudies = async (
  request: EvaluateRequest
): Promise<EvaluateResponse> => {
  try {
    const response = await genaiClient.post<EvaluateResponse>("/evaluate", request);
    return response.data;
  } catch (error) {
    console.error("Error evaluating studies:", error);
    if (axios.isAxiosError(error) && error.response?.data?.detail) {
      const errorMessage = typeof error.response.data.detail === 'string' 
        ? error.response.data.detail 
        : JSON.stringify(error.response.data.detail);
      throw new Error(errorMessage);
    }
    throw error;
  }
};

export const fetchDefaultPrompts = async (): Promise<DefaultPrompts> => {
  if (cachedDefaultPrompts) {
    return cachedDefaultPrompts;
  }
  if (defaultPromptsPromise) {
    return defaultPromptsPromise;
  }

  defaultPromptsPromise = (async () => {
    const response = await genaiClient.get<DefaultPrompts>("/prompts");
    return response.data;
  })();

  try {
    const data = await defaultPromptsPromise;
    cachedDefaultPrompts = data;
    defaultPromptsPromise = null;
    return data;
  } catch (error) {
    console.error("Error fetching default prompts:", error);
    defaultPromptsPromise = null;
    if (axios.isAxiosError(error) && error.response?.data?.detail) {
      const errorMessage =
        typeof error.response.data.detail === "string"
          ? error.response.data.detail
          : JSON.stringify(error.response.data.detail);
      throw new Error(errorMessage);
    }
    throw error;
  }
};
