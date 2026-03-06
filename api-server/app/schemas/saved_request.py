from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime

class SavedRequestBase(BaseModel):
    name: str
    method: str
    url: str
    headers: Optional[Dict[str, Any]] = None
    body: Optional[str] = None

class SavedRequestCreate(SavedRequestBase):
    collection_id: Optional[int] = None
    workspace_id: Optional[int] = None

class SavedRequestUpdate(BaseModel):
    name: Optional[str] = None
    method: Optional[str] = None
    url: Optional[str] = None
    headers: Optional[Dict[str, Any]] = None
    body: Optional[str] = None

class SavedRequestResponse(SavedRequestBase):
    id: int
    collection_id: Optional[int] = None
    workspace_id: Optional[int] = None
    created_at: datetime
    class Config:
        from_attributes = True
