export interface InitializationStatus {
  status: 'not_started' | 'in_progress' | 'completed' | 'failed';
  progress: number;
  message: string;
  started_at: number | null;
  completed_at: number | null;
  duration_ms?: number;
  duration_minutes?: number;
  error?: string;
  steps?: InitializationStep[];
}

export interface InitializationStep {
  timestamp: number;
  progress: number;
  message: string;
}

export interface InitializationStartResponse {
  message: string;
  status: string;
  progress: number;
  started_at: number;
  estimated_duration: string;
  check_status_url: string;
}

export interface DiagnosisMapping {
  original_diagnosis: string;
  matched_icd_code: string | null;
  matched_description: string | null;
  confidence_level: 'High' | 'Medium' | 'Low' | 'No Match' | 'Error';
  justification: string;
  alternative_codes: string;
}

export interface BatchMappingResponse {
  total_processed: number;
  results: DiagnosisMapping[];
}

export interface SearchResult {
  query: string;
  total_results: number;
  results: {
    code: string;
    description: string;
    match_type: string;
    justification: string;
  }[];
}