import { app } from 'electron';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import YAML from 'yaml';
import { appConfigSchema } from './ConfigSchema';
import { defaultConfig } from './defaults';
import { migrateConfig } from './migrations';
import type { AppConfig } from './types';

export class ConfigService {
  private config: AppConfig = defaultConfig;

  private readonly configPath = join(app.getPath('userData'), 'config.yaml');

  async load(): Promise<AppConfig> {
    try {
      const text = await readFile(this.configPath, 'utf8');
      const parsed = YAML.parse(text) as AppConfig;
      const migrated = migrateConfig(parsed);
      this.config = this.validate(migrated);
      return this.config;
    } catch {
      await this.save(defaultConfig);
      this.config = defaultConfig;
      return this.config;
    }
  }

  get(): AppConfig {
    return this.config;
  }

  async save(nextConfig: AppConfig): Promise<void> {
    this.validate(nextConfig);
    await mkdir(dirname(this.configPath), { recursive: true });
    await writeFile(this.configPath, YAML.stringify(nextConfig), 'utf8');
    this.config = nextConfig;
  }

  validate(candidate: unknown): AppConfig {
    const parsed = appConfigSchema.parse(candidate);
    return parsed as AppConfig;
  }

  validateText(text: string): { ok: true; config: AppConfig } | { ok: false; errors: string[] } {
    try {
      const raw = YAML.parse(text);
      return { ok: true, config: this.validate(raw) };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown config error';
      return { ok: false, errors: [message] };
    }
  }

  exportYaml(): string {
    return YAML.stringify(this.config);
  }
}
