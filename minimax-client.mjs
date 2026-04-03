import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.join(__dirname, ".env.local");

function loadDotEnv() {
  const loaded = {};

  if (!fs.existsSync(envPath)) {
    return loaded;
  }

  const source = fs.readFileSync(envPath, "utf8");
  for (const line of source.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    const value = rawValue.replace(/^['"]|['"]$/g, "");
    loaded[key] = value;
  }

  return loaded;
}

const namedColors = {
  black: "#000000",
  "黑色": "#000000",
  white: "#FFFFFF",
  "白色": "#FFFFFF",
  gray: "#808080",
  "灰色": "#808080",
  grey: "#808080",
  silver: "#C0C0C0",
  "银色": "#C0C0C0",
  ivory: "#FFFFF0",
  beige: "#F5F5DC",
  "米色": "#F5F5DC",
  cream: "#FFFDD0",
  "奶油色": "#FFFDD0",
  taupe: "#483C32",
  brown: "#8B4513",
  "棕色": "#8B4513",
  camel: "#C19A6B",
  tan: "#D2B48C",
  charcoal: "#36454F",
  "炭黑": "#36454F",
  navy: "#000080",
  blush: "#DE5D83",
  pink: "#FFC0CB",
  rose: "#FF007F",
  gold: "#D4AF37",
  "金色": "#D4AF37",
  bronze: "#CD7F32",
};

const analysisSchema = {
  name: "moodboard_analysis",
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      title: {
        type: "string",
        description: "标题，2到5个英文单词。",
      },
      category: {
        type: "string",
        enum: ["时尚", "编辑大片", "日常Vlog", "AI生成"],
      },
      moodDescription: {
        type: "string",
        description: "中文情绪描述，28到55个汉字或接近长度的自然语句。",
      },
      tags: {
        type: "array",
        items: {
          type: "string",
        },
        minItems: 3,
        maxItems: 3,
      },
      palette: {
        type: "array",
        items: {
          type: "string",
          pattern: "^#[0-9A-Fa-f]{6}$",
        },
        minItems: 4,
        maxItems: 4,
      },
    },
    required: ["title", "category", "moodDescription", "tags", "palette"],
  },
};

function normalizeHex(value) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  const named = namedColors[trimmed.toLowerCase()];
  if (named) {
    return named;
  }

  const match = trimmed.match(/^#?([0-9a-fA-F]{6})$/);
  return match ? `#${match[1].toUpperCase()}` : null;
}

