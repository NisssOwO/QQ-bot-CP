/**
 * 官方 Bot 适配层通用保护逻辑。
 * 不依赖 OneBot；事件对象只需要提供 message_id/msg_id、msg_seq 和内容。
 */

export class MessageDeduplicator {
  constructor({ ttlMs = 10 * 60 * 1000, maxEntries = 10000, now = () => Date.now() } = {}) {
    this.ttlMs = ttlMs;
    this.maxEntries = maxEntries;
    this.now = now;
    this.seen = new Map();
  }

  keyOf(event) {
    const id = event?.messageId ?? event?.message_id ?? event?.msg_id ?? '';
    const seq = event?.seq ?? event?.msg_seq ?? event?.message_seq ?? '';
    const scope = event?.scope ?? event?.group_id ?? event?.guild_id ?? event?.author?.id ?? '';
    return `${scope}:${id}:${seq}`;
  }

  accept(event) {
    const key = this.keyOf(event);
    if (key === '::') return true;
    const now = this.now();
    this.prune(now);
    if (this.seen.has(key)) return false;
    this.seen.set(key, now + this.ttlMs);
    if (this.seen.size > this.maxEntries) this.prune(now, true);
    return true;
  }

  prune(now = this.now(), force = false) {
    for (const [key, until] of this.seen) {
      if (until <= now || (force && this.seen.size > this.maxEntries)) this.seen.delete(key);
      if (!force && until > now) continue;
    }
    while (this.seen.size > this.maxEntries) this.seen.delete(this.seen.keys().next().value);
  }
}

export function isAuditRejection(error) {
  const code = String(error?.apiCode ?? error?.code ?? error?.error?.code ?? '');
  const message = String(error?.message ?? error?.error?.message ?? error ?? '');
  return code === 'data_inspection_failed' || /Input text data may contain inappropriate content/i.test(message);
}

/**
 * 内容审核 400 的一次性恢复：保留最近消息，清掉摘要和 tool 开头，交由调用方重试。
 * 返回新数组，不修改原 session，方便先持久化备份。
 */
export function compactAfterAudit(session, { keep = 6 } = {}) {
  const messages = Array.isArray(session?.messages) ? session.messages : [];
  const limit = Math.max(4, Math.min(messages.length, Number(keep) || 6));
  let retained = messages.slice(-limit);
  while (retained.length > 1 && retained[0]?.role === 'tool') retained = retained.slice(1);
  return { ...session, messages: retained, summary: '' };
}

/** 判断是否允许继续尝试，避免同一会话无限重试。 */
export function auditRecoveryPlan(session) {
  if (session?.auditBlocked) return { action: 'blocked', retry: false };
  if (session?.auditRetried) return { action: 'new-session', retry: false, resetContext: true };
  return { action: 'compact-and-retry', retry: true };
}

