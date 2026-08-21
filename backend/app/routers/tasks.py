from typing import Optional, List
from fastapi import APIRouter, Depends, Query
from app.schemas.task import TaskResponse, TaskSubmissionCreate, TaskSubmissionResponse
from app.schemas.common import APIResponse
from app.services.task_service import TaskService
from app.core.dependencies import get_current_user, get_optional_current_user

router = APIRouter(prefix="/tasks", tags=["Tasks"])

@router.get("", response_model=APIResponse[List[TaskResponse]])
async def list_tasks(
    category: Optional[str] = Query(None),
    difficulty: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    current_user: Optional[dict] = Depends(get_optional_current_user)
):
    user_id = current_user["_id"] if current_user else None
    tasks = await TaskService.list_tasks(
        user_id=user_id,
        category=category,
        difficulty=difficulty,
        search=search
    )
    return APIResponse(success=True, message="Tasks loaded", data=tasks)

@router.get("/daily-summary", response_model=APIResponse[dict])
async def get_daily_summary(
    current_user: Optional[dict] = Depends(get_optional_current_user)
):
    user_id = current_user["_id"] if current_user else None
    summary = await TaskService.get_daily_summary(user_id=user_id)
    return APIResponse(success=True, message="Daily task summary loaded", data=summary)

@router.get("/{task_id}", response_model=APIResponse[TaskResponse])
async def get_task_details(
    task_id: str,
    current_user: Optional[dict] = Depends(get_optional_current_user)
):
    user_id = current_user["_id"] if current_user else None
    task = await TaskService.get_task_by_id(task_id, user_id=user_id)
    return APIResponse(success=True, message="Task details loaded", data=task)

@router.post("/submit", response_model=APIResponse[TaskSubmissionResponse])
async def submit_task(
    submission: TaskSubmissionCreate,
    current_user: dict = Depends(get_current_user)
):
    result = await TaskService.submit_task(current_user["_id"], submission)
    return APIResponse(
        success=True,
        message=f"Task completed successfully! +{result.points_awarded} points added to your wallet.",
        data=result
    )
