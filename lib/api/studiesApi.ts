import { StudyDto , ReportDto, InterventionDto, ConditionDto, OutcomeDto , GetPersonsResponseDto } from "../../types/apiDTOs";
import { serializeParams } from "./helpers";
import apiClient from "./apiClient";
import { report } from "process";

export const getStudies = (study_ids: number[]): Promise<StudyDto[]> => {
  const path = '/studies';

  const config = {
    params: {
      study_ids: study_ids,
    },
    paramsSerializer: {
      serialize: serializeParams,
    },
  };
  return apiClient.get<StudyDto[]>(path, config)
    .then(response => {
      return response.data;
    })
    .catch(error => {
      console.error('Error fetching studies:', error);
      throw error;
    });
}

//getStudybyID not really needed since getStudies can take multiple IDs or a single ID

export const getReportsByStudyId = (study_id: number,include_pdf_links?: boolean): Promise<ReportDto[]> => {
  const path = `/studies/${study_id}/reports`;

  const config = {
    params: {
      include_pdf_links: include_pdf_links,
    },
    paramsSerializer: {
      serialize: serializeParams,
    },
  };
  return apiClient.get<ReportDto[]>(path, config)
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


export const getInterventionsForStudy = (study_id: number): Promise<InterventionDto[]> => {
  const path = `/studies/${study_id}/interventions`;
  return apiClient.get<InterventionDto[]>(path)
    .then(response => {
      return response.data;
    })
    .catch(error => {
      console.error(`Error fetching interventions for study ${study_id}:`, error);
      throw error;
    });
}

export const getConditionsForStudy = (study_id: number): Promise<ConditionDto[]> => {
    const path = `/studies/${study_id}/conditions`;
    return apiClient.get<ConditionDto[]>(path)
      .then(response => {
        return response.data;
      })
      .catch(error => {
        console.error(`Error fetching conditions for study ${study_id}:`, error);
        throw error;
      });
}

export const getOutcomesForStudy = (study_id: number): Promise<OutcomeDto[]> => {
    const path = `/studies/${study_id}/outcomes`;
    return apiClient.get<OutcomeDto[]>(path)
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

export const getDesignForStudy = (study_id: number): Promise<string[]> => {
    const path = `/studies/${study_id}/design`;
    return apiClient.get<string[]>(path)
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

export const getReportPdf = (report_id: number): Promise<Blob> => {
  const path = `/reports/${report_id}/pdf`;
  return apiClient.get<Blob>(path, { responseType: 'blob' })
    .then(response => {
      // Check if response is actually an error blob (e.g., JSON error message)
      if (response.headers['content-type']?.includes('application/json')) {
        return response.data.text().then((text: string) => {
          const error = JSON.parse(text);
          throw new Error(error.detail || 'Unknown error');
        });
      }
      return response.data;
    })
    .catch(error => {
      console.error(`Error fetching PDF for report ${report_id}:`, error.message || error);
      throw error;
    });
}

