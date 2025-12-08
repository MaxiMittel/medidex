import { StudyDto , ReportDto, InterventionDto, ConditionDto, OutcomeDto , GetPersonsResponseDto } from "../../types/apiDTOs";
import { serializeParams } from "./helpers";
import apiClient from "./apiClient";
import { AxiosRequestConfig } from "axios";

export interface CreateStudyPayload {
  short_name: string;
  status_of_study: string;
  countries: string[];
  central_submission_status: string;
  duration: string;
  number_of_participants: number;
  comparison: string;
}

export const getStudies = (
  study_ids: number[],
  config?: AxiosRequestConfig
): Promise<StudyDto[]> => {
  const path = '/studies';

  const requestConfig = {
    ...config,
    params: {
      study_ids: study_ids,
    },
    paramsSerializer: {
      serialize: serializeParams,
    },
  };
  return apiClient.get<StudyDto[]>(path, requestConfig)
    .then(response => {
      return response.data;
    })
    .catch(error => {
      console.error('Error fetching studies:', error);
      throw error;
    });
}

//getStudybyID not really needed since getStudies can take multiple IDs or a single ID

export const getReportsByStudyId = (
  study_id: number,
  include_pdf_links?: boolean,
  config?: AxiosRequestConfig
): Promise<ReportDto[]> => {
  const path = `/studies/${study_id}/reports`;

  const requestConfig = {
    ...config,
    params: {
      include_pdf_links: include_pdf_links,
    },
    paramsSerializer: {
      serialize: serializeParams,
    },
  };
  return apiClient.get<ReportDto[]>(path, requestConfig)
    .then(response => {
      return response.data;
    })
    .catch(error => {
      console.error(`Error fetching reports for study ${study_id}:`, error);
      throw error;
    });
}

//get studyID by trialID not implemented because it's confusing and not needed yet

//getDateStudyEntered not implemented because it can be taken from StudyDto


export const getInterventionsForStudy = (
  study_id: number,
  config?: AxiosRequestConfig
): Promise<InterventionDto[]> => {
  const path = `/studies/${study_id}/interventions`;
  return apiClient.get<InterventionDto[]>(path, config)
    .then(response => {
      return response.data;
    })
    .catch(error => {
      console.error(`Error fetching interventions for study ${study_id}:`, error);
      throw error;
    });
}

export const getConditionsForStudy = (
  study_id: number,
  config?: AxiosRequestConfig
): Promise<ConditionDto[]> => {
    const path = `/studies/${study_id}/conditions`;
    return apiClient.get<ConditionDto[]>(path, config)
      .then(response => {
        return response.data;
      })
      .catch(error => {
        console.error(`Error fetching conditions for study ${study_id}:`, error);
        throw error;
      });
}

export const getOutcomesForStudy = (
  study_id: number,
  config?: AxiosRequestConfig
): Promise<OutcomeDto[]> => {
    const path = `/studies/${study_id}/outcomes`;
    return apiClient.get<OutcomeDto[]>(path, config)
      .then(response => {
        return response.data;
      })
      .catch(error => {
        console.error(`Error fetching outcomes for study ${study_id}:`, error);
        throw error;
      });
}

//get participants description for a study
export const getParticipantsForStudy = (study_id: number): Promise<string[]> => {
    const path = `/studies/${study_id}/participants`;
    return apiClient.get<string[]>(path)
      .then(response => {
        return response.data;
      })
      .catch(error => {
        console.error(`Error fetching participants description for study ${study_id}:`, error);
        throw error;
      });
}

export const getDesignForStudy = (
  study_id: number,
  config?: AxiosRequestConfig
): Promise<string[]> => {
    const path = `/studies/${study_id}/design`;
    return apiClient.get<string[]>(path, config)
      .then(response => {
        return response.data;
      })
      .catch(error => {
        console.error(`Error fetching design for study ${study_id}:`, error);
        throw error;
      });
}

export const getPersonsForStudy = (study_id: number): Promise<string[]> => {  
  const path = `/studies/${study_id}/persons`;
  return apiClient.get<GetPersonsResponseDto>(path)
    .then(response => {
      return response.data[study_id] || [];
    })
    .catch(error => {
      console.error(`Error fetching persons for study ${study_id}:`, error);
      throw error;
    });
};

export const getReportPdf = (
  report_id: number,
  config?: AxiosRequestConfig
): Promise<ArrayBuffer> => {
  const path = `/reports/${report_id}/pdf`;
  return apiClient.get<ArrayBuffer>(path, { responseType: 'arraybuffer', ...config })
    .then(response => {
      return response.data;
    })
    .catch(error => {
      console.error(`Error fetching PDF for report ${report_id}:`, error.message || error);
      throw error;
    });
}

export const getStudiesForReport = (
  report_id: number,
  params?: { date_from?: string | null; date_to?: string | null },
  config?: AxiosRequestConfig
): Promise<StudyDto[]> => {
  const path = `/reports/${report_id}/studies`;

  const requestConfig: AxiosRequestConfig = {
    ...config,
    params: params,
    paramsSerializer: { serialize: serializeParams },
  };

  return apiClient
    .get<StudyDto[]>(path, requestConfig)
    .then((response) => response.data)
    .catch((error) => {
      console.error(
        `Error fetching studies for report ${report_id}:`,
        error.message || error
      );
      throw error;
    });
};

export const createStudy = (
  payload: CreateStudyPayload,
  config?: AxiosRequestConfig
): Promise<StudyDto> => {
  return apiClient
    .put<StudyDto>("/studies", payload, config)
    .then((response) => response.data)
    .catch((error) => {
      console.error("Error creating study:", error);
      if (error.response?.data?.detail) {
        const detail = error.response.data.detail;
        const message =
          typeof detail === "string" ? detail : JSON.stringify(detail);
        throw new Error(message);
      }
      throw error;
    });
};
