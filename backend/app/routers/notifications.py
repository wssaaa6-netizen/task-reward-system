from typing import List
from fastapi import APIRouter, Depends, Query
from app.schemas.notification import NotificationResponse
from app.schemas.common import APIResponse
from app.services.notification_service import NotificationService
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/notifications", tags=["Notifications"])

@router.get("", response_model=APIResponse[List[NotificationResponse]])
async def get_notifications(
    limit: int = Query(30, ge=1, le=100),
    current_user: dict = Depends(get_current_user)
):
    items = await NotificationService.get_user_notifications(current_user["_id"], limit=limit)
    return APIResponse(success=True, message="Notifications loaded", data=items)

@router.get("/unread-count", response_model=APIResponse[dict])
async def get_unread_count(current_user: dict = Depends(get_current_user)):
    count = await NotificationService.get_unread_count(current_user["_id"])
    return APIResponse(success=True, message="Unread count", data={"unread_count": count})

@router.put("/{notification_id}/read", response_model=APIResponse[dict])
async def mark_as_read(
    notification_id: str,
    current_user: dict = Depends(get_current_user)
):
    success = await NotificationService.mark_as_read(current_user["_id"], notification_id)
    return APIResponse(success=success, message="Marked as read", data={})

@router.put("/read-all", response_model=APIResponse[dict])
async def mark_all_read(current_user: dict = Depends(get_current_user)):
    count = await NotificationService.mark_all_as_read(current_user["_id"])
    return APIResponse(success=True, message=f"{count} notifications marked as read", data={"updated": count})
