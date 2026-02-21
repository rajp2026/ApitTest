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
