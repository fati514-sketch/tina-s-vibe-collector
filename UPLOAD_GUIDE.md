# 上传说明

这个文件夹：

`/Users/toto9/Downloads/心动藏宝阁/vibe shoting/vibe-collector-upload-ready`

是一份已经整理好的“可上传版本”。

## 这里面的文件

这个文件夹里现在包含的文件，默认都可以上传到 GitHub 或部署平台：

- `index.html`
- `serve.mjs`
- `minimax-client.mjs`
- `package.json`
- `README.md`
- `vercel.json`
- `.gitignore`
- `.env.example`
- `.env.local.example`
- `api/health.mjs`
- `api/analyze.mjs`
- `scripts/check-github-safe.mjs`

## 唯一不要上传的内容

如果你后面自己在这个文件夹里新建了：

- `.env.local`

那它不要上传。

## 使用方式

1. 先把这个文件夹上传到 GitHub
2. 在 Vercel 导入这个仓库
3. 在 Vercel 环境变量里配置：

- `MINIMAX_API_KEY`
- `MINIMAX_MODEL`
- `MINIMAX_ENDPOINT`

4. 部署完成后访问：

- `/api/health`

如果返回 `minimaxConfigured: true`，说明 API 已接通。
