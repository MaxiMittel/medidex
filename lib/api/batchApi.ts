import apiClient from "./apiClient";
import {BatchDto, ReportDetailDto, SimilarTagDto, GetSimilarTagsParams, GetSimilarStudiesParams, SimilarStudiesResponseDto} from "../../types/apiDTOs";
import {serializeParams} from "./helpers";    

//get all batches
export const getBatches = (): Promise<BatchDto[]> => {
    return apiClient.get<BatchDto[]>("/batches").then(response => {
        return response.data;
    }).catch(error => {
        console.error("Error fetching batches:", error);
        throw error;
    });
}

//upload a new batch
export const uploadBatch = (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file, file.name);
    return apiClient.post<string>("/batches", formData)
        .then(response => {
            return response.data;
        })
        .catch(error => {
            console.error("Error uploading batch:", error);
            throw error;
        });
}

//get a batch by its hash
export const getBatchByHash = (batch_hash: string): Promise<BatchDto> => {
    return apiClient.get<BatchDto>(`/batches/${batch_hash}`).then(response => {
        return response.data;
    }).catch(error => {
        console.error(`Error fetching batch with hash ${batch_hash}:`, error);
        throw error;
    });
}

//delete a batch by its hash
export const deleteBatchByHash = (batch_hash: string): Promise<void> => {
    return apiClient.delete<void>(`/batches/${batch_hash}`).then(response => {
        return;
    }).catch(error => {
        console.error(`Error deleting batch with hash ${batch_hash}:`, error);
        throw error;
    });
}

//stream batch information
//this one is likely wrong, needs to be fixed return type is probably not string
export const streamBatchInfo = (batch_hash: string): Promise<string> => {
    return apiClient.get<string>(`/batches/${batch_hash}/subscribe`).then(response => {
        return response.data;
    }).catch(error => {
        console.error(`Error streaming batch info for hash ${batch_hash}:`, error);
        throw error;
    });
}

//get report details by batch hash and report index
export const getReportData = (batch_hash: string, report_index: number): Promise<ReportDetailDto> => {
    return apiClient.get<ReportDetailDto>(`/batches/${batch_hash}/${report_index}`).then(response => {
        return response.data;
    }).catch(error => {
        console.error(`Error fetching report data for batch ${batch_hash}, report ${report_index}:`, error);
        throw error;
    });
}

//assign studies to a report
export const assignStudiesToReport = (
  batch_hash: string,
  report_index: number,
  study_ids: number[]
): Promise<void> => {
  const path = `/batches/${batch_hash}/${report_index}/studies`;
  const config = {
    params: { study_ids: study_ids },
    paramsSerializer: { serialize: serializeParams } 
  };
  return apiClient.put(path, null, config).then(response => response.data);
}

//remove studies from a report
export const removeStudiesFromReport = (batch_hash: string, report_index: number): Promise<void> => {
    const path = `/batches/${batch_hash}/${report_index}/studies`;
    return apiClient.delete(path)
        .then(response => {
            return;
        })
        .catch(error => {
            console.error(`Error removing studies from report ${report_index}:`, error);
            throw error;
        });
}

//get similar tags for a report
//will get a 500 server error if you test it because the endpoint is broken on the server side
export const getSimilarTags = (
  batch_hash: string,
  report_index: number,
  params: GetSimilarTagsParams
): Promise<SimilarTagDto[]> => {
  const path = `/batches/${batch_hash}/${report_index}/similar_tags`;
  return apiClient.get<SimilarTagDto[]>(path, {
    params: params,
    paramsSerializer: { serialize: serializeParams }, 
  }).then(response => response.data);
}


//endpoint to get similar studies for a report
//api endpoint gives data in a weirdly columnar format so might have to be converted to array of objects later
export const getSimilarStudies = (
  batch_hash: string,
  report_index: number,
  params: GetSimilarStudiesParams = {}
): Promise<SimilarStudiesResponseDto> => { 
  const path = `/batches/${batch_hash}/${report_index}/similar_studies`;
  return apiClient.get<SimilarStudiesResponseDto>(path, {
    params: params,
    paramsSerializer: { serialize: serializeParams }
  })
    .then(response => {
      return response.data;
    })
    .catch(error => {
      console.error(`Error fetching similar studies for report ${report_index}:`, error);
      throw error;
    });
}


//Endpoint to get studies related to a specific tag always gives server error 500 so not implemented yet