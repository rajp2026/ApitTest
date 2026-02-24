from pydantic import BaseModel
from datetime import datetime

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
