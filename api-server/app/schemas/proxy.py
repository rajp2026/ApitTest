from pydantic import BaseModel
from typing import Optional, Dict, Any

class ProxyRequest(BaseModel):
    method: str
    url: str
    headers: Optional[Dict[str, str]] = None
    body: Optional[Any] = None
