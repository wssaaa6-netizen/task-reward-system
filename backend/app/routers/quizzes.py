from typing import Optional, List
from fastapi import APIRouter, Depends, Query
from app.schemas.quiz import (
    QuizListItem,
    QuizPlayResponse,
    QuizSubmitRequest,
    QuizResultResponse
)
from app.schemas.common import APIResponse
from app.services.quiz_service import QuizService
from app.core.dependencies import get_current_user, get_optional_current_user

router = APIRouter(prefix="/quizzes", tags=["Quizzes"])

@router.get("", response_model=APIResponse[List[QuizListItem]])
async def list_quizzes(
    category: Optional[str] = Query(None),
    difficulty: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    current_user: Optional[dict] = Depends(get_optional_current_user)
):
    user_id = current_user["_id"] if current_user else None
    quizzes = await QuizService.list_quizzes(
        user_id=user_id,
        category=category,
        difficulty=difficulty,
        search=search
    )
    return APIResponse(success=True, message="Quizzes loaded", data=quizzes)

@router.get("/{quiz_id}/play", response_model=APIResponse[QuizPlayResponse])
async def get_quiz_for_play(
    quiz_id: str,
    current_user: dict = Depends(get_current_user)
):
    quiz = await QuizService.get_quiz_for_play(quiz_id)
    return APIResponse(success=True, message="Quiz loaded for play", data=quiz)

@router.post("/submit", response_model=APIResponse[QuizResultResponse])
async def submit_quiz(
    submission: QuizSubmitRequest,
    current_user: dict = Depends(get_current_user)
):
    result = await QuizService.submit_quiz_attempt(current_user["_id"], submission)
    return APIResponse(
        success=True,
        message=result.message,
        data=result
    )
