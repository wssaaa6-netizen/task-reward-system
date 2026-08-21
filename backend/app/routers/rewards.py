from typing import Optional, List
from fastapi import APIRouter, Depends, Query
from app.schemas.reward import RewardResponse
from app.schemas.common import APIResponse
from app.services.reward_service import RewardService
from app.core.dependencies import get_optional_current_user

router = APIRouter(prefix="/rewards", tags=["Rewards Catalog"])

@router.get("", response_model=APIResponse[List[RewardResponse]])
async def list_rewards(
    category: Optional[str] = Query(None),
    current_user: Optional[dict] = Depends(get_optional_current_user)
):
    user_id = current_user["_id"] if current_user else None
    rewards = await RewardService.list_rewards(user_id=user_id, category=category)
    return APIResponse(success=True, message="Rewards catalog loaded", data=rewards)

@router.get("/{reward_id}", response_model=APIResponse[RewardResponse])
async def get_reward(reward_id: str):
    reward = await RewardService.get_reward_by_id(reward_id)
    return APIResponse(success=True, message="Reward details loaded", data=reward)
