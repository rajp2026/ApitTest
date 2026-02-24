from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Annotated

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.collection import Collection
from app.models.workspace import Workspace
from app.models.user import User
from app.schemas.collection import CollectionCreate, CollectionResponse

router = APIRouter()

@router.post("/collections", response_model=CollectionResponse)
async def create_collection(
    collection: CollectionCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db)
):
    # Verify workspace belongs to user
    ws_result = await db.execute(
        select(Workspace).where(
            Workspace.id == collection.workspace_id,
            Workspace.user_id == current_user.id
        )
    )
    if not ws_result.scalars().first():
        raise HTTPException(status_code=403, detail="Not authorized to add to this workspace")

    db_collection = Collection(**collection.dict())
    db.add(db_collection)
    await db.commit()
    await db.refresh(db_collection)
    return db_collection

@router.get("/workspaces/{workspace_id}/collections", response_model=List[CollectionResponse])
async def get_collections(
    workspace_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Collection)
        .join(Workspace)
        .where(
            Workspace.id == workspace_id,
            Workspace.user_id == current_user.id
        )
    )
    return result.scalars().all()
