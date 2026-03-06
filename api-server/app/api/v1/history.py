from fastapi import APIRouter, Depends, HTTPException
import httpx
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Annotated, Optional

from app.core.database import get_db
from app.api.deps import get_current_user, get_optional_user
from app.models.history import RequestHistory
from app.models.user import User
from app.schemas.history import RequestHistoryResponse
from app.schemas.proxy import ProxyRequest

router = APIRouter()

@router.post("/proxy")
async def proxy_request(
    request: ProxyRequest, 
    db: AsyncSession = Depends(get_db),
    user: Optional[User] = Depends(get_optional_user)
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
                history_entry = RequestHistory(
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

@router.get("/history", response_model=List[RequestHistoryResponse])
async def get_history(
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(RequestHistory)
        .where(RequestHistory.user_id == current_user.id)
        .order_by(RequestHistory.timestamp.desc())
    )
    return result.scalars().all()
