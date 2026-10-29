import fs from 'node:fs';
import path from 'node:path';

export class RoleRegistry {
  constructor({ presetDir, defaultRole = 'nanoka' } = {}) {
    this.presetDir = presetDir;
    this.defaultRole = defaultRole;
    this.roles = new Map();
    this.aliases = new Map();
    this.reload();
  }

  reload() {
    this.roles.clear();
    this.aliases.clear();
    if (!this.presetDir || !fs.existsSync(this.presetDir)) return;
    for (const entry of fs.readdirSync(this.presetDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const file = path.join(this.presetDir, entry.name, 'agent.cordis.yml');
      if (!fs.existsSync(file)) continue;
      const json = path.join(this.presetDir, `preset.${entry.name}.json`);
      let meta = { id: entry.name, displayName: entry.name, aliases: [] };
      try { if (fs.existsSync(json)) meta = { ...meta, ...JSON.parse(fs.readFileSync(json, 'utf8')) }; } catch { continue; }
      const role = { id: entry.name, displayName: String(meta.displayName ?? entry.name), aliases: [...new Set([entry.name, ...(meta.aliases ?? [])].map(String))] };
      this.roles.set(role.id, role);
      for (const alias of role.aliases) this.aliases.set(alias.toLocaleLowerCase(), role.id);
    }
    if (!this.roles.has(this.defaultRole)) this.defaultRole = this.roles.keys().next().value ?? null;
  }

  get(idOrAlias) {
    const key = String(idOrAlias ?? '').trim();
    if (this.roles.has(key)) return this.roles.get(key);
    const id = this.aliases.get(key.toLocaleLowerCase());
    return id ? this.roles.get(id) : null;
  }

  resolve(idOrAlias) {
    return this.get(idOrAlias) ?? this.get(this.defaultRole);
  }

  list() { return [...this.roles.values()]; }
}
