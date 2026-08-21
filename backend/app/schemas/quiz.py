from datetime import datetime
from typing import Optional, List, Dict, Any, Union
from pydantic import BaseModel, Field

class QuestionType:
    MULTIPLE_CHOICE = "MULTIPLE_CHOICE"
    TRUE_FALSE = "TRUE_FALSE"

class QuizQuestionCreate(BaseModel):
    id: Optional[str] = None
    question: str = Field(..., min_length=5)
    question_type: str = QuestionType.MULTIPLE_CHOICE
    options: List[str] = Field(..., min_length=2)
    correct_option_index: int = Field(..., ge=0)
    explanation: str = Field(..., min_length=3)
    points: int = Field(default=10, gt=0)

# Safe for user during quiz taking (NO ANSWERS OR EXPLANATIONS)
class QuizQuestionSafe(BaseModel):
    id: str
    question: str
    question_type: str
    options: List[str]
    points: int

# Admin / post-quiz review view with answers and explanations
class QuizQuestionDetail(BaseModel):
    id: str
    question: str
    question_type: str
    options: List[str]
    correct_option_index: int
    explanation: str
    points: int

class QuizCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=150)
    description: str = Field(..., min_length=10)
    category: str = "General Knowledge"
    difficulty: str = "Medium"
    duration_seconds: int = Field(default=180, gt=10)  # e.g., 3 mins
    passing_score_percentage: int = Field(default=60, ge=0, le=100)
    questions: List[QuizQuestionCreate] = Field(..., min_length=1)
    status: str = "ACTIVE"
    cover_image: Optional[str] = None

class QuizUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    difficulty: Optional[str] = None
    duration_seconds: Optional[int] = None
    passing_score_percentage: Optional[int] = None
    questions: Optional[List[QuizQuestionCreate]] = None
    status: Optional[str] = None
    cover_image: Optional[str] = None

class QuizListItem(BaseModel):
    id: str
    title: str
    description: str
    category: str
    difficulty: str
    duration_seconds: int
    total_questions: int
    total_points: int
    passing_score_percentage: int
    status: str
    cover_image: Optional[str] = None
    attempts_count: int = 0
    is_completed_by_user: bool = False
    user_best_score: Optional[int] = None
    user_points_earned: Optional[int] = None
    created_at: datetime

class QuizPlayResponse(BaseModel):
    id: str
    title: str
    description: str
    category: str
    difficulty: str
    duration_seconds: int
    total_questions: int
    total_points: int
    passing_score_percentage: int
    questions: List[QuizQuestionSafe]

class UserAnswerSubmission(BaseModel):
    question_id: str
    selected_option_index: int

class QuizSubmitRequest(BaseModel):
    quiz_id: str
    time_taken_seconds: int
    answers: List[UserAnswerSubmission]

class QuestionResultReview(BaseModel):
    question_id: str
    question: str
    options: List[str]
    selected_option_index: Optional[int]
    correct_option_index: int
    is_correct: bool
    explanation: str
    points_awarded: int

class QuizResultResponse(BaseModel):
    attempt_id: str
    quiz_id: str
    quiz_title: str
    score: int
    total_score: int
    correct_count: int
    wrong_count: int
    unanswered_count: int
    accuracy_percentage: float
    passed: bool
    points_earned: int
    time_taken_seconds: int
    is_duplicate_attempt: bool = False
    message: str
    question_reviews: List[QuestionResultReview] = []
    created_at: datetime
