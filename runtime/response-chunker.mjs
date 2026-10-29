/** 将 DSH 文本回复切成 QQ Bot 可发送的消息块。 */
export function chunkResponse(text, { limit = 4500 } = {}) {
  const input = String(text ?? '');
  if (!input) return [];
  const max = Math.max(1, Number(limit) || 4500);
  const chunks = [];
  let rest = input;
  while (rest.length > max) {
    let cut = rest.lastIndexOf('\n\n', max);
    if (cut < Math.floor(max * 0.35)) cut = rest.lastIndexOf('\n', max);
    if (cut < Math.floor(max * 0.35)) cut = rest.lastIndexOf(' ', max);
    if (cut < Math.floor(max * 0.35)) cut = max;
    chunks.push(rest.slice(0, cut).trimEnd());
    rest = rest.slice(cut).trimStart();
  }
  if (rest) chunks.push(rest);
  return chunks;
}

export function chunkMarkdown(text, options = {}) {
  const chunks = chunkResponse(text, options);
  // 避免把三反引号围栏拆开：给后续块补上围栏，保持 QQ Markdown 可渲染。
  let inFence = false;
  return chunks.map((chunk, index) => {
    const fences = (chunk.match(/^\s*```/gm) ?? []).length;
    const prefix = inFence ? '```\n' : '';
    inFence = (inFence !== (fences % 2 === 1));
    const suffix = inFence && index < chunks.length - 1 ? '\n```' : '';
    return prefix + chunk + suffix;
  });
}
