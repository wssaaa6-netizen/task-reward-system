from typing import List
from fastapi import APIRouter, Depends
from app.schemas.reward import RedemptionCreate, RedemptionResponse
from app.schemas.common import APIResponse
from app.services.reward_service import RewardService
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/redemptions", tags=["Redemptions"])

@router.post("", response_model=APIResponse[RedemptionResponse])
async def redeem_reward(
    data: RedemptionCreate,
    current_user: dict = Depends(get_current_user)
):
    result = await RewardService.process_redemption(current_user["_id"], data)
    return APIResponse(
        success=True,
        message=f"Redemption simulated! Ref ID: {result.transaction_id} (Demo Mode)",
        data=result
    )

@router.get("/history", response_model=APIResponse[List[RedemptionResponse]])
async def get_redemption_history(current_user: dict = Depends(get_current_user)):
    history = await RewardService.get_user_redemptions(current_user["_id"])
    return APIResponse(
        success=True,
        message="Redemption history loaded",
        data=history
    )
