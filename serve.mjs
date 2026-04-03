import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { analyzeImageWithMiniMax, getMiniMaxState } from "./minimax-client.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const host = "127.0.0.1";
const port = Number(process.env.PORT || 4173);
const maxBodySize = 14 * 1024 * 1024;

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".webp": "image/webp",
};

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(payload));
}

function sendText(res, statusCode, body) {
  res.writeHead(statusCode, {
    "Content-Type": "text/plain; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(body);
}

async function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > maxBodySize) {
        reject(new Error("请求体过大"));
        req.destroy();
      }
    });

    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(new Error("无效的 JSON 请求体"));
      }
    });

    req.on("error", reject);
  });
}

async function handleAnalyze(req, res) {
  const minimax = getMiniMaxState();

  if (!minimax.apiKey) {
    sendJson(res, 503, {
      error: "未检测到 MiniMax API Key，请先在 .env.local 中完成配置。",
    });
    return;
  }

  const body = await readJsonBody(req);
  const { imageUrl, imageDataUrl, filename } = body;

  if (!imageUrl && !imageDataUrl) {
    sendJson(res, 400, {
      error: "请提供 imageUrl 或 imageDataUrl。",
    });
    return;
  }

  const analysis = await analyzeImageWithMiniMax({
    imageUrl,
    imageDataUrl,
    filename,
  });

  sendJson(res, 200, analysis);
}

async function handleHealth(_req, res) {
  const minimax = getMiniMaxState();
  sendJson(res, 200, {
    ok: true,
    minimaxConfigured: Boolean(minimax.apiKey),
    model: minimax.model,
    endpoint: minimax.endpoint,
  });
}

async function handleStatic(req, res) {
  const urlPath = new URL(req.url || "/", `http://${host}:${port}`).pathname;
  const relativePath = urlPath === "/" ? "/index.html" : urlPath;
  const safePath = path.normalize(relativePath).replace(/^(\.\.[/\\])+/, "");
  const filePath = path.join(__dirname, safePath);

  const data = await fs.readFile(filePath);
  const ext = path.extname(filePath).toLowerCase();
  res.writeHead(200, {
    "Content-Type": mimeTypes[ext] || "application/octet-stream",
    "Cache-Control": "no-store",
  });
  res.end(data);
}

const server = http.createServer(async (req, res) => {
  try {
    const pathname = new URL(req.url || "/", `http://${host}:${port}`).pathname;

    if (req.method === "GET" && pathname === "/api/health") {
      await handleHealth(req, res);
      return;
    }

    if (req.method === "POST" && pathname === "/api/analyze") {
      await handleAnalyze(req, res);
      return;
    }

    if (req.method !== "GET" && req.method !== "HEAD") {
      sendText(res, 405, "请求方法不被允许");
      return;
    }

    await handleStatic(req, res);
  } catch (error) {
    if (error && error.code === "ENOENT") {
      sendText(res, 404, "未找到资源");
      return;
    }

    if (error instanceof Error && error.message === "请求体过大") {
      sendJson(res, 413, { error: error.message });
      return;
    }

    console.error(error);
    sendJson(res, 500, {
      error: error instanceof Error ? error.message : "服务器内部错误",
    });
  }
});

server.listen(port, host, () => {
  console.log(`Vibe Collector running at http://${host}:${port}`);
});
