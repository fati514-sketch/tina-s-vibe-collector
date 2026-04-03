import { analyzeImageWithMiniMax, getMiniMaxState } from "../minimax-client.mjs";

export default async function handler(request) {
  try {
    const minimax = getMiniMaxState();

    if (!minimax.apiKey) {
      return Response.json(
        {
          error: "未检测到 MiniMax API Key，请先在 Vercel 环境变量中配置 MINIMAX_API_KEY。",
        },
        { status: 503 }
      );
    }

    const body = await request.json().catch(() => null);
    if (!body) {
      return Response.json(
        {
          error: "无效的 JSON 请求体。",
        },
        { status: 400 }
      );
    }

    const { imageUrl, imageDataUrl, filename } = body;
    if (!imageUrl && !imageDataUrl) {
      return Response.json(
        {
          error: "请提供 imageUrl 或 imageDataUrl。",
        },
        { status: 400 }
      );
    }

    const analysis = await analyzeImageWithMiniMax({
      imageUrl,
      imageDataUrl,
      filename,
    });

    return Response.json(analysis);
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : "服务器内部错误",
      },
      { status: 500 }
    );
  }
}
