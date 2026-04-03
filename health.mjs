import { getMiniMaxState } from "../minimax-client.mjs";

export default async function handler(_request) {
  const minimax = getMiniMaxState();

  return Response.json({
    ok: true,
    minimaxConfigured: Boolean(minimax.apiKey),
    model: minimax.model,
    endpoint: minimax.endpoint,
  });
}
