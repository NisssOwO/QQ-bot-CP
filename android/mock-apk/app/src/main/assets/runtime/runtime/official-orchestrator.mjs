import { normalizeOfficialEvent } from './official-event-normalizer.mjs';
import { decideTrigger, prepareModelText } from './trigger-policy.mjs';
import { executeRoleCommand } from './role-command.mjs';

export class OfficialBotOrchestrator {
  constructor({ pipeline, registry, roleStore, requireMention = true, isOwner = () => false } = {}) {
    this.pipeline = pipeline;
    this.registry = registry;
    this.roleStore = roleStore;
    this.requireMention = requireMention;
    this.isOwner = isOwner;
  }

  ingest(event, { now = Date.now() } = {}) {
    const message = normalizeOfficialEvent(event);
    if (!message) return { action: 'ignore', reason: 'unsupported-event' };
    // normalizeOfficialEvent already includes the peer identity in scope:
    // private:<userId> or group:<groupId>. Keep role bindings on that key so
    // private and group conversations cannot share a selected preset.
    const roleScope = message.scope;
    const trigger = decideTrigger(message, { requireMention: this.requireMention });
    if (trigger.action === 'ignore') return { action: 'ignore', reason: trigger.reason, message };

    if (trigger.action === 'command') {
      const command = executeRoleCommand({
        text: message.content,
        scope: roleScope,
        isOwner: this.isOwner(message),
        registry: this.registry,
        store: this.roleStore,
      });
      return { action: 'command', message, command };
    }

    const gate = this.pipeline.acceptInbound(message, {
      isOwner: this.isOwner(message),
      mentioned: message.mentioned,
      now,
    });
    if (!gate.accepted) return { action: 'ignore', reason: gate.reason, message };
    const roleId = this.roleStore.get(roleScope);
    const role = this.registry.resolve(roleId);
    return {
      action: 'prompt',
      message,
      role,
      sessionKey: `qqbot:${message.kind}:${message.peerId}`,
      text: prepareModelText(message),
    };
  }
}
