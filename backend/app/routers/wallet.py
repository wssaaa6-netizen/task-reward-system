from typing import Optional, List
from fastapi import APIRouter, Depends, Query
from app.schemas.wallet import WalletResponse, PointTransactionResponse
from app.schemas.common import APIResponse, PaginatedData
from app.services.wallet_service import WalletService
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/wallet", tags=["Wallet & Ledger"])

@router.get("", response_model=APIResponse[WalletResponse])
async def get_wallet(current_user: dict = Depends(get_current_user)):
    wallet_data = await WalletService.get_wallet_response(current_user["_id"])
    return APIResponse(success=True, message="Wallet balance retrieved", data=wallet_data)

@router.get("/transactions", response_model=APIResponse[PaginatedData[PointTransactionResponse]])
async def get_transactions(
    type: Optional[str] = Query("ALL"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(get_current_user)
):
    skip = (page - 1) * limit
    items, total = await WalletService.get_user_transactions(
        user_id=current_user["_id"],
        tx_type=type,
        limit=limit,
        skip=skip
    )
    pages = (total + limit - 1) // limit if total > 0 else 1

    return APIResponse(
        success=True,
        message="Transactions retrieved",
        data=PaginatedData(
            items=items,
            total=total,
            page=page,
            limit=limit,
            pages=pages
        )
    )
