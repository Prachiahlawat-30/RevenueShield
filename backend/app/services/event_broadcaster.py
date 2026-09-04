"""Real-time event broadcaster utilizing Server-Sent Events (SSE) for live UI synchronization."""

import asyncio
import json
import logging
from datetime import datetime, timezone
from typing import Dict, Any, AsyncGenerator, List

logger = logging.getLogger(__name__)


class EventBroadcaster:
    """Manages active SSE subscriber queues and broadcasts real-time recovery lifecycle events."""

    _subscribers: List[asyncio.Queue] = []

    @classmethod
    async def subscribe(cls) -> AsyncGenerator[str, None]:
        """Subscribe a client connection to live SSE events."""
        queue: asyncio.Queue = asyncio.Queue()
        cls._subscribers.append(queue)
        logger.info(f"New SSE client connected. Active subscribers: {len(cls._subscribers)}")

        # Send initial handshake event
        initial_event = {
            "type": "CONNECTED",
            "message": "Connected to RevenueShield Real-Time Event Stream",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        yield f"event: connected\ndata: {json.dumps(initial_event)}\n\n"

        try:
            while True:
                data = await queue.get()
                yield data
        except asyncio.CancelledError:
            pass
        finally:
            if queue in cls._subscribers:
                cls._subscribers.remove(queue)
            logger.info(f"SSE client disconnected. Active subscribers: {len(cls._subscribers)}")

    @classmethod
    def broadcast(cls, event_type: str, data: Dict[str, Any]):
        """Broadcast an event payload to all connected frontend clients."""
        payload = {
            "event": event_type,
            "data": data,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        message = f"event: {event_type}\ndata: {json.dumps(payload)}\n\n"

        # Dispatch non-blocking to all active queues
        dead_queues = []
        for queue in cls._subscribers:
            try:
                queue.put_nowait(message)
            except Exception:
                dead_queues.append(queue)

        for dq in dead_queues:
            if dq in cls._subscribers:
                cls._subscribers.remove(dq)
