import base64
import json
import os
import time
from typing import Any
from urllib.parse import urlencode

from flask import Flask, jsonify, request

app = Flask(__name__)
START_TIME = time.time()

TODOS = [
    {
        "id": "todo-1",
        "title": "Read Licell docs",
        "done": True,
        "priority": "medium",
        "createdAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    },
    {
        "id": "todo-2",
        "title": "Deploy this example to FC",
        "done": False,
        "priority": "high",
        "createdAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    },
]


def runtime_name() -> str:
    return (
        os.getenv("LICELL_FC_RUNTIME")
        or os.getenv("FC_RUNTIME")
        or os.getenv("RUNTIME")
        or "python3.13"
    )


def region_name() -> str:
    return (
        os.getenv("LICELL_REGION")
        or os.getenv("ALI_REGION")
        or os.getenv("FC_REGION")
        or os.getenv("REGION")
        or "unknown"
    )


def parse_priority(value: Any) -> str:
    if value in ("low", "medium", "high"):
        return value
    return "medium"


@app.route("/", methods=["GET"])
def index():
    return jsonify(
        {
            "ok": True,
            "service": "licell-python313-flask-api",
            "framework": "flask",
            "runtime": runtime_name(),
            "endpoints": [
                "GET /healthz",
                "GET /meta",
                "GET /echo?message=",
                "GET /todos",
                "POST /todos",
                "PATCH /todos/<id>/toggle",
                "POST /math/sum",
            ],
        }
    )


@app.route("/healthz", methods=["GET"])
def healthz():
    return jsonify(
        {
            "ok": True,
            "now": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "uptimeSec": int(time.time() - START_TIME),
            "framework": "flask",
            "runtime": runtime_name(),
        }
    )


@app.route("/meta", methods=["GET"])
def meta():
    return jsonify(
        {
            "ok": True,
            "framework": "flask",
            "runtime": runtime_name(),
            "region": region_name(),
            "appName": os.getenv("LICELL_APP_NAME") or os.getenv("APP_NAME") or "unknown",
        }
    )


@app.route("/echo", methods=["GET"])
def echo():
    message = request.args.get("message", "hello-from-flask")
    return jsonify(
        {
            "ok": True,
            "message": message,
            "method": request.method,
            "path": request.path,
            "query": request.args.to_dict(flat=True),
        }
    )


@app.route("/todos", methods=["GET"])
def list_todos():
    done_arg = request.args.get("done")
    if done_arg is None:
        items = TODOS
    elif done_arg == "true":
        items = [item for item in TODOS if item["done"]]
    elif done_arg == "false":
        items = [item for item in TODOS if not item["done"]]
    else:
        return jsonify({"ok": False, "error": "done must be true or false"}), 400

    return jsonify({"ok": True, "total": len(items), "items": items})


@app.route("/todos", methods=["POST"])
def create_todo():
    payload = request.get_json(silent=True) or {}
    title = str(payload.get("title", "")).strip()
    if not title:
        return jsonify({"ok": False, "error": "title is required"}), 400
    if len(title) > 120:
        return jsonify({"ok": False, "error": "title is too long"}), 400

    todo = {
        "id": f"todo-{int(time.time() * 1000)}",
        "title": title,
        "done": False,
        "priority": parse_priority(payload.get("priority")),
        "createdAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }
    TODOS.insert(0, todo)
    return jsonify({"ok": True, "item": todo, "total": len(TODOS)}), 201


@app.route("/todos/<todo_id>/toggle", methods=["PATCH"])
def toggle_todo(todo_id: str):
    for item in TODOS:
        if item["id"] == todo_id:
            item["done"] = not item["done"]
            return jsonify({"ok": True, "item": item})
    return jsonify({"ok": False, "error": "todo not found"}), 404


@app.route("/math/sum", methods=["POST"])
def math_sum():
    payload = request.get_json(silent=True) or {}
    numbers = payload.get("numbers")
    if not isinstance(numbers, list) or len(numbers) == 0:
        return jsonify({"ok": False, "error": "numbers must be a non-empty array"}), 400
    if len(numbers) > 100:
        return jsonify({"ok": False, "error": "numbers array is too large"}), 400

    normalized = []
    for value in numbers:
        try:
            normalized.append(float(value))
        except (TypeError, ValueError):
            return jsonify({"ok": False, "error": "numbers must contain only numeric values"}), 400

    total = sum(normalized)
    return jsonify(
        {
            "ok": True,
            "count": len(normalized),
            "sum": total,
            "average": total / len(normalized),
        }
    )


def _to_dict(event: Any) -> dict[str, Any]:
    if isinstance(event, dict):
        return event
    if isinstance(event, str):
        try:
            parsed = json.loads(event)
            if isinstance(parsed, dict):
                return parsed
        except json.JSONDecodeError:
            return {}
    return {}


def _extract_method(event: dict[str, Any]) -> str:
    method = event.get("httpMethod")
    if isinstance(method, str):
        return method.upper()

    request_context = event.get("requestContext")
    if isinstance(request_context, dict):
        http_obj = request_context.get("http")
        if isinstance(http_obj, dict):
            http_method = http_obj.get("method")
            if isinstance(http_method, str):
                return http_method.upper()

    return "GET"


def _extract_path(event: dict[str, Any]) -> str:
    for key in ("path", "rawPath"):
        value = event.get(key)
        if isinstance(value, str) and value:
            return value

    request_context = event.get("requestContext")
    if isinstance(request_context, dict):
        http_obj = request_context.get("http")
        if isinstance(http_obj, dict):
            http_path = http_obj.get("path")
            if isinstance(http_path, str) and http_path:
                return http_path

    return "/"


def _extract_query(event: dict[str, Any]) -> str:
    raw_query = event.get("rawQueryString")
    if isinstance(raw_query, str):
        return raw_query

    query_params = event.get("queryParameters")
    if isinstance(query_params, dict):
        normalized = {str(k): str(v) for k, v in query_params.items() if v is not None}
        return urlencode(normalized)

    return ""


def _extract_headers(event: dict[str, Any]) -> dict[str, str]:
    headers = event.get("headers")
    if not isinstance(headers, dict):
        return {}
    return {str(k): str(v) for k, v in headers.items() if v is not None}


def _extract_body(event: dict[str, Any]) -> bytes:
    body = event.get("body")
    if body is None:
        return b""

    is_base64 = event.get("isBase64Encoded") is True
    if isinstance(body, str):
        return base64.b64decode(body) if is_base64 else body.encode("utf-8")

    if isinstance(body, (dict, list)):
        return json.dumps(body, ensure_ascii=False).encode("utf-8")

    return str(body).encode("utf-8")


def handler(event: Any, context: Any):
    data = _to_dict(event)
    method = _extract_method(data)
    path = _extract_path(data)
    query = _extract_query(data)
    headers = _extract_headers(data)
    body = _extract_body(data)

    if body and "content-type" not in {k.lower() for k in headers.keys()}:
        headers["content-type"] = "application/json; charset=utf-8"

    full_path = path if not query else f"{path}?{query}"

    with app.test_client() as client:
        response = client.open(path=full_path, method=method, headers=headers, data=body)

    out_headers = {k: v for k, v in response.headers.items() if k.lower() not in {"content-length", "server", "date"}}
    return {
        "statusCode": response.status_code,
        "headers": out_headers,
        "body": response.get_data(as_text=True),
    }


if __name__ == "__main__":
    port = int(os.getenv("PORT", "9000"))
    app.run(host="0.0.0.0", port=port)
