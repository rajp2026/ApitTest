from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Annotated

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.saved_request import SavedRequest
from app.models.collection import Collection
from app.models.workspace import Workspace
from app.models.user import User
from app.schemas.saved_request import SavedRequestCreate, SavedRequestResponse, SavedRequestUpdate

router = APIRouter()

@router.post("/saved-requests", response_model=SavedRequestResponse)
async def save_request(
    request: SavedRequestCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db)
):
    # Verify collection belongs to user via workspace
    col_result = await db.execute(
        select(Collection)
        .join(Workspace)
        .where(
            Collection.id == request.collection_id,
            Workspace.user_id == current_user.id
        )
    )
    if not col_result.scalars().first():
        raise HTTPException(status_code=403, detail="Not authorized to add to this collection")

    db_request = SavedRequest(**request.dict())
    db.add(db_request)
    await db.commit()
    await db.refresh(db_request)
    return db_request

@router.get("/collections/{collection_id}/requests", response_model=List[SavedRequestResponse])
async def get_saved_requests(
    collection_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(SavedRequest)
        .join(Collection)
        .join(Workspace)
        .where(
            Collection.id == collection_id,
            Workspace.user_id == current_user.id
        )
    )
    return result.scalars().all()

@router.put("/saved-requests/{request_id}", response_model=SavedRequestResponse)
async def update_saved_request_endpoint(
    request_id: int,
    request_update: SavedRequestUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db)
):
    # Verify ownership
    result = await db.execute(
        select(SavedRequest)
        .join(Collection)
        .join(Workspace)
        .where(
            SavedRequest.id == request_id,
            Workspace.user_id == current_user.id
        )
    )
    db_request = result.scalars().first()
    if not db_request:
        raise HTTPException(status_code=404, detail="Request not found")
    
    update_data = request_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_request, key, value)
    
    await db.commit()
    await db.refresh(db_request)
    return db_request
