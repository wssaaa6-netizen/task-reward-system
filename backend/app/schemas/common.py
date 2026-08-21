from typing import Generic, TypeVar, Optional, Any, List
from pydantic import BaseModel, Field

T = TypeVar("T")

class APIResponse(BaseModel, Generic[T]):
    success: bool = True
    message: str = "Operation completed successfully"
    data: Optional[T] = None
    error_code: Optional[str] = None

class PaginatedData(BaseModel, Generic[T]):
    items: List[T] = []
    total: int = 0
    page: int = 1
    limit: int = 20
    pages: int = 1
