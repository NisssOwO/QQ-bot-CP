import { chunkMarkdown } from './response-chunker.mjs';

function timeoutError(ms) {
  const error = new Error(`模型调用超时（${ms}ms）`);
  error.code = 'MODEL_TIMEOUT';
  return error;
}

/**
 * DSH 运行时的最小抽象。
 * 真实环境由 dsh-qqbot 的 ctx.agents 提供 send/followup；测试环境注入 sendPrompt。
 */
export class DshSessionAdapter {
  constructor({ sendPrompt, chunkLimit = 4500, promptTimeoutMs = 120000 } = {}) {
    if (typeof sendPrompt !== 'function') throw new TypeError('sendPrompt 必须是函数');
    this.sendPrompt = sendPrompt;
    this.chunkLimit = chunkLimit;
    this.promptTimeoutMs = Number.isFinite(promptTimeoutMs) && promptTimeoutMs > 0 ? promptTimeoutMs : 120000;
  }

  async prompt(task, { signal } = {}) {
    if (!task?.sessionKey || !task.text) return { ok: false, chunks: [], reason: 'empty-task' };
    const controller = new AbortController();
    const onAbort = () => controller.abort(signal.reason);
    if (signal) {
      if (signal.aborted) return { ok: false, chunks: [], reason: 'cancelled' };
      signal.addEventListener('abort', onAbort, { once: true });
    }
    const timeout = setTimeout(() => controller.abort(timeoutError(this.promptTimeoutMs)), this.promptTimeoutMs);
    try {
      const result = await this.sendPrompt({
        sessionKey: task.sessionKey,
        preset: task.role?.id,
        text: task.text,
        message: task.message,
        signal: controller.signal,
      });
      const text = typeof result === 'string' ? result : String(result?.text ?? '');
      return { ok: true, chunks: chunkMarkdown(text, { limit: this.chunkLimit }), raw: result };
    } catch (error) {
      if (controller.signal.aborted) {
        const reason = controller.signal.reason;
        if (reason?.code === 'MODEL_TIMEOUT') return { ok: false, chunks: [], reason: 'timeout', error: reason };
        return { ok: false, chunks: [], reason: 'cancelled', error: reason ?? error };
      }
      return { ok: false, chunks: [], reason: 'error', error };
    } finally {
      clearTimeout(timeout);
      signal?.removeEventListener('abort', onAbort);
    }
  }
}
