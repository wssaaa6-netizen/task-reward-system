from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime, timezone
from app.schemas.user import UserProfileUpdate, PasswordChangeRequest, UserResponse
from app.schemas.common import APIResponse
from app.core.dependencies import get_current_user
from app.core.security import get_password_hash, verify_password
from app.database.mongodb import get_database
from app.services.auth_service import AuthService

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("/profile", response_model=APIResponse[UserResponse])
async def get_profile(current_user: dict = Depends(get_current_user)):
    user_res = await AuthService.format_user_response(current_user["_id"])
    return APIResponse(success=True, message="Profile retrieved", data=user_res)

@router.put("/profile", response_model=APIResponse[UserResponse])
async def update_profile(
    data: UserProfileUpdate,
    current_user: dict = Depends(get_current_user)
):
    db = get_database()
    update_fields = {}
    if data.full_name is not None:
        update_fields["full_name"] = data.full_name.strip()
    if data.mobile is not None:
        update_fields["mobile"] = data.mobile.strip()
    if data.avatar_url is not None:
        update_fields["avatar_url"] = data.avatar_url
    if data.bio is not None:
        update_fields["bio"] = data.bio

    if update_fields:
        update_fields["updated_at"] = datetime.now(timezone.utc)
        await db.users.update_one({"_id": current_user["_id"]}, {"$set": update_fields})

    user_res = await AuthService.format_user_response(current_user["_id"])
    return APIResponse(success=True, message="Profile updated successfully.", data=user_res)

@router.post("/change-password", response_model=APIResponse[dict])
async def change_password(
    data: PasswordChangeRequest,
    current_user: dict = Depends(get_current_user)
):
    if data.new_password != data.confirm_password:
        raise HTTPException(status_code=400, detail="New passwords do not match.")

    if not verify_password(data.current_password, current_user.get("password_hash", "")):
        raise HTTPException(status_code=400, detail="Current password is incorrect.")

    db = get_database()
    new_hash = get_password_hash(data.new_password)
    await db.users.update_one(
        {"_id": current_user["_id"]},
        {"$set": {"password_hash": new_hash, "updated_at": datetime.now(timezone.utc)}}
    )

    return APIResponse(success=True, message="Password changed successfully.", data={})
