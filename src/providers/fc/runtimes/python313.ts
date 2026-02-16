import * as $FC from '@alicloud/fc20230330';
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { preparePythonEntrypoint } from '../runtime';
import { preparePython313RuntimeInCode } from '../../../utils/python313-runtime';
import type { RuntimeHandler, ResolvedRuntimeConfig } from '../runtime-handler';

const CUSTOM_FC_RUNTIME = 'custom.debian12';
const BOOTSTRAP_PATH = '.licell/python313-bootstrap.py';
const PORT = 9000;

function createBootstrap(outdir: string, entryFileInCode: string) {
  const bootstrapPath = join(outdir, BOOTSTRAP_PATH);
  mkdirSync(join(outdir, '.licell'), { recursive: true });
  const entryPath = `/code/${entryFileInCode.replace(/\\/g, '/')}`;
  const source = `#!/usr/bin/env python3
import asyncio
import importlib.util
import json
import os
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse, parse_qs

ENTRY_PATH = ${JSON.stringify(entryPath)}
CODE_ROOT = "/code"

if CODE_ROOT not in sys.path:
  sys.path.insert(0, CODE_ROOT)
entry_parent = os.path.dirname(ENTRY_PATH)
if entry_parent and entry_parent not in sys.path:
  sys.path.insert(0, entry_parent)

spec = importlib.util.spec_from_file_location("licell_entry_module", ENTRY_PATH)
if spec is None or spec.loader is None:
  raise RuntimeError(f"无法加载 Python 入口文件: {ENTRY_PATH}")
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
handler = getattr(module, "handler", None)
if not callable(handler):
  raise RuntimeError("Python 入口文件必须包含可调用的 handler(event, context) 函数")

def _json_bytes(payload):
  return json.dumps(payload, ensure_ascii=False).encode("utf-8")

def _normalize_event(method, path, headers, body_bytes, source_ip):
  parsed = urlparse(path)
  query_params = {k: (v[-1] if v else "") for k, v in parse_qs(parsed.query, keep_blank_values=True).items()}
  return {
    "path": parsed.path,
    "rawPath": parsed.path,
    "rawQueryString": parsed.query,
    "httpMethod": method,
    "headers": headers,
    "queryParameters": query_params,
    "body": body_bytes.decode("utf-8", errors="replace"),
    "isBase64Encoded": False,
    "requestContext": {
      "http": {
        "method": method,
        "path": parsed.path,
        "sourceIp": source_ip or ""
      }
    }
  }

def _normalize_response(result):
  if isinstance(result, dict) and "statusCode" in result:
    status = int(result.get("statusCode", 200) or 200)
    headers = result.get("headers") if isinstance(result.get("headers"), dict) else {}
    body = result.get("body")
    if body is None:
      return status, headers, b""
    if isinstance(body, (bytes, bytearray)):
      return status, headers, bytes(body)
    if isinstance(body, str):
      return status, headers, body.encode("utf-8")
    response_headers = {"content-type": "application/json; charset=utf-8", **headers}
    return status, response_headers, _json_bytes(body)

  if result is None:
    return 204, {}, b""
  if isinstance(result, (bytes, bytearray)):
    return 200, {}, bytes(result)
  if isinstance(result, str):
    return 200, {}, result.encode("utf-8")
  return 200, {"content-type": "application/json; charset=utf-8"}, _json_bytes(result)

class RequestHandler(BaseHTTPRequestHandler):
  def _handle(self):
    content_length = int(self.headers.get("content-length") or 0)
    body = self.rfile.read(content_length) if content_length > 0 else b""
    headers = {k: v for k, v in self.headers.items()}
    source_ip = self.client_address[0] if self.client_address else ""
    event = _normalize_event(self.command, self.path, headers, body, source_ip)
    try:
      result = handler(event, {})
      if asyncio.iscoroutine(result):
        result = asyncio.run(result)
      status, out_headers, out_body = _normalize_response(result)
    except Exception as error:
      status = 500
      out_headers = {"content-type": "application/json; charset=utf-8"}
      out_body = _json_bytes({"error": str(error)})

    self.send_response(status)
    for key, value in out_headers.items():
      if value is None:
        continue
      self.send_header(str(key), str(value))
    self.end_headers()
    if out_body:
      self.wfile.write(out_body)

  def do_GET(self): self._handle()
  def do_POST(self): self._handle()
  def do_PUT(self): self._handle()
  def do_PATCH(self): self._handle()
  def do_DELETE(self): self._handle()
  def do_HEAD(self): self._handle()
  def do_OPTIONS(self): self._handle()

  def log_message(self, _format, *_args):
    return

if __name__ == "__main__":
  port = int(os.getenv("FC_SERVER_PORT", os.getenv("PORT", "${PORT}")))
  server = ThreadingHTTPServer(("0.0.0.0", port), RequestHandler)
  server.serve_forever()
`;
  writeFileSync(bootstrapPath, source);
  return BOOTSTRAP_PATH;
}

export const python313Handler: RuntimeHandler = {
  name: 'python3.13',
  defaultEntry: 'src/main.py',
  unsupportedMessage: '当前地域暂不支持 runtime=python3.13。请改用 nodejs20，或确认 custom.debian12（含 python3.13）在目标地域可用后重试。',

  async prepareBootFile(entryFile: string, outdir: string) {
    return preparePythonEntrypoint(entryFile, outdir, 'python3.13');
  },

  async resolveConfig(outdir: string, bootFile: string): Promise<ResolvedRuntimeConfig> {
    const handler = `${bootFile.replace(/\.[^.]+$/, '').replace(/\//g, '.')}.handler`;
    const runtimeArtifact = await preparePython313RuntimeInCode(outdir);
    const bootstrapPath = createBootstrap(outdir, bootFile).replace(/\\/g, '/');
    return {
      runtime: CUSTOM_FC_RUNTIME,
      handler,
      customRuntimeConfig: new $FC.CustomRuntimeConfig({
        command: [runtimeArtifact.pythonBinaryInCode],
        args: [`/code/${bootstrapPath}`],
        port: PORT
      })
    };
  }
};
