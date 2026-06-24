import { app } from 'electron';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { midi as noteMidi } from '@tonaljs/note';
import YAML from 'yaml';
import { appConfigSchema } from './ConfigSchema';
import { defaultConfig } from './defaults';
import { migrateConfig } from './migrations';
import type { AppConfig } from './types';

function resolveDefaultConfigPath(): string {
  try {
    return join(app.getPath('userData'), 'config.yaml');
  } catch {
    return join(process.cwd(), '.singing-boat.config.yaml');
  }
}

type MappingLike = Record<string, any>;

function isValidMidiChannel(channel: number): boolean {
  return Number.isInteger(channel) && channel >= 1 && channel <= 16;
}

function channelFromAlias(config: AppConfig, value: unknown): number | null {
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'string') {
    const alias = config.midi.channels[value];
    return typeof alias === 'number' ? alias : null;
  }
  return null;
}

export function semanticValidateConfig(config: AppConfig): string[] {
  const errors: string[] = [];
  const sensors = new Set(Object.keys(config.sensors));
  const motifs = new Set(Object.keys(config.motifs));
  const virtualSensors = new Set(['connection']);
  const sensorExists = (name: string): boolean => sensors.has(name) || virtualSensors.has(name);

  if (!sensorExists(config.clock.bpm.source)) {
    errors.push(`clock.bpm.source references unknown sensor: ${config.clock.bpm.source}`);
  }

  if (!sensorExists(config.harmony.progression.advance.sensor)) {
    errors.push(`harmony.progression.advance.sensor references unknown sensor: ${config.harmony.progression.advance.sensor}`);
  }

  for (const [sensorName, sensor] of Object.entries(config.sensors)) {
    if (sensor.derivedFrom && !sensorExists(sensor.derivedFrom)) {
      errors.push(`sensors.${sensorName}.derivedFrom references unknown sensor: ${sensor.derivedFrom}`);
    }
    if (sensor.normalize.min >= sensor.normalize.max) {
      errors.push(`sensors.${sensorName}.normalize min must be < max`);
    }
    if (sensor.smoothing && (sensor.smoothing.alpha < 0 || sensor.smoothing.alpha > 1)) {
      errors.push(`sensors.${sensorName}.smoothing.alpha must be in [0,1]`);
    }
    if (typeof sensor.deadband === 'number' && (sensor.deadband < 0 || sensor.deadband > 1)) {
      errors.push(`sensors.${sensorName}.deadband must be in [0,1]`);
    }
  }

  for (const [alias, channel] of Object.entries(config.midi.channels)) {
    if (!isValidMidiChannel(channel)) {
      errors.push(`midi.channels.${alias} must be an integer in 1..16`);
    }
  }

  for (const source of config.harmony.tension.sources) {
    if (!sensorExists(source.sensor)) {
      errors.push(`harmony.tension.sources references unknown sensor: ${source.sensor}`);
    }
    if (source.weight < 0 || source.weight > 1) {
      errors.push(`harmony.tension weight for ${source.sensor} must be in [0,1]`);
    }
  }

  if (config.arrangement.transition.defaultDurationMs < 0) {
    errors.push('arrangement.transition.defaultDurationMs must be >= 0');
  }

  for (const [sceneName, scene] of Object.entries(config.arrangement.scenes)) {
    const allRules = [...(scene?.when?.all ?? []), ...(scene?.when?.any ?? [])];
    for (const rule of allRules) {
      if (rule?.sensor && !sensorExists(rule.sensor)) {
        errors.push(`arrangement.scenes.${sceneName}.when references unknown sensor: ${rule.sensor}`);
      }
    }
    for (const [layerName, layer] of Object.entries(scene?.layers ?? {})) {
      const density = (layer as Record<string, unknown>).density;
      const gain = (layer as Record<string, unknown>).gain;
      if (typeof density === 'number' && (density < 0 || density > 1)) {
        errors.push(`arrangement.scenes.${sceneName}.layers.${layerName}.density must be in [0,1]`);
      }
      if (typeof gain === 'number' && (gain < 0 || gain > 1)) {
        errors.push(`arrangement.scenes.${sceneName}.layers.${layerName}.gain must be in [0,1]`);
      }
    }
  }

  for (const [motifName, motif] of Object.entries(config.motifs)) {
    const channel = channelFromAlias(config, motif.channel);
    if (channel === null || !isValidMidiChannel(channel)) {
      errors.push(`motifs.${motifName}.channel references unknown alias or invalid channel: ${String(motif.channel)}`);
    }

    if (motif.trigger?.sensor && !sensorExists(motif.trigger.sensor)) {
      errors.push(`motifs.${motifName}.trigger.sensor references unknown sensor: ${motif.trigger.sensor}`);
    }

    if (typeof motif.range?.low === 'string' && noteMidi(motif.range.low) === null) {
      errors.push(`motifs.${motifName}.range.low invalid note: ${motif.range.low}`);
    }
    if (typeof motif.range?.high === 'string' && noteMidi(motif.range.high) === null) {
      errors.push(`motifs.${motifName}.range.high invalid note: ${motif.range.high}`);
    }

    if (typeof motif.velocity?.min === 'number' && (motif.velocity.min < 0 || motif.velocity.min > 127)) {
      errors.push(`motifs.${motifName}.velocity.min must be in 0..127`);
    }
    if (typeof motif.velocity?.max === 'number' && (motif.velocity.max < 0 || motif.velocity.max > 127)) {
      errors.push(`motifs.${motifName}.velocity.max must be in 0..127`);
    }
    if (typeof motif.velocity?.fixed === 'number' && (motif.velocity.fixed < 0 || motif.velocity.fixed > 127)) {
      errors.push(`motifs.${motifName}.velocity.fixed must be in 0..127`);
    }
  }

  for (const mapping of config.mappings as MappingLike[]) {
    const mappingId = String(mapping.id ?? 'unknown');
    if (typeof mapping.source === 'string' && !sensorExists(mapping.source)) {
      errors.push(`mappings.${mappingId}.source references unknown sensor: ${mapping.source}`);
    }

    const target = mapping.target ?? {};
    if (target.channel !== undefined) {
      const channel = channelFromAlias(config, target.channel);
      if (channel === null || !isValidMidiChannel(channel)) {
        errors.push(`mappings.${mappingId}.target.channel invalid alias/channel: ${String(target.channel)}`);
      }
    }

    if (target.type === 'cc') {
      if (!Number.isInteger(target.controller) || target.controller < 0 || target.controller > 127) {
        errors.push(`mappings.${mappingId}.target.controller must be in 0..127`);
      }
      if (typeof mapping.transform?.min === 'number' && typeof mapping.transform?.max === 'number' && mapping.transform.min > mapping.transform.max) {
        errors.push(`mappings.${mappingId}.transform min must be <= max`);
      }
    }

    if (target.type === 'programChange') {
      if (typeof target.program === 'number' && (target.program < 0 || target.program > 127)) {
        errors.push(`mappings.${mappingId}.target.program must be in 0..127`);
      }
    }

    if (target.type === 'pitchBend') {
      const min = mapping.transform?.min;
      const max = mapping.transform?.max;
      if (typeof min === 'number' && typeof max === 'number' && min > max) {
        errors.push(`mappings.${mappingId}.pitchBend transform min must be <= max`);
      }
    }

    if ((target.type === 'motifTrigger' || target.type === 'motifParameter') && typeof target.motif === 'string' && !motifs.has(target.motif)) {
      errors.push(`mappings.${mappingId}.target.motif references unknown motif: ${target.motif}`);
    }
  }

  return errors;
}

export class ConfigService {
  private config: AppConfig = defaultConfig;

  private readonly configPath: string;

  constructor(configPath?: string) {
    this.configPath = configPath ?? resolveDefaultConfigPath();
  }

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
    const semanticErrors = semanticValidateConfig(parsed as AppConfig);
    if (semanticErrors.length > 0) {
      throw new Error(semanticErrors.join('\n'));
    }
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
