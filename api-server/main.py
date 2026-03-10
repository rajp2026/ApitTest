from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1 import auth, users, workspaces, collections, saved_requests, history
from app.core.database import engine, Base

app = FastAPI(title="ApiTest API")

from app.core.config import settings

# CORS configuration
origins = settings.cors_origins_list

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router, tags=["Authentication"])
app.include_router(users.router, prefix="/users", tags=["Users"])
app.include_router(workspaces.router, prefix="/workspaces", tags=["Workspaces"])
app.include_router(collections.router, tags=["Collections"])
app.include_router(saved_requests.router, tags=["Saved Requests"])
app.include_router(history.router, tags=["History & Proxy"])

@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.get("/")
def root():
    return {"message": "API working"}
