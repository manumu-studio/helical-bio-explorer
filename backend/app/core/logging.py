# Configure process-wide logging with JSON output in production and plain text in development.

import json
import logging
import sys
from logging import StreamHandler
from typing import Any


class JSONFormatter(logging.Formatter):
    """Serialize log records as single-line JSON for structured log sinks."""

    def format(self, record: logging.LogRecord) -> str:
        payload: dict[str, Any] = {
            "level": record.levelname,
            "msg": record.getMessage(),
            "logger": record.name,
            "time": self.formatTime(record, self.datefmt),
        }
        if hasattr(record, "request_id"):
            payload["request_id"] = record.request_id
        return json.dumps(payload, ensure_ascii=False)


def setup_logging(level: str, env: str) -> None:
    """Attach a single stdout handler with an environment-appropriate formatter."""

    root = logging.getLogger()
    root.handlers.clear()
    handler = StreamHandler(sys.stdout)
    if env == "prod":
        handler.setFormatter(JSONFormatter())
    else:
        handler.setFormatter(
            logging.Formatter("%(asctime)s %(levelname)s [%(name)s] %(message)s"),
        )
    root.addHandler(handler)
    root.setLevel(level)
