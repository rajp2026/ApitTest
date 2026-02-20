export const API_BASE_URL = 'http://localhost:8000';

export interface HealthResponse {
  status: string;
}

export interface Item {
  id: number;
  name: string;
  description?: string;
}

export interface ItemCreate {
  name: string;
  description?: string;
}

export const fetchHealth = async (): Promise<HealthResponse> => {
  const response = await fetch(`${API_BASE_URL}/health`);
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  return response.json();
};

export const fetchItems = async (): Promise<Item[]> => {
  const response = await fetch(`${API_BASE_URL}/items/`);
  if (!response.ok) {
    throw new Error('Failed to fetch items');
  }
  return response.json();
};

export const createItem = async (item: ItemCreate): Promise<Item> => {
  const response = await fetch(`${API_BASE_URL}/items/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(item),
  });
  if (!response.ok) {
    throw new Error('Failed to create item');
  }
  return response.json();
};
