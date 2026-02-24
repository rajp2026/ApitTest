from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime

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
