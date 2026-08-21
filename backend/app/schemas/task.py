from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class TaskCategory:
    QUICK_TASK = "Quick Tasks"
    KNOWLEDGE = "Knowledge"
    TECHNOLOGY = "Technology"
    LEARNING = "Learning"
    DAILY_CHALLENGE = "Daily Challenges"
    STREAK_TASK = "Streak Tasks"
    BONUS_TASK = "Bonus Tasks"
    EDUCATION = "Education"
    GENERAL_KNOWLEDGE = "General Knowledge"
    CODING = "Coding"
    SURVEY = "Survey"
    READING = "Reading"
    SPECIAL_EVENT = "Special Event"

class TaskDifficulty:
    EASY = "Easy"
    MEDIUM = "Medium"
    HARD = "Hard"
    EXPERT = "Expert"

class TaskStatus:
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    COMPLETED = "COMPLETED"

class TaskCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=150)
    description: str = Field(..., min_length=10)
    category: str = Field(default=TaskCategory.QUICK_TASK)
    difficulty: str = Field(default=TaskDifficulty.EASY)
    points: int = Field(..., gt=0)
    time_limit_minutes: int = Field(default=2, gt=0)
    instructions: List[str] = []
    requirements: Optional[str] = None
    verification_type: str = "AUTO"  # AUTO, INTERACTIVE_QUIZ, TRUE_FALSE, TEXT_ANSWER, READING_CONFIRM, CODE_SUBMIT
    interactive_data: Optional[Dict[str, Any]] = None
    is_daily: bool = False
    image_url: Optional[str] = None
    external_url: Optional[str] = None
    max_completions: int = Field(default=1000, gt=0)
    status: str = TaskStatus.ACTIVE

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    difficulty: Optional[str] = None
    points: Optional[int] = None
    time_limit_minutes: Optional[int] = None
    instructions: Optional[List[str]] = None
    requirements: Optional[str] = None
    verification_type: Optional[str] = None
    interactive_data: Optional[Dict[str, Any]] = None
    is_daily: Optional[bool] = None
    image_url: Optional[str] = None
    external_url: Optional[str] = None
    max_completions: Optional[int] = None
    status: Optional[str] = None

class TaskResponse(BaseModel):
    id: str
    title: str
    description: str
    category: str
    difficulty: str
    points: int
    time_limit_minutes: int
    instructions: List[str]
    requirements: Optional[str] = None
    verification_type: str
    interactive_data: Optional[Dict[str, Any]] = None
    is_daily: bool = False
    image_url: Optional[str] = None
    external_url: Optional[str] = None
    max_completions: int
    completions_count: int = 0
    status: str
    is_completed_by_user: bool = False
    user_submission_status: Optional[str] = None
    created_at: datetime

class TaskSubmissionCreate(BaseModel):
    task_id: str
    text_proof: Optional[str] = None
    link_proof: Optional[str] = None
    selected_option_index: Optional[int] = None
    text_answer: Optional[str] = None
    reading_time_seconds: Optional[int] = None
    answers: Optional[Dict[str, Any]] = None

class TaskSubmissionResponse(BaseModel):
    id: str
    user_id: str
    task_id: str
    task_title: str
    points_awarded: int
    status: str
    text_proof: Optional[str] = None
    link_proof: Optional[str] = None
    daily_bonus_awarded: int = 0
    daily_tasks_completed_count: int = 1
    daily_bonus_target: int = 3
    new_wallet_balance: int = 0
    created_at: datetime

