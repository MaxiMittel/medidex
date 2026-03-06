import apiClient from "./apiClient";
import { AxiosRequestConfig } from "axios";
import { ReportSourcesDto, SimilarTagDto, SimilarStudyDto, GetSimilarStudiesParams, GetSimilarTagsParams, StudyDto} from "../../types/apiDTOs";
import {serializeParams} from "./helpers";    

export const getSimilarStudiesByReportId = (
  reportId: number,
  params: GetSimilarStudiesParams = {},
  config?: AxiosRequestConfig
): Promise<SimilarStudyDto[]> => { 
  const path = `/reports/${reportId}/similar-studies`;
  const { params: configParams, ...restConfig } = config ?? {};
  const requestParams = {
    ...(configParams ?? {}),
    ...params,
  };
  return apiClient.get<SimilarStudyDto[]>(path, {
      ...restConfig,
      params: requestParams,
      paramsSerializer: { serialize: serializeParams }
    })
    .then(response => {
    return response.data;
    })
    .catch(error => {
    console.error(`Error fetching similar studies for report ${reportId}:`, error);
    throw error;
    });
}

//assign studies to a report
export const assignStudyToReportByReportId = (
  reportId: number,
  studyId: number,
  config?: AxiosRequestConfig
): Promise<void> => {
  const path = `/reports/${reportId}/studies/${studyId}`;
  const requestConfig = {
    ...config,
    paramsSerializer: { serialize: serializeParams } 
  };
  return apiClient.put(path, null, requestConfig).then(response => response.data);
}

//remove studies from a report
export const removeStudyFromReportByReportId = (
  reportId: number,
  studyId: number,
  config?: AxiosRequestConfig
): Promise<void> => {
  const path = `/reports/${reportId}/studies/${studyId}`;
  return apiClient
    .delete(path, config)
    .then(response => {
      return;
    })
    .catch(error => {
      console.error(`Error removing studies from report ${reportId}:`, error);
      throw error;
    });
}

//create and assign a brand-new study to a report
export const assignNewStudyToReportByReportId = (
  reportId: number,
  study: StudyDto,
  config?: AxiosRequestConfig
): Promise<void> => {
  const path = `/reports/${reportId}/studies`;
  return apiClient
    .post(path, study, config)
    .then(response => {
      return response.data;
    })
    .catch(error => {
      console.error(`Error assigning new study to report ${reportId}:`, error);
      throw error;
    });
}

//remove studies from a report
export const getSimilarTagsByReportId = (
  reportId: number,
  params: GetSimilarTagsParams = {},
  config?: AxiosRequestConfig
): Promise<SimilarTagDto[]> => {
  const path = `/reports/${reportId}/similar-studies/tags`;
  const { params: configParams, ...restConfig } = config ?? {};
  const requestParams = {
    ...(configParams ?? {}),
    ...params,
  };
  return apiClient.get<SimilarTagDto[]>(path, {
      ...restConfig,
      params: requestParams,
      paramsSerializer: { serialize: serializeParams }
    })
    .then(response => {
      return response.data;
    })
    .catch(error => {
      console.error(`Error fetching similar studies for report ${reportId}:`, error);
      throw error;
    });
}

export const getStudiesByReportId = (
  reportId: number,
  params?: { date_from?: string | null; date_to?: string | null },
  config?: AxiosRequestConfig
): Promise<StudyDto[]> => {
  const path = `/reports/${reportId}/studies`;

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
        `Error fetching studies for report ${reportId}:`,
        error.message || error
      );
      throw error;
    });
};

export const getReportPdf = (
  reportId: number,
  config?: AxiosRequestConfig
): Promise<ArrayBuffer> => {
  const path = `/reports/${reportId}/pdf`;
  return apiClient.get<ArrayBuffer>(path, { responseType: 'arraybuffer', ...config })
    .then(response => {
      return response.data;
    })  
    .catch(error => {
      console.error(`Error fetching PDF for report ${reportId}:`, error.message || error);
      throw error;
    });
}

export const getReportSources = (
  reportId: number,
  config?: AxiosRequestConfig
): Promise<ReportSourcesDto> => {
  const path = `/reports/${reportId}/sources`;
  return apiClient.get<ReportSourcesDto>(path, config)
    .then(response => {
      return response.data;
    })
    .catch(error => {
      console.error(`Error fetching links for report ${reportId}:`, error.message || error);
      throw error;
    });
}