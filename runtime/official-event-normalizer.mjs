/** 将 QQ 官方 Bot 事件统一成业务层消息。 */
export function normalizeOfficialEvent(event = {}) {
  const type = String(event.t ?? event.type ?? '').toUpperCase();
  const data = event.d ?? event.data ?? event;
  const isGroup = type.includes('GROUP_') || data.group_id != null || data.group_openid != null;
  const isPrivate = type.includes('C2C_') || type.includes('DIRECT_') || data.author?.user_openid != null;
  if (!isGroup && !isPrivate) return null;

  const sender = data.author ?? data.user ?? {};
  const userId = String(sender.user_openid ?? sender.id ?? data.user_openid ?? data.user_id ?? '');
  const peerId = String(isGroup ? (data.group_openid ?? data.group_id ?? '') : userId);
  if (!peerId || !userId) return null;

  const content = String(data.content ?? '').trim();
  const mentions = Array.isArray(data.mentions) ? data.mentions : [];
  return {
    kind: isGroup ? 'group' : 'private',
    scope: isGroup ? `group:${peerId}` : `private:${peerId}`,
    peerId,
    userId,
    messageId: String(data.id ?? data.message_id ?? data.msg_id ?? ''),
    seq: Number(data.seq ?? data.msg_seq ?? data.message_seq ?? 0) || 0,
    content,
    mentioned: Boolean(data.mentioned ?? data.mention_everyone) || mentions.length > 0,
    rawType: type,
    raw: data,
  };
}
