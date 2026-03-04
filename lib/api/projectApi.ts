import apiClient from "./apiClient";
import { AxiosRequestConfig } from "axios";
import {ProjectDto, ReportDetailDto, SimilarTagDto, GetSimilarTagsParams, GetSimilarStudiesParams, SimilarStudyResponseDto} from "../../types/apiDTOs";
import {serializeParams} from "./helpers";    

//get all projects
export const getProjects = (config?: AxiosRequestConfig): Promise<ProjectDto[]> => {
  return apiClient
    .get<ProjectDto[]>("/projects", config)
    .then(response => {
      return response.data;
    })
    .catch(error => {
      console.error("Error fetching project:", error);
      throw error;
    });
}

//create a new project by uploading a .ris file
export const createProject = (
  file: File,
  config?: AxiosRequestConfig
): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file, file.name);
  
  // The apiClient has a request interceptor that automatically removes Content-Type
  // when FormData is detected, allowing axios to set it with the correct boundary.
  return apiClient.post<string>("/projects", formData, config)
      .then(response => {
          return response.data;
      })
      .catch(error => {
          console.error("Error uploading project:", error);
          // Extract error message from API response
          if (error.response?.data?.detail) {
              const errorMessage = typeof error.response.data.detail === 'string' 
                  ? error.response.data.detail 
                  : JSON.stringify(error.response.data.detail);
              throw new Error(errorMessage);
          }
          throw error;
      });
}

//get a project by its id
export const getProjectById = (projectId: string): Promise<ProjectDto> => {
    return apiClient.get<ProjectDto>(`/projects/${projectId}`).then(response => {
        return response.data;
    }).catch(error => {
        console.error(`Error fetching project with id ${projectId}:`, error);
        throw error;
    });
}

//delete a project by its id
export const deleteProjectById = (
  projectId: string,
  config?: AxiosRequestConfig
): Promise<void> => {
  return apiClient
    .delete<void>(`/projects/${projectId}`, config)
    .then(() => {
      return;
    })
    .catch(error => {
      console.error(`Error deleting project with id ${projectId}:`, error);
      throw error;
    });
}

//stream project information
//this one is likely wrong, needs to be fixed return type is probably not string
export const streamProjectInfo = (projectId: string): Promise<string> => {
    return apiClient.get<string>(`/projects/${projectId}/subscribe`).then(response => {
        return response.data;
    }).catch(error => {
        console.error(`Error streaming project info for id ${projectId}:`, error);
        throw error;
    });
}

//get report details by project id and report index
export const getReportData = (
  projectId: string,
  reportIndex: number,
  config?: AxiosRequestConfig
): Promise<ReportDetailDto> => {
  return apiClient
    .get<ReportDetailDto>(`/projects/${projectId}/${reportIndex}`, config)
    .then(response => {
      return response.data;
    })
    .catch(error => {
      console.error(
        `Error fetching report data for project ${projectId}, report ${reportIndex}:`,
        error
      );
      throw error;
    });
}

//get all report details for a project
export const getProjectReports = (
  projectId: string,
  config?: AxiosRequestConfig
): Promise<ReportDetailDto[]> => {
  return apiClient
    .get<ReportDetailDto[]>(`/projects/${projectId}/reports`, config)
    .then(response => {
      return response.data;
    })
    .catch(error => {
      console.error(`Error fetching reports for project ${projectId}:`, error);
      throw error;
    });
}

//assign studies to a report
export const assignStudiesToReport = (
  projectId: string,
  reportIndex: number,
  studyIds: number[],
  config?: AxiosRequestConfig
): Promise<void> => {
  const path = `/projects/${projectId}/${reportIndex}/studies`;
  const requestConfig = {
    ...config,
    params: { study_ids: studyIds },
    paramsSerializer: { serialize: serializeParams } 
  };
  return apiClient.put(path, null, requestConfig).then(response => response.data);
}

//remove studies from a report
export const removeStudiesFromReport = (
  projectId: string,
  reportIndex: number,
  config?: AxiosRequestConfig
): Promise<void> => {
  const path = `/projects/${projectId}/${reportIndex}/studies`;
  return apiClient
    .delete(path, config)
    .then(response => {
      return;
    })
    .catch(error => {
      console.error(`Error removing studies from report ${reportIndex}:`, error);
      throw error;
    });
}

//get similar tags for a report
//will get a 500 server error if you test it because the endpoint is broken on the server side
export const getSimilarTags = (
  projectId: string,
  reportIndex: number,
  params: GetSimilarTagsParams
): Promise<SimilarTagDto[]> => {
  const path = `/projects/${projectId}/${reportIndex}/similar-tags`;
  return apiClient.get<SimilarTagDto[]>(path, {
    params: params,
    paramsSerializer: { serialize: serializeParams }, 
  }).then(response => response.data);
}


//endpoint to get similar studies for a report
//api endpoint gives data in a weirdly columnar format so might have to be converted to array of objects later
export const getSimilarStudies = (
  projectId: string,
  reportIndex: number,
  params: GetSimilarStudiesParams = {},
  config?: AxiosRequestConfig
): Promise<SimilarStudyResponseDto[]> => { 
  const path = `/projects/${projectId}/${reportIndex}/similar-studies`;
  return apiClient.get<SimilarStudyResponseDto[]>(path, {
      ...config,
      params: params,
      paramsSerializer: { serialize: serializeParams }
    })
    .then(response => {
      return response.data;
    })
    .catch(error => {
      console.error(`Error fetching similar studies for report ${reportIndex}:`, error);
      throw error;
    });
}

//Endpoint to get studies related to a specific tag always gives server error 500 so not implemented yet
