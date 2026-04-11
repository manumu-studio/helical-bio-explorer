# ASGI middleware for X-Request-ID (pure ASGI; BaseHTTPMiddleware breaks global exception handlers).

import logging
import uuid

from starlette.datastructures import MutableHeaders
from starlette.types import ASGIApp, Message, Receive, Scope, Send


class RequestIDMiddleware:
    """Assign or propagate X-Request-ID and attach request-scoped logging."""

    def __init__(self, app: ASGIApp) -> None:
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        raw_headers = scope.get("headers") or []
        request_id: str | None = None
        for key, value in raw_headers:
            if key.lower() == b"x-request-id":
                request_id = value.decode("latin-1")
                break
        if request_id is None:
            request_id = str(uuid.uuid4())

        scope.setdefault("state", {})
        scope["state"]["request_id"] = request_id
        scope["state"]["logger"] = logging.LoggerAdapter(
            logging.getLogger("app"),
            {"request_id": request_id},
        )

        async def send_wrapper(message: Message) -> None:
            if message["type"] == "http.response.start":
                headers = MutableHeaders(raw=list(message["headers"]))
                headers["X-Request-ID"] = request_id
                message = {**message, "headers": headers.raw}
            await send(message)

        await self.app(scope, receive, send_wrapper)
