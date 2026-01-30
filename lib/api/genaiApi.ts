import axios from "axios";
import type { EvaluateRequest, EvaluateResponse } from "@/types/apiDTOs";

const GENAI_BASE_URL = process.env.NEXT_PUBLIC_GENAI_API_URL;

const genaiClient = axios.create({
  baseURL: GENAI_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

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
