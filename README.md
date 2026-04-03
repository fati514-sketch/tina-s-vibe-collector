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

## 3. Netlify 部署教程

这个项目已经整理成可直接部署到 Netlify 的结构：

- 首页是根目录的 `index.html`
- 服务端接口逻辑在 `api/health.mjs` 和 `api/analyze.mjs`
- Netlify 入口函数在 `netlify/functions/health.mjs` 和 `netlify/functions/analyze.mjs`
- `netlify.toml` 已经把 `/api/health` 和 `/api/analyze` 重写到 Netlify Functions

### 第一步：上传到 GitHub

先在本地运行：

```bash
npm run check:github
```

确认通过后，再把项目推到 GitHub。

### 第二步：在 Netlify 导入仓库

1. 打开 Netlify 控制台
2. 点击 `Add new site`
3. 选择 `Import an existing project`
4. 选择 `GitHub`
5. 授权 Netlify 访问你的仓库
6. 选择你刚上传的项目仓库

### 第三步：构建设置怎么填

这个项目已经带有 `netlify.toml`，大多数设置会自动识别。

如果 Netlify 页面需要你手动确认，按下面填写：

- Base directory：留空
- Build command：留空
- Publish directory：留空
- Functions directory：留空

说明：

- `netlify.toml` 已经指定了 functions 目录
- 首页文件就是根目录的 `index.html`

### 第四步：配置环境变量

在 Netlify 后台添加这 3 个环境变量：

- `MINIMAX_API_KEY`：你的真实 MiniMax Key
- `MINIMAX_MODEL`：`MiniMax-Text-01`
- `MINIMAX_ENDPOINT`：`https://api.minimaxi.com/v1/text/chatcompletion_v2`

### 第五步：点击部署

点击 `Deploy site`，等待部署完成。

### 第六步：部署后验证

先打开：

```bash
https://你的域名/api/health
```

如果返回里有：

```json
{
  "ok": true,
  "minimaxConfigured": true
}
```

说明环境变量和函数都已经生效。

然后再打开首页，上传一张图片测试 MiniMax 是否正常返回中文分析。

### 第七步：以后怎么更新

以后你只需要：

1. 本地改代码
2. 推送到 GitHub
3. Netlify 会自动重新部署

## 4. 仓库建议上传这些文件

- `index.html`
- `serve.mjs`
- `minimax-client.mjs`
- `api/health.mjs`
- `api/analyze.mjs`
- `netlify.toml`
- `netlify/functions/health.mjs`
- `netlify/functions/analyze.mjs`
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
