import apiClient from "./apiClient";
import { AxiosRequestConfig } from "axios";
import { SimilarTagDto, SimilarStudyResponseDto, GetSimilarStudiesParams, GetSimilarTagsParams, StudyDto} from "../../types/apiDTOs";
import {serializeParams} from "./helpers";    

export const getSimilarStudiesByReport = (
  reportId: number,
  params: GetSimilarStudiesParams = {},
  config?: AxiosRequestConfig
): Promise<SimilarStudyResponseDto[]> => { 
  const path = `/reports/${reportId}/similar_studies`;
  const { params: configParams, ...restConfig } = config ?? {};
  const requestParams = {
    ...(configParams ?? {}),
    ...params,
  };
  return apiClient.get<SimilarStudyResponseDto[]>(path, {
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
    console.log("Study");
    console.log(study);
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
  const path = `/reports/${reportId}/similar_studies/tags`;
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

//Endpoint to get studies related to a specific tag always gives server error 500 so not implemented yet
