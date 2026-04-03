import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const ignoredNames = new Set([
  ".git",
  "node_modules",
]);

const ignoredFiles = new Set([
  ".env.local",
]);

const binaryExtensions = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".ico",
  ".pdf",
  ".zip",
  ".tar",
  ".gz",
  ".doc",
  ".docx",
]);

const findings = [];

function walk(dirPath) {
  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    if (ignoredNames.has(entry.name)) {
      continue;
    }

    const fullPath = path.join(dirPath, entry.name);
    const relativePath = path.relative(root, fullPath);

    if (relativePath === path.join("scripts", "check-github-safe.mjs")) {
      continue;
    }

    if (entry.isDirectory()) {
      walk(fullPath);
      continue;
    }

    if (ignoredFiles.has(entry.name)) {
      continue;
    }

    if (binaryExtensions.has(path.extname(entry.name).toLowerCase())) {
      continue;
    }

    const content = fs.readFileSync(fullPath, "utf8");

    const secretPatterns = [
      /sk-api-[A-Za-z0-9_\-]{20,}/g,
      /MINIMAX_API_KEY\s*=\s*sk-api-[A-Za-z0-9_\-]{20,}/g,
      /Bearer\s+sk-api-[A-Za-z0-9_\-]{20,}/g,
    ];

    for (const pattern of secretPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        findings.push({
          file: relativePath,
          sample: matches[0],
        });
      }
    }
  }
}

walk(root);

if (findings.length) {
  console.error("发现疑似敏感信息，当前版本不适合直接上传到 GitHub：");
  for (const finding of findings) {
    console.error(`- ${finding.file}: ${finding.sample.slice(0, 60)}`);
  }
  process.exit(1);
}

console.log("检查通过：当前仓库未发现明显的 MiniMax 密钥泄漏。");
