# Python 3.13 + Flask API Example

这个示例演示如何在 `python3.13` runtime 下，用 Flask 实现完整 API 并通过 `licell` 部署。

## 功能

- `GET /healthz` 健康检查
- `GET /meta` 运行时信息
- `GET /echo?message=...` 回显请求
- `GET /todos` 列表（支持 `?done=true|false`）
- `POST /todos` 新增 Todo
- `PATCH /todos/<id>/toggle` 切换状态
- `POST /math/sum` 计算数组求和/平均值

## 本地运行

```bash
cd examples/python313-flask-api
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python src/main.py
```

## 部署（Licell）

```bash
cd examples/python313-flask-api
licell login
licell deploy --type api --runtime python3.13 --entry src/main.py --target preview
```

如果你已在 `.licell/project.json` 固定 runtime，也可以简化为：

```bash
licell deploy --type api --entry src/main.py --target preview
```