function normalizeTags(tags) {
  const safeTags = Array.isArray(tags) ? tags : [];
  const cleaned = safeTags
    .map((tag) => String(tag || "").trim())
    .filter(Boolean)
    .map((tag) => `#${tag.replace(/^#+/, "").replace(/\s+/g, "").replace(/[，,。.!！?？、:：;；"'`“”‘’]/g, "")}`)
    .filter((tag) => tag.length > 1)
    .slice(0, 3);

  while (cleaned.length < 3) {
    cleaned.push(["#静奢", "#低饱和", "#编辑感"][cleaned.length]);
  }

  return cleaned;
}

function normalizePalette(palette) {
  const safePalette = Array.isArray(palette)
    ? palette
    : palette && typeof palette === "object"
      ? Object.values(palette)
      : [];
  const cleaned = safePalette.map(normalizeHex).filter(Boolean).slice(0, 4);

  const fallback = ["#F5F1EA", "#D7CEC3", "#9B948D", "#1C1C1C"];
  while (cleaned.length < 4) {
    cleaned.push(fallback[cleaned.length]);
  }

  return cleaned;
}

function stripThinkBlocks(text) {
  return String(text || "")
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .trim();
}

function extractJson(text) {
  const cleaned = stripThinkBlocks(text);
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace === -1 || lastBrace < firstBrace) {
    throw new Error("MiniMax 返回的不是有效 JSON 内容");
  }

  const parsed = JSON.parse(cleaned.slice(firstBrace, lastBrace + 1));

  if (
    parsed &&
    typeof parsed === "object" &&
    !Array.isArray(parsed) &&
    parsed[analysisSchema.name] &&
    typeof parsed[analysisSchema.name] === "object"
  ) {
    return parsed[analysisSchema.name];
  }

  return parsed;
}

function normalizeCategory(value) {
  const raw = String(value || "").trim().toLowerCase();
  if (!raw) {
    return "编辑大片";
  }

  if (raw.includes("日常") || raw.includes("vlog") || raw.includes("daily") || raw.includes("lifestyle")) {
    return "日常Vlog";
  }

  if (raw.includes("ai") || raw.includes("generated") || raw.includes("synthetic") || raw.includes("生成")) {
    return "AI生成";
  }

  if (raw.includes("fashion") || raw.includes("时尚")) {
    return "时尚";
  }

  if (raw.includes("editor") || raw.includes("大片") || raw.includes("编辑")) {
    return "编辑大片";
  }

  return "编辑大片";
}

function ensureAnalysisShape(data, filename = "") {
  const fallbackTitle = filename
    ? String(filename)
        .replace(/\.[^/.]+$/, "")
        .replace(/[-_]+/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase())
    : "Collected Reference";

  return {
    title: String(data.title || fallbackTitle).trim().slice(0, 64),
    category: normalizeCategory(data.category),
    moodDescription: String(data.moodDescription || "整体画面气质克制，适合作为高级感视觉提案参考。").trim(),
    tags: normalizeTags(data.tags),
    palette: normalizePalette(data.palette),
  };
}

function parseDataUrl(input) {
  const match = String(input || "").match(/^data:(.+);base64,(.+)$/);
  if (!match) {
    throw new Error("无效的图片数据");
  }

  return {
    mimeType: match[1],
    base64: match[2],
  };
}

async function imageUrlToBase64(imageUrl) {
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`图片抓取失败：${response.status}`);
  }

  const mimeType = response.headers.get("content-type") || "image/jpeg";
  const arrayBuffer = await response.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");
  return { mimeType, base64 };
}

function buildPrompt(filename = "") {
  return [
    "你正在为名为 Vibe Collector 的高定极简灵感管理工具分析图片。",
    "请根据图片内容提炼视觉方向，并返回结构化结果。",
    "要求：",
    "- title：保留英文标题，2到5个英文单词，优雅、克制。",
    "- category：只能从 时尚、编辑大片、日常Vlog、AI生成 中选择一个。",
    "- moodDescription：使用中文描述画面情绪与用途，简洁高级。",
    "- tags：输出 3 个中文标签，每个都必须带 #，不要空格。",
    "- palette：输出 4 个从图片中提炼出的高级 HEX 色值。",
    filename ? `- 文件名线索：${filename}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export function getMiniMaxState() {
  const env = {
    ...loadDotEnv(),
    ...process.env,
  };

  return {
    endpoint: env.MINIMAX_ENDPOINT || "https://api.minimaxi.com/v1/text/chatcompletion_v2",
    model: env.MINIMAX_MODEL || "MiniMax-Text-01",
    apiKey: env.MINIMAX_API_KEY || "",
  };
}

export async function analyzeImageWithMiniMax({ imageDataUrl, imageUrl, filename = "" }) {
  const config = getMiniMaxState();

  if (!config.apiKey) {
    throw new Error("MiniMax API Key 未配置");
  }

  const imagePayload = imageDataUrl ? parseDataUrl(imageDataUrl) : await imageUrlToBase64(imageUrl);
  const prompt = `${buildPrompt(filename)}\n图片输入：[图片base64:${imagePayload.base64}]`;

  const payload = {
    model: config.model,
    messages: [
      {
        role: "system",
        name: "MiniMax AI",
        content: "你是一名审美准确、表达克制的视觉分析助手。",
      },
      {
        role: "user",
        name: "用户",
        content: prompt,
      },
    ],
    temperature: 0.2,
    max_completion_tokens: 900,
    response_format: {
      type: "json_schema",
      json_schema: analysisSchema,
    },
  };

  const response = await fetch(config.endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const rawText = await response.text();
  if (!response.ok) {
    throw new Error(`MiniMax request failed: ${response.status} ${rawText.slice(0, 300)}`);
  }

  let parsedResponse;
  try {
    parsedResponse = JSON.parse(rawText);
  } catch (error) {
    throw new Error("MiniMax 返回了无效的响应 JSON");
  }

  const content = parsedResponse?.choices?.[0]?.message?.content;
  const structured = ensureAnalysisShape(extractJson(content), filename);

  return {
    ...structured,
    provider: "MiniMax",
    model: config.model,
    analyzedAt: new Date().toISOString(),
  };
}
