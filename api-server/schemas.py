from pydantic import BaseModel, EmailStr
from typing import Optional, Dict, Any, List
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class ProxyRequest(BaseModel):
    method: str
    url: str
    headers: Optional[Dict[str, str]] = None
    body: Optional[Any] = None

class RequestHistoryResponse(BaseModel):
    id: int
    method: str
    url: str
    headers: Optional[Dict[str, Any]] = None
    body: Optional[str] = None
    status_code: Optional[int] = None
    timestamp: datetime

    class Config:
        from_attributes = True

# Workspace Schemas
class WorkspaceBase(BaseModel):
    name: str
    description: Optional[str] = None

class WorkspaceCreate(WorkspaceBase):
    pass

class WorkspaceResponse(WorkspaceBase):
    id: int
    user_id: int
    created_at: datetime
    class Config:
        from_attributes = True

# Collection Schemas
class CollectionBase(BaseModel):
    name: str

class CollectionCreate(CollectionBase):
    workspace_id: int

class CollectionResponse(CollectionBase):
    id: int
    workspace_id: int
    created_at: datetime
    class Config:
        from_attributes = True

# Saved Request Schemas
class SavedRequestBase(BaseModel):
    name: str
    method: str
    url: str
    headers: Optional[Dict[str, Any]] = None
    body: Optional[str] = None

class SavedRequestCreate(SavedRequestBase):
    collection_id: int

class SavedRequestUpdate(BaseModel):
    name: Optional[str] = None
    method: Optional[str] = None
    url: Optional[str] = None
    headers: Optional[Dict[str, Any]] = None
    body: Optional[str] = None

class SavedRequestResponse(SavedRequestBase):
    id: int
    collection_id: int
    created_at: datetime
    class Config:
        from_attributes = True
