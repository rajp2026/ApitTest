from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from database import get_db, engine, Base
from models import Item
from pydantic import BaseModel
from typing import List

app = FastAPI()

# Pydantic models for request/response
class ItemBase(BaseModel):
    name: str
    description: str | None = None

class ItemCreate(ItemBase):
    pass

class ItemRead(ItemBase):
    id: int
    class Config:
        from_attributes = True

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

import httpx
from typing import Dict, Any, Optional

# Proxy Request models
class ProxyRequest(BaseModel):
    method: str
    url: str
    headers: Optional[Dict[str, str]] = None
    body: Optional[Any] = None

@app.post("/proxy")
async def proxy_request(request: ProxyRequest):
    async with httpx.AsyncClient() as client:
        try:
            # Prepare request parameters
            kwargs = {
                "method": request.method.upper(),
                "url": request.url,
                "headers": request.headers,
                "timeout": 30.0
            }
            
            if request.body:
                if isinstance(request.body, dict):
                    kwargs["json"] = request.body
                else:
                    kwargs["content"] = str(request.body)

            response = await client.request(**kwargs)
            
            # Extract headers, skipping some dangerous ones if necessary
            resp_headers = {k: v for k, v in response.headers.items()}
            
            try:
                resp_json = response.json()
            except:
                resp_json = response.text

            return {
                "status": response.status_code,
                "statusText": response.reason_phrase,
                "headers": resp_headers,
                "data": resp_json
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

@app.on_event("startup")
async def startup():
    # Create tables if they don't exist (In production, use Alembic migrations)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

@app.get("/")
def read_root():
    return {"message": "Hello from FastAPI"}

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.post("/items/", response_model=ItemRead)
async def create_item(item: ItemCreate, db: AsyncSession = Depends(get_db)):
    db_item = Item(**item.dict())
    db.add(db_item)
    await db.commit()
    await db.refresh(db_item)
    return db_item

@app.get("/items/", response_model=List[ItemRead])
async def read_items(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Item))
    items = result.scalars().all()
    return items
