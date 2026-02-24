from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Annotated

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.workspace import Workspace
from app.models.user import User
from app.schemas.workspace import WorkspaceCreate, WorkspaceResponse

router = APIRouter()

@router.post("/", response_model=WorkspaceResponse)
async def create_workspace(
    workspace: WorkspaceCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db)
):
    db_workspace = Workspace(**workspace.dict(), user_id=current_user.id)
    db.add(db_workspace)
    await db.commit()
    await db.refresh(db_workspace)
    return db_workspace

@router.get("/", response_model=List[WorkspaceResponse])
async def get_workspaces(
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Workspace).where(Workspace.user_id == current_user.id)
    )
    return result.scalars().all()

@router.delete("/{workspace_id}")
async def delete_workspace(
    workspace_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Workspace).where(
            Workspace.id == workspace_id, 
            Workspace.user_id == current_user.id
        )
    )
    db_workspace = result.scalars().first()
    if not db_workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
    
    await db.delete(db_workspace)
    await db.commit()
    return {"message": "Workspace deleted"}
