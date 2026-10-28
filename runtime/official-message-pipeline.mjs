import { MessageDeduplicator, isAuditRejection, compactAfterAudit, auditRecoveryPlan } from './message-guard.mjs';

/**
 * dsh-qqbot 与迁移业务层之间的最小适配接口。
 * plugin 侧负责把 QQ 事件映射为 {scope, messageId, seq, mentioned, isOwner}。
 */
export class OfficialMessagePipeline {
  constructor({ quietHours, deduplicator = new MessageDeduplicator(), log = () => {} } = {}) {
    this.quietHours = quietHours;
    this.deduplicator = deduplicator;
    this.log = log;
  }

  acceptInbound(event, { isOwner = false, mentioned = false, now = Date.now() } = {}) {
    if (!this.deduplicator.accept(event)) return { accepted: false, reason: 'duplicate' };
    if (this.quietHours && !this.quietHours.allowsInbound({ isOwner, mentioned, now })) {
      this.quietHours.noteSuppressed();
      return { accepted: false, reason: 'quiet-hours' };
    }
    return { accepted: true };
  }

  recoverModelFailure(session, error) {
    if (!isAuditRejection(error)) return { action: 'raise', session };
    const plan = auditRecoveryPlan(session);
    if (!plan.retry) {
      this.log(`[official-bot] audit recovery stopped: ${plan.action}`);
      if (plan.resetContext) {
        return {
          action: 'new-session',
          previousSession: session,
          session: { ...session, messages: [], summary: '', auditRetried: false, auditBlocked: true },
        };
      }
      return { action: plan.action, session };
    }
    const compacted = compactAfterAudit(session);
    this.log(`[official-bot] audit recovery compacted ${session?.messages?.length ?? 0} -> ${compacted.messages.length}`);
    return { action: 'retry-once', session: { ...compacted, auditRetried: true } };
  }
}

