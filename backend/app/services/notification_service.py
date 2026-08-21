import logging
import uuid
from datetime import datetime, timezone
from typing import Optional, List, Dict, Set
from fastapi import WebSocket
from app.database.mongodb import get_database
from app.schemas.notification import NotificationResponse

logger = logging.getLogger("task2cash.services.notification")

class ConnectionManager:
    """Manages active user WebSocket connections."""
    def __init__(self):
        self.active_connections: Dict[str, Set[WebSocket]] = {}

    async def connect(self, user_id: str, websocket: WebSocket):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = set()
        self.active_connections[user_id].add(websocket)
        logger.debug("WebSocket connected for user: %s", user_id)

    def disconnect(self, user_id: str, websocket: WebSocket):
        if user_id in self.active_connections:
            self.active_connections[user_id].discard(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
        logger.debug("WebSocket disconnected for user: %s", user_id)

    async def send_personal_message(self, user_id: str, message: Dict):
        if user_id in self.active_connections:
            dead_sockets = set()
            for connection in self.active_connections[user_id]:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    logger.warning("Error sending WebSocket message: %s", e)
                    dead_sockets.add(connection)
            for dead in dead_sockets:
                self.disconnect(user_id, dead)

ws_manager = ConnectionManager()

class NotificationService:
    @staticmethod
    async def create_notification(
        user_id: str,
        title: str,
        message: str,
        notification_type: str = "SYSTEM",
        action_url: Optional[str] = None
    ) -> NotificationResponse:
        db = get_database()
        notif_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc)

        doc = {
            "_id": notif_id,
            "user_id": user_id,
            "title": title,
            "message": message,
            "type": notification_type,
            "is_read": False,
            "action_url": action_url,
            "created_at": now
        }
        
        await db.notifications.insert_one(doc)

        response = NotificationResponse(
            id=notif_id,
            user_id=user_id,
            title=title,
            message=message,
            type=notification_type,
            is_read=False,
            action_url=action_url,
            created_at=now
        )

        # Broadcast via WebSocket if user is active
        try:
            await ws_manager.send_personal_message(
                user_id,
                {
                    "event": "NOTIFICATION_RECEIVED",
                    "data": response.model_dump(mode="json")
                }
            )
        except Exception as e:
            logger.debug("Could not push live notification via WebSocket: %s", e)

        return response

    @staticmethod
    async def get_user_notifications(user_id: str, limit: int = 30) -> List[NotificationResponse]:
        db = get_database()
        cursor = db.notifications.find({"user_id": user_id}).sort("created_at", -1).limit(limit)
        results = []
        async for doc in cursor:
            results.append(NotificationResponse(
                id=str(doc["_id"]),
                user_id=doc["user_id"],
                title=doc["title"],
                message=doc["message"],
                type=doc.get("type", "SYSTEM"),
                is_read=doc.get("is_read", False),
                action_url=doc.get("action_url"),
                created_at=doc["created_at"]
            ))
        return results

    @staticmethod
    async def mark_as_read(user_id: str, notification_id: str) -> bool:
        db = get_database()
        res = await db.notifications.update_one(
            {"_id": notification_id, "user_id": user_id},
            {"$set": {"is_read": True}}
        )
        return res.modified_count > 0

    @staticmethod
    async def mark_all_as_read(user_id: str) -> int:
        db = get_database()
        res = await db.notifications.update_many(
            {"user_id": user_id, "is_read": False},
            {"$set": {"is_read": True}}
        )
        return res.modified_count

    @staticmethod
    async def get_unread_count(user_id: str) -> int:
        db = get_database()
        return await db.notifications.count_documents({"user_id": user_id, "is_read": False})
