import fs from 'node:fs';
import path from 'node:path';

export class SessionRoleStore {
  constructor({ file, defaultRole = 'nanoka' } = {}) {
    this.file = file;
    this.defaultRole = defaultRole;
    this.roles = new Map();
    this.load();
  }

  load() {
    this.roles.clear();
    if (!this.file) return;
    try {
      const data = JSON.parse(fs.readFileSync(this.file, 'utf8'));
      for (const [scope, role] of Object.entries(data?.roles ?? {})) {
        if (scope && typeof role === 'string' && role) this.roles.set(scope, role);
      }
      if (typeof data?.defaultRole === 'string' && data.defaultRole) this.defaultRole = data.defaultRole;
    } catch { /* 首次运行或坏文件由调用方处理为默认值 */ }
  }

  save() {
    if (!this.file) return;
    fs.mkdirSync(path.dirname(this.file), { recursive: true });
    const temp = `${this.file}.tmp-${process.pid}`;
    fs.writeFileSync(temp, JSON.stringify({ defaultRole: this.defaultRole, roles: Object.fromEntries(this.roles) }, null, 2) + '\n', 'utf8');
    fs.renameSync(temp, this.file);
  }

  get(scope) { return this.roles.get(String(scope)) ?? this.defaultRole; }

  set(scope, role) {
    const key = String(scope ?? '').trim();
    const value = String(role ?? '').trim();
    if (!key || !value) throw new Error('scope 和 role 不能为空');
    this.roles.set(key, value);
    this.save();
    return value;
  }

  remove(scope) {
    const removed = this.roles.delete(String(scope));
    if (removed) this.save();
    return removed;
  }

  snapshot() { return { defaultRole: this.defaultRole, roles: Object.fromEntries(this.roles) }; }
}
