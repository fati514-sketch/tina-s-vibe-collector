# Vibe Collector

高定极简风格的单页灵感策展应用，支持：

- 瀑布流灵感画廊
- 中文界面与中文 AI 分析结果
- MiniMax 图片分析
- 本地上传图片并生成标签、情绪描述、色卡
- PDF 简报导出

## 1. 适合上传 GitHub 的方式

这个项目已经做过 GitHub 安全整理：

- 真实 API Key 只放在 `.env.local`
- `.env.local` 已被 `.gitignore` 忽略
- 仓库里保留的是公开可上传的模板文件 `.env.example` 和 `.env.local.example`
- 可以在上传前运行安全检查脚本，确认没有把密钥误传进去

上传前建议先执行：

```bash
npm run check:github
```

如果输出：

```bash
检查通过：当前仓库未发现明显的 MiniMax 密钥泄漏。
```

就可以放心上传。

## 2. 本地运行

先复制环境变量模板：

```bash
cp .env.local.example .env.local
```

然后在 `.env.local` 中填入你自己的 MiniMax Key：

```env
MINIMAX_API_KEY=你的真实密钥
MINIMAX_MODEL=MiniMax-Text-01
MINIMAX_ENDPOINT=https://api.minimaxi.com/v1/text/chatcompletion_v2
```

启动项目：

```bash
npm run dev
```

浏览器打开：

```bash
http://127.0.0.1:4173
```

## 3. Vercel 部署教程

这个项目已经整理成可直接部署到 Vercel 的结构：

- 首页是根目录的 `index.html`
- 服务端接口是 `api/health.mjs` 和 `api/analyze.mjs`
- MiniMax Key 不写死在前端，走 Vercel 服务端环境变量

### 第一步：上传到 GitHub

先在本地运行：

```bash
npm run check:github
```

确认通过后，再把项目推到 GitHub。

### 第二步：在 Vercel 导入仓库

1. 打开 Vercel 控制台
2. 点击 `Add New...`
3. 选择 `Project`
4. 选择你的 GitHub 仓库
5. 点击 `Import`

### 第三步：配置环境变量

在 Vercel 项目的环境变量里添加这 3 个值：

- `MINIMAX_API_KEY`：填你的真实 MiniMax Key
- `MINIMAX_MODEL`：`MiniMax-Text-01`
- `MINIMAX_ENDPOINT`：`https://api.minimaxi.com/v1/text/chatcompletion_v2`

建议添加到：

- `Production`
- `Preview`
- `Development`

### 第四步：直接部署

这个项目不需要额外改构建命令，直接部署即可。

如果 Vercel 让你填写，可以这样设置：

- Build Command：留空
- Output Directory：留空
- Install Command：留空

然后点击 `Deploy`。

### 第五步：部署后验证

部署完成后，先打开：

```bash
https://你的域名/api/health
```

如果看到：

```json
{
  "ok": true,
  "minimaxConfigured": true
}
```

说明你的环境变量已经生效。

接着再打开首页，上传一张图片测试。

### 第六步：以后如何更新

以后你只需要：

1. 修改本地代码
2. 推送到 GitHub
3. Vercel 会自动重新部署

### 可选：用 Vercel CLI 本地联调

如果你想完全模拟线上环境，可以安装并登录 Vercel CLI：

```bash
npm i -g vercel
vercel login
vercel
```

如果已经绑过项目，后续可以用：

```bash
vercel --prod
```

## 4. 仓库建议上传这些文件

- `index.html`
- `serve.mjs`
- `minimax-client.mjs`
- `api/health.mjs`
- `api/analyze.mjs`
- `vercel.json`
- `package.json`
- `.gitignore`
- `.env.example`
- `.env.local.example`
- `README.md`
- `scripts/check-github-safe.mjs`

## 5. 不要上传这些文件

- `.env.local`
- 任何包含真实 API Key 的文件
- 本地缓存或临时文件
