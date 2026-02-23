from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from database import get_db, engine, Base
# from schemas import ItemBase, ItemCreate, ItemRead, UserCreate, UserResponse, Token, ProxyRequest
from typing import List, Annotated, Dict, Any, Optional
from fastapi.security import OAuth2PasswordBearer
import auth
import models
from jose import JWTError, jwt
import httpx

app = FastAPI()

from schemas import (
    UserCreate, UserResponse, Token, ProxyRequest, RequestHistoryResponse,
    WorkspaceCreate, WorkspaceResponse, CollectionCreate, CollectionResponse,
    SavedRequestCreate, SavedRequestResponse, SavedRequestUpdate
)

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

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

async def get_current_user(token: Annotated[str, Depends(oauth2_scheme)], db: AsyncSession = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    result = await db.execute(select(models.User).where(models.User.email == email))
    user = result.scalars().first()
    if user is None:
        raise credentials_exception
    return user

@app.post("/signup", response_model=UserResponse)
async def signup(user: UserCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(models.User).where(models.User.email == user.email))
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = auth.get_password_hash(user.password)
    db_user = models.User(email=user.email, hashed_password=hashed_password)
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)
    return db_user

@app.post("/login", response_model=Token)
async def login(user: UserCreate, db: AsyncSession = Depends(get_db)): # Using UserCreate for convenience here
    result = await db.execute(select(models.User).where(models.User.email == user.email))
    db_user = result.scalars().first()
    if not db_user or not auth.verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    access_token = auth.create_access_token(data={"sub": db_user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/users/me", response_model=UserResponse)
async def read_users_me(current_user: Annotated[models.User, Depends(get_current_user)]):
    return current_user


# Helper to get user or None
async def get_optional_user(token: Annotated[Optional[str], Depends(oauth2_scheme)] = None, db: AsyncSession = Depends(get_db)):
    if not token or token == "undefined" or token == "null":
        return None
    try:
        payload = jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            return None
        result = await db.execute(select(models.User).where(models.User.email == email))
        return result.scalars().first()
    except:
        return None

@app.post("/proxy")
async def proxy_request(
    request: ProxyRequest, 
    db: AsyncSession = Depends(get_db),
    user: Optional[models.User] = Depends(get_optional_user)
):
    async with httpx.AsyncClient() as client:
        try:
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
            resp_headers = {k: v for k, v in response.headers.items()}
            
            try:
                resp_json = response.json()
            except:
                resp_json = str(response.text)

            # Save to history if user is logged in
            if user:
                history_entry = models.RequestHistory(
                    user_id=user.id,
                    method=request.method,
                    url=request.url,
                    headers=request.headers,
                    body=str(request.body) if request.body else None,
                    status_code=response.status_code
                )
                db.add(history_entry)
                await db.commit()

            return {
                "status": response.status_code,
                "statusText": response.reason_phrase,
                "headers": resp_headers,
                "data": resp_json
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

@app.get("/history", response_model=List[RequestHistoryResponse])
async def get_history(
    current_user: Annotated[models.User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(models.RequestHistory)
        .where(models.RequestHistory.user_id == current_user.id)
        .order_by(models.RequestHistory.timestamp.desc())
    )
    return result.scalars().all()

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

# Workspace Endpoints
@app.post("/workspaces", response_model=WorkspaceResponse)
async def create_workspace(
    workspace: WorkspaceCreate,
    current_user: Annotated[models.User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db)
):
    db_workspace = models.Workspace(**workspace.dict(), user_id=current_user.id)
    db.add(db_workspace)
    await db.commit()
    await db.refresh(db_workspace)
    return db_workspace

@app.get("/workspaces", response_model=List[WorkspaceResponse])
async def get_workspaces(
    current_user: Annotated[models.User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(models.Workspace).where(models.Workspace.user_id == current_user.id)
    )
    return result.scalars().all()

@app.delete("/workspaces/{workspace_id}")
async def delete_workspace(
    workspace_id: int,
    current_user: Annotated[models.User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(models.Workspace).where(
            models.Workspace.id == workspace_id, 
            models.Workspace.user_id == current_user.id
        )
    )
    db_workspace = result.scalars().first()
    if not db_workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
    
    await db.delete(db_workspace)
    await db.commit()
    return {"message": "Workspace deleted"}

# Collection Endpoints
@app.post("/collections", response_model=CollectionResponse)
async def create_collection(
    collection: CollectionCreate,
    current_user: Annotated[models.User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db)
):
    # Verify workspace belongs to user
    ws_result = await db.execute(
        select(models.Workspace).where(
            models.Workspace.id == collection.workspace_id,
            models.Workspace.user_id == current_user.id
        )
    )
    if not ws_result.scalars().first():
        raise HTTPException(status_code=403, detail="Not authorized to add to this workspace")

    db_collection = models.Collection(**collection.dict())
    db.add(db_collection)
    await db.commit()
    await db.refresh(db_collection)
    return db_collection

@app.get("/workspaces/{workspace_id}/collections", response_model=List[CollectionResponse])
async def get_collections(
    workspace_id: int,
    current_user: Annotated[models.User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(models.Collection)
        .join(models.Workspace)
        .where(
            models.Collection.workspace_id == workspace_id,
            models.Workspace.user_id == current_user.id
        )
    )
    return result.scalars().all()

# Saved Request Endpoints
@app.post("/saved-requests", response_model=SavedRequestResponse)
async def create_saved_request(
    request: SavedRequestCreate,
    current_user: Annotated[models.User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db)
):
    # Verify collection belongs to a workspace owned by the user
    col_result = await db.execute(
        select(models.Collection)
        .join(models.Workspace)
        .where(
            models.Collection.id == request.collection_id,
            models.Workspace.user_id == current_user.id
        )
    )
    if not col_result.scalars().first():
        raise HTTPException(status_code=403, detail="Not authorized to add to this collection")

    db_request = models.SavedRequest(**request.dict())
    db.add(db_request)
    await db.commit()
    await db.refresh(db_request)
    return db_request

@app.get("/collections/{collection_id}/requests", response_model=List[SavedRequestResponse])
async def get_saved_requests(
    collection_id: int,
    current_user: Annotated[models.User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(models.SavedRequest)
        .join(models.Collection)
        .join(models.Workspace)
        .where(
            models.SavedRequest.collection_id == collection_id,
            models.Workspace.user_id == current_user.id
        )
    )
    return result.scalars().all()

@app.put("/saved-requests/{request_id}", response_model=SavedRequestResponse)
async def update_saved_request(
    request_id: int,
    request_update: SavedRequestUpdate,
    current_user: Annotated[models.User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db)
):
    # Verify ownership and find the request
    result = await db.execute(
        select(models.SavedRequest)
        .join(models.Collection)
        .join(models.Workspace)
        .where(
            models.SavedRequest.id == request_id,
            models.Workspace.user_id == current_user.id
        )
    )
    db_request = result.scalars().first()
    if not db_request:
        raise HTTPException(status_code=404, detail="Saved request not found")

    # Update fields
    update_data = request_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_request, key, value)

    await db.commit()
    await db.refresh(db_request)
    return db_request
