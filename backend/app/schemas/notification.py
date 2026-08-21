from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel

class NotificationResponse(BaseModel):
    id: str
    user_id: str
    title: str
    message: str
    type: str  # EARNING, TASK, QUIZ, REWARD, STREAK, SYSTEM, ACHIEVEMENT, FRAUD
    is_read: bool = False
    action_url: Optional[str] = None
    created_at: datetime

class NotificationCreate(BaseModel):
    user_id: str
    title: str
    message: str
    type: str = "SYSTEM"
    action_url: Optional[str] = None
