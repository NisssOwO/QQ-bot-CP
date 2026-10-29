import { parseRoleCommand } from './role-command.mjs';

export function isControlCommand(text) {
  return parseRoleCommand(text) !== null || /^\/(new|reset|clear|compact|help|bot-status)\b/i.test(String(text ?? '').trim());
}

export function decideTrigger(message, { requireMention = true } = {}) {
  if (!message || !message.kind) return { action: 'ignore', reason: 'invalid-message' };
  if (isControlCommand(message.content)) return { action: 'command', content: message.content };
  if (message.kind === 'private') return { action: 'respond', reason: 'private-message' };
  if (message.kind === 'group' && requireMention && !message.mentioned) return { action: 'ignore', reason: 'mention-required' };
  return { action: 'respond', reason: message.mentioned ? 'mentioned' : 'group-open' };
}

export function prepareModelText(message) {
  if (isControlCommand(message?.content)) return null;
  return String(message?.content ?? '').trim() || null;
}
