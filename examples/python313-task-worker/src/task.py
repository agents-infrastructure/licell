from __future__ import annotations

import json
import os
import time
from typing import Any


def _to_dict(event: Any) -> dict[str, Any]:
    if isinstance(event, dict):
        return event
    if isinstance(event, str):
        try:
            parsed = json.loads(event)
            if isinstance(parsed, dict):
                return parsed
        except Exception:
            return {"raw": event}
    return {}


def _clamp_sleep_ms(value: Any) -> int:
    try:
        parsed = int(value)
    except Exception:
        return 0
    if parsed <= 0:
        return 0
    return min(parsed, 120000)


def handler(event: Any, context: Any):
    payload = _to_dict(event)
    job = payload.get("job") if isinstance(payload.get("job"), str) and str(payload.get("job")).strip() else "demo-job"
    mode = payload.get("mode") if isinstance(payload.get("mode"), str) else "ok"
    attempt_value = payload.get("attempt", 1)
    try:
        attempt = int(attempt_value)
    except Exception:
        attempt = 1
    sleep_ms = _clamp_sleep_ms(payload.get("sleepMs", 0))
    metadata = payload.get("metadata") if isinstance(payload.get("metadata"), dict) else {}

    if mode == "sleep" and sleep_ms > 0:
        time.sleep(sleep_ms / 1000.0)

    return {
        "ok": True,
        "service": "python313-task-worker",
        "runtime": os.getenv("LICELL_FC_RUNTIME") or os.getenv("FC_RUNTIME") or os.getenv("RUNTIME") or "python3.13",
        "job": job,
        "mode": mode,
        "attempt": attempt,
        "sleepMs": sleep_ms,
        "metadata": metadata,
        "now": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }
