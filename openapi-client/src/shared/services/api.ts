export const API_BASE_URL = 'http://localhost:8000';

export interface HealthResponse {
  status: string;
}

export const fetchHealth = async (): Promise<HealthResponse> => {
  const response = await fetch(`${API_BASE_URL}/health`);
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  return response.json();
};
