import uuid
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from app.schemas.admin import (
    AdminStatsResponse,
    AdminUserUpdateRequest,
    FraudEventResponse,
    FraudEventActionRequest,
    SystemSettingsSchema
)
from app.schemas.task import TaskCreate, TaskUpdate, TaskResponse, TaskStatus
from app.schemas.quiz import QuizCreate, QuizUpdate, QuizListItem, QuizQuestionDetail
from app.schemas.reward import RewardCreate, RewardUpdate, RewardResponse, RewardStatus
from app.schemas.withdrawal import WithdrawalResponse, WithdrawalActionRequest
from app.schemas.user import UserResponse
from app.schemas.common import APIResponse, PaginatedData
from app.core.dependencies import get_current_active_admin
from app.database.mongodb import get_database
from app.services.admin_service import AdminService
from app.services.settings_service import SettingsService
from app.services.fraud_service import FraudService
from app.services.withdrawal_service import WithdrawalService
from app.services.wallet_service import WalletService
from app.services.auth_service import AuthService

router = APIRouter(prefix="/admin", tags=["Admin Portal"], dependencies=[Depends(get_current_active_admin)])

# --- Stats & Overview ---
@router.get("/stats", response_model=APIResponse[AdminStatsResponse])
async def get_admin_dashboard_stats():
    stats = await AdminService.get_dashboard_stats()
    return APIResponse(success=True, message="Admin dashboard statistics", data=stats)

# --- User Management ---
@router.get("/users", response_model=APIResponse[PaginatedData[UserResponse]])
async def list_admin_users(
    search: Optional[str] = Query(None),
    status: Optional[str] = Query("ALL"),
    role: Optional[str] = Query("ALL"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100)
):
    db = get_database()
    query: Dict[str, Any] = {}
    if status and status != "ALL":
        query["status"] = status
    if role and role != "ALL":
        query["role"] = role
    if search:
        query["$or"] = [
            {"full_name": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}},
            {"mobile": {"$regex": search, "$options": "i"}},
            {"referral_code": {"$regex": search, "$options": "i"}}
        ]

    total = await db.users.count_documents(query)
    skip = (page - 1) * limit
    cursor = db.users.find(query).sort("created_at", -1).skip(skip).limit(limit)

    users_list = []
    async for user in cursor:
        u_res = await AuthService.format_user_response(user["_id"])
        users_list.append(u_res)

    pages = (total + limit - 1) // limit if total > 0 else 1
    return APIResponse(
        success=True,
        message="Users list retrieved",
        data=PaginatedData(items=users_list, total=total, page=page, limit=limit, pages=pages)
    )

@router.get("/users/{user_id}", response_model=APIResponse[UserResponse])
async def get_admin_user_detail(user_id: str):
    user_res = await AuthService.format_user_response(user_id)
    return APIResponse(success=True, message="User details retrieved", data=user_res)

