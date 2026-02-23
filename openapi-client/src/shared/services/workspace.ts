const API_BASE_URL = 'http://localhost:8000';

export interface Workspace {
  id: number;
  name: string;
  description?: string;
  user_id: number;
  created_at: string;
}

export interface Collection {
  id: number;
  name: string;
  workspace_id: number;
  created_at: string;
}

export interface SavedRequest {
  id: number;
  name: string;
  method: string;
  url: string;
  headers?: any;
  body?: string;
  collection_id: number;
  created_at: string;
}

export const getWorkspaces = async (token: string): Promise<Workspace[]> => {
  const response = await fetch(`${API_BASE_URL}/workspaces`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error('Failed to fetch workspaces');
  return response.json();
};

export const createWorkspace = async (token: string, name: string, description?: string): Promise<Workspace> => {
  const response = await fetch(`${API_BASE_URL}/workspaces`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ name, description }),
  });
  if (!response.ok) throw new Error('Failed to create workspace');
  return response.json();
};

export const deleteWorkspace = async (token: string, id: number): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/workspaces/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error('Failed to delete workspace');
};

export const getCollections = async (token: string, workspaceId: number): Promise<Collection[]> => {
  const response = await fetch(`${API_BASE_URL}/workspaces/${workspaceId}/collections`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error('Failed to fetch collections');
  return response.json();
};

export const createCollection = async (token: string, workspaceId: number, name: string): Promise<Collection> => {
  const response = await fetch(`${API_BASE_URL}/collections`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ workspace_id: workspaceId, name }),
  });
  if (!response.ok) throw new Error('Failed to create collection');
  return response.json();
};

export const getSavedRequests = async (token: string, collectionId: number): Promise<SavedRequest[]> => {
  const response = await fetch(`${API_BASE_URL}/collections/${collectionId}/requests`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error('Failed to fetch saved requests');
  return response.json();
};

export const createSavedRequest = async (token: string, collectionId: number, request: any): Promise<SavedRequest> => {
  const response = await fetch(`${API_BASE_URL}/saved-requests`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ ...request, collection_id: collectionId }),
  });
  if (!response.ok) throw new Error('Failed to save request');
  return response.json();
};
export const updateSavedRequest = async (token: string, id: number, request: any): Promise<SavedRequest> => {
  const response = await fetch(`${API_BASE_URL}/saved-requests/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(request),
  });
  if (!response.ok) throw new Error('Failed to update request');
  return response.json();
};
