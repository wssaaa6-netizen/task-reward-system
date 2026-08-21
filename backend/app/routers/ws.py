import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from app.core.security import decode_token
from app.services.notification_service import ws_manager

logger = logging.getLogger("task2cash.websocket")

router = APIRouter(tags=["WebSocket"])

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, token: str = Query(...)):
    payload = decode_token(token)
    if not payload or not payload.get("sub"):
        await websocket.close(code=4001, reason="Unauthorized")
        return

    user_id = payload.get("sub")
    await ws_manager.connect(user_id, websocket)

    try:
        # Send initial connection confirmation
        await websocket.send_json({
            "event": "CONNECTED",
            "message": "Connected to Task2Cash real-time feed."
        })
        while True:
            # Keep socket alive and accept ping/pong
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        ws_manager.disconnect(user_id, websocket)
    except Exception as e:
        logger.warning("WebSocket connection error: %s", e)
        ws_manager.disconnect(user_id, websocket)