@router.put("/users/{user_id}", response_model=APIResponse[UserResponse])
async def update_admin_user(user_id: str, update: AdminUserUpdateRequest):
    db = get_database()
    user = await db.users.find_one({"_id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    set_fields: Dict[str, Any] = {"updated_at": datetime.now(timezone.utc)}
    if update.full_name is not None:
        set_fields["full_name"] = update.full_name
    if update.role is not None:
        set_fields["role"] = update.role
    if update.status is not None:
        set_fields["status"] = update.status
    if update.level is not None:
        set_fields["level"] = update.level

    await db.users.update_one({"_id": user_id}, {"$set": set_fields})

    # Points adjustment if specified
    if update.points_adjustment and update.points_adjustment != 0:
        if update.points_adjustment > 0:
            await WalletService.add_points(
                user_id=user_id,
                amount=update.points_adjustment,
                tx_type="ADJUSTMENT",
                description=f"Admin Adjustment: {update.adjustment_reason or 'Manual Credit'}",
                ref_type="admin"
            )
        else:
            await WalletService.deduct_points(
                user_id=user_id,
                amount=abs(update.points_adjustment),
                tx_type="ADJUSTMENT",
                description=f"Admin Adjustment: {update.adjustment_reason or 'Manual Debit'}",
                ref_type="admin"
            )

    user_res = await AuthService.format_user_response(user_id)
    return APIResponse(success=True, message="User updated successfully", data=user_res)

# --- Tasks CRUD ---
@router.post("/tasks", response_model=APIResponse[TaskResponse])
async def create_task(task_in: TaskCreate):
    db = get_database()
    task_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)

    doc = {
        "_id": task_id,
        **task_in.model_dump(),
        "completions_count": 0,
        "created_at": now,
        "updated_at": now
    }
    await db.tasks.insert_one(doc)

    return APIResponse(
        success=True,
        message="Task created successfully.",
        data=TaskResponse(id=task_id, **task_in.model_dump(), completions_count=0, created_at=now)
    )

@router.put("/tasks/{task_id}", response_model=APIResponse[dict])
async def update_task(task_id: str, task_in: TaskUpdate):
    db = get_database()
    update_data = {k: v for k, v in task_in.model_dump(exclude_unset=True).items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields provided to update.")

    update_data["updated_at"] = datetime.now(timezone.utc)
    res = await db.tasks.update_one({"_id": task_id}, {"$set": update_data})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")

    return APIResponse(success=True, message="Task updated successfully", data={})

@router.delete("/tasks/{task_id}", response_model=APIResponse[dict])
async def delete_task(task_id: str):
    db = get_database()
    res = await db.tasks.delete_one({"_id": task_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    return APIResponse(success=True, message="Task deleted successfully", data={})

# --- Quizzes CRUD ---
@router.post("/quizzes", response_model=APIResponse[dict])
async def create_quiz(quiz_in: QuizCreate):
    db = get_database()
    quiz_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)

    questions_data = []
    for idx, q in enumerate(quiz_in.questions):
        q_dict = q.model_dump()
        q_dict["id"] = q_dict.get("id") or f"q_{idx+1}_{uuid.uuid4().hex[:6]}"
        questions_data.append(q_dict)

    doc = {
        "_id": quiz_id,
        "title": quiz_in.title,
        "description": quiz_in.description,
        "category": quiz_in.category,
        "difficulty": quiz_in.difficulty,
        "duration_seconds": quiz_in.duration_seconds,
        "passing_score_percentage": quiz_in.passing_score_percentage,
        "questions": questions_data,
        "status": quiz_in.status,
        "cover_image": quiz_in.cover_image,
        "attempts_count": 0,
        "created_at": now,
        "updated_at": now
    }
    await db.quizzes.insert_one(doc)
    return APIResponse(success=True, message="Quiz created successfully.", data={"quiz_id": quiz_id})

@router.get("/quizzes/{quiz_id}", response_model=APIResponse[dict])
async def get_admin_quiz_detail(quiz_id: str):
    db = get_database()
    doc = await db.quizzes.find_one({"_id": quiz_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Quiz not found")
    doc["id"] = str(doc["_id"])
    del doc["_id"]
    return APIResponse(success=True, message="Quiz details loaded", data=doc)

@router.put("/quizzes/{quiz_id}", response_model=APIResponse[dict])
async def update_quiz(quiz_id: str, quiz_in: QuizUpdate):
    db = get_database()
    update_data = {k: v for k, v in quiz_in.model_dump(exclude_unset=True).items() if v is not None}
    if "questions" in update_data and update_data["questions"]:
        questions_data = []
        for idx, q in enumerate(update_data["questions"]):
            q_dict = q if isinstance(q, dict) else q.model_dump()
            q_dict["id"] = q_dict.get("id") or f"q_{idx+1}_{uuid.uuid4().hex[:6]}"
            questions_data.append(q_dict)
        update_data["questions"] = questions_data

    update_data["updated_at"] = datetime.now(timezone.utc)
    res = await db.quizzes.update_one({"_id": quiz_id}, {"$set": update_data})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Quiz not found")
    return APIResponse(success=True, message="Quiz updated successfully", data={})

@router.delete("/quizzes/{quiz_id}", response_model=APIResponse[dict])
async def delete_quiz(quiz_id: str):
    db = get_database()
    res = await db.quizzes.delete_one({"_id": quiz_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Quiz not found")
    return APIResponse(success=True, message="Quiz deleted successfully", data={})

# --- Rewards CRUD ---
@router.post("/rewards", response_model=APIResponse[RewardResponse])
async def create_reward(reward_in: RewardCreate):
    db = get_database()
    rew_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)

    doc = {
        "_id": rew_id,
        **reward_in.model_dump(),
        "created_at": now,
        "updated_at": now
    }
    await db.rewards.insert_one(doc)
    return APIResponse(
        success=True,
        message="Reward created successfully.",
        data=RewardResponse(id=rew_id, **reward_in.model_dump(), can_user_afford=False, created_at=now)
    )

@router.put("/rewards/{reward_id}", response_model=APIResponse[dict])
async def update_reward(reward_id: str, reward_in: RewardUpdate):
    db = get_database()
    update_data = {k: v for k, v in reward_in.model_dump(exclude_unset=True).items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc)
    res = await db.rewards.update_one({"_id": reward_id}, {"$set": update_data})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Reward not found")
    return APIResponse(success=True, message="Reward updated successfully", data={})

@router.delete("/rewards/{reward_id}", response_model=APIResponse[dict])
async def delete_reward(reward_id: str):
    db = get_database()
    res = await db.rewards.delete_one({"_id": reward_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Reward not found")
    return APIResponse(success=True, message="Reward deleted successfully", data={})

# --- Withdrawals Queue & Simulation ---
@router.get("/withdrawals", response_model=APIResponse[List[WithdrawalResponse]])
async def list_admin_withdrawals(status: Optional[str] = Query("ALL")):
    db = get_database()
    query = {}
    if status and status != "ALL":
        query["status"] = status

    cursor = db.withdrawals.find(query).sort("created_at", -1).limit(100)
    items = []
    async for doc in cursor:
        items.append(WithdrawalResponse(
            id=str(doc["_id"]),
            user_id=doc["user_id"],
            user_name=doc.get("user_name"),
            user_email=doc.get("user_email"),
            method=doc["method"],
            points=doc["points"],
            amount_inr=doc["amount_inr"],
            destination_display=doc["destination_display"],
            status=doc["status"],
            transaction_id=doc["transaction_id"],
            is_demo=doc.get("is_demo", True),
            admin_notes=doc.get("admin_notes"),
            created_at=doc["created_at"],
            updated_at=doc.get("updated_at")
        ))
    return APIResponse(success=True, message="Withdrawals queue loaded", data=items)

@router.put("/withdrawals/{withdrawal_id}/action", response_model=APIResponse[WithdrawalResponse])
async def action_withdrawal(withdrawal_id: str, action: WithdrawalActionRequest):
    res = await WithdrawalService.admin_process_withdrawal(withdrawal_id, action)
    return APIResponse(success=True, message=f"Withdrawal status updated to {res.status}", data=res)

# --- Fraud & Anti-Abuse Management ---
@router.get("/fraud", response_model=APIResponse[List[FraudEventResponse]])
async def list_fraud_events(status: Optional[str] = Query("ALL")):
    events = await FraudService.get_fraud_events(status=status)
    return APIResponse(success=True, message="Fraud events loaded", data=events)

@router.put("/fraud/{event_id}/action", response_model=APIResponse[dict])
async def action_fraud_event(event_id: str, action: FraudEventActionRequest):
    db = get_database()
    doc = await db.fraud_events.find_one({"_id": event_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Fraud event not found")

    await db.fraud_events.update_one(
        {"_id": event_id},
        {
            "$set": {
                "status": action.status,
                "resolution_notes": action.resolution_notes,
                "updated_at": datetime.now(timezone.utc)
            }
        }
    )

    if action.admin_action == "SUSPEND_USER":
        await db.users.update_one({"_id": doc["user_id"]}, {"$set": {"status": "SUSPENDED"}})

    return APIResponse(success=True, message="Fraud event resolved", data={})

# --- System Settings Configuration ---
@router.get("/settings", response_model=APIResponse[SystemSettingsSchema])
async def get_system_settings():
    settings = await SettingsService.get_settings()
    return APIResponse(success=True, message="System settings loaded", data=settings)

@router.put("/settings", response_model=APIResponse[SystemSettingsSchema])
async def update_system_settings(settings_in: SystemSettingsSchema):
    updated = await SettingsService.update_settings(settings_in)
    return APIResponse(success=True, message="System settings updated successfully", data=updated)
