import { EventEmitter } from 'node:events';
import { ConfigService } from './config/ConfigService';
import { defaultConfig } from './config/defaults';
import { MockMidiOutputAdapter } from './midi/MockMidiOutputAdapter';
import type { MidiOutputAdapter } from './midi/MidiOutputAdapter';
import { MidiScheduler } from './midi/MidiScheduler';
import { panic as triggerPanic } from './midi/Panic';
import { RtMidiOutputAdapter } from './midi/RtMidiOutputAdapter';
import { MusicalStateEngine } from './music/MusicalStateEngine';
import type { MappingCommand } from './music/MappingEngine';
import { SignalKClient } from './signalk/SignalKClient';
import type { SignalKConnectionState } from './signalk/types';
import { Simulator } from './simulator/Simulator';
import type { SimulatorProfile } from './simulator/presets';
import { WorldStateStore } from './state/WorldStateStore';
import type { RuntimeSnapshot, AppStatus } from './ipc/types';
import { log } from './utils/logger';

const MIDI_MONITOR_LIMIT = 300;

type PendingConfigPlan = {
  nextConfig: typeof defaultConfig;
  previousConfig: typeof defaultConfig;
  quantizeTo: 'beat' | 'bar' | 'phrase';
  durationMs: number;
  requestedAt: number;
};

export class AppRuntime {
  private readonly events = new EventEmitter();

  private readonly configService = new ConfigService();

  private config = defaultConfig;

  private world = new WorldStateStore(defaultConfig);

  private music = new MusicalStateEngine(defaultConfig);

  private midiAdapter: MidiOutputAdapter = new MockMidiOutputAdapter();

  private scheduler = new MidiScheduler(this.midiAdapter);

  private simulator = new Simulator();

  private signalKClient: SignalKClient | null = null;

  private connectionState: SignalKConnectionState = 'disconnected';

  private lastMessageAt: number | null = null;

  private selectedMidiPort: string | null = null;

  private midiMonitor: Array<{ at: number; message: any; source?: string }> = [];

  private tickTimer: NodeJS.Timeout | null = null;

  private pendingConfigPlan: PendingConfigPlan | null = null;

  async init(): Promise<void> {
    this.config = await this.configService.load();
    this.midiAdapter = this.createMidiAdapter();
    this.scheduler = new MidiScheduler(this.midiAdapter);
    this.world.applyConfig(this.config);
    this.music.applyConfig(this.config);

    log('info', 'app_start', { appName: this.config.app.name, version: '1.0.0' });

    this.world.on('state', (worldState) => {
      let musical = this.music.update(worldState);
      const maybeUpdated = this.maybeApplyPendingConfig(worldState, musical);
      if (maybeUpdated) {
        musical = maybeUpdated;
      }
      const mappingCommands = this.music.mapping.update(worldState, musical.arrangement, musical.harmony);
      this.applyMappingCommands(mappingCommands);

      const motifEvents = this.music.motif.generate(Object.keys(musical.arrangement.activeLayers), musical.arrangement, musical.harmony);
      for (const event of motifEvents) {
        const quantized = this.music.harmony.quantizeNote({
          note: event.note,
          velocity: event.velocity,
          channel: event.channel,
          beatPosition: musical.arrangement.beat,
        });
        this.scheduler.send({ type: 'noteOn', channel: quantized.channel, note: quantized.note, velocity: quantized.velocity }, event.source);
        this.scheduler.schedule(
          { type: 'noteOff', channel: quantized.channel, note: quantized.note, velocity: 0 },
          performance.now() + event.durationBeats * (60000 / this.config.clock.bpm.base),
          event.source,
        );
      }

      this.emitSnapshot();
    });

    this.scheduler.onMonitor((entry) => {
      this.midiMonitor.push(entry);
      if (this.midiMonitor.length > MIDI_MONITOR_LIMIT) {
        this.midiMonitor.shift();
      }
    });

    this.simulator.on('values', (values) => {
      this.lastMessageAt = Date.now();
      this.world.ingest(values);
    });

    this.tickTimer = setInterval(() => {
      this.world.tick();
    }, 250);
  }

  dispose(): void {
    this.disconnectSignalK();
    this.simulator.stop();
    if (this.tickTimer) {
      clearInterval(this.tickTimer);
      this.tickTimer = null;
    }
    if (this.config.midi.panicOnStop) {
      this.panic();
    }
    log('info', 'app_stop');
  }

  getStatus(): AppStatus {
    return {
      appName: this.config.app.name,
      version: '1.0.0',
      signalKEnabled: this.config.signalk.enabled,
    };
  }

  getConfigYaml(): string {
    return this.configService.exportYaml();
  }

  validateConfigText(text: string): { ok: boolean; errors?: string[] } {
    const result = this.configService.validateText(text);
    return result.ok ? { ok: true } : { ok: false, errors: result.errors };
  }

  async applyConfigText(text: string): Promise<{ ok: boolean; errors?: string[] }> {
    const result = this.configService.validateText(text);
    if (!result.ok) {
      log('warn', 'config_rejected', { errors: result.errors.join('; ') });
      return { ok: false, errors: result.errors };
    }
    const nextConfig = result.config;
    this.pendingConfigPlan = {
      nextConfig,
      previousConfig: this.config,
      quantizeTo: nextConfig.arrangement.transition.quantizeTo,
      durationMs: Math.max(0, nextConfig.arrangement.transition.defaultDurationMs),
      requestedAt: Date.now(),
    };
    log('info', 'config_queued', {
      quantizeTo: this.pendingConfigPlan.quantizeTo,
      durationMs: this.pendingConfigPlan.durationMs,
    });
    this.emitSnapshot();
    return { ok: true };
  }

  async listMidiOutputs(): Promise<Array<{ id: string; name: string; virtual?: boolean }>> {
    return this.midiAdapter.listOutputs();
  }

  async openMidiOutput(portId: string): Promise<void> {
    await this.midiAdapter.openOutput(portId);
    this.selectedMidiPort = portId;
    log('info', 'midi_opened', { portId });
    this.emitSnapshot();
  }

  async createVirtualMidi(name: string): Promise<void> {
    if (this.midiAdapter.createVirtualOutput) {
      await this.midiAdapter.createVirtualOutput(name);
      this.selectedMidiPort = `virtual:${name}`;
      log('info', 'midi_virtual_opened', { name });
      this.emitSnapshot();
    }
  }

  panic(): void {
    triggerPanic(
      this.midiAdapter,
      Object.values(this.config.midi.channels),
      this.scheduler.getActiveNotes().map((n) => ({ channel: n.channel, note: n.note })),
    );
    this.scheduler.clearActiveNotes();
    log('warn', 'midi_panic');
    this.emitSnapshot();
  }

  connectSignalK(): void {
    if (this.signalKClient) {
      return;
    }
    const url = `${this.config.signalk.protocol}://${this.config.signalk.host}:${this.config.signalk.port}/signalk/${this.config.signalk.version}/stream?subscribe=${this.config.signalk.subscribe}`;
    this.signalKClient = new SignalKClient(
      {
        url,
        token: this.config.signalk.token,
        minDelayMs: this.config.signalk.reconnect.minDelayMs,
        maxDelayMs: this.config.signalk.reconnect.maxDelayMs,
        jitter: this.config.signalk.reconnect.jitter,
      },
      (values) => {
        this.lastMessageAt = Date.now();
        this.world.ingest(values);
      },
      (state) => {
        this.connectionState = state;
        log('info', 'signalk_state', { state });
        this.emitSnapshot();
      },
    );
    this.signalKClient.connect();
  }

  disconnectSignalK(): void {
    if (!this.signalKClient) {
      this.connectionState = 'disconnected';
      return;
    }
    this.signalKClient.disconnect();
    this.signalKClient = null;
    this.connectionState = 'disconnected';
    if (this.config.signalk.stalePolicy.onDisconnect === 'panic') {
      this.panic();
    }
    this.emitSnapshot();
  }

  startSimulator(profile: SimulatorProfile): void {
    this.simulator.start(profile);
    this.connectionState = 'connected';
    this.emitSnapshot();
  }

  stopSimulator(): void {
    this.simulator.stop();
    this.emitSnapshot();
  }

  setSimulatorOverride(sensor: string, value: number | null): void {
    this.simulator.setManualOverride(sensor, value);
  }

  subscribe(listener: (snapshot: RuntimeSnapshot) => void): () => void {
    this.events.on('runtime', listener);
    return () => this.events.off('runtime', listener);
  }

  getRuntimeSnapshot(): RuntimeSnapshot {
    const world = this.world.getState();
    const music = this.music.update(world);
    return {
      connectionState: this.connectionState,
      lastMessageAt: this.lastMessageAt,
      sensors: world.sensors,
      arrangement: music.arrangement,
      harmony: music.harmony,
      midiMonitor: [...this.midiMonitor],
      selectedMidiPort: this.selectedMidiPort,
    };
  }

  private emitSnapshot(): void {
    this.events.emit('runtime', this.getRuntimeSnapshot());
  }

  private maybeApplyPendingConfig(worldState: ReturnType<WorldStateStore['getState']>, musical: ReturnType<MusicalStateEngine['update']>): ReturnType<MusicalStateEngine['update']> | null {
    const plan = this.pendingConfigPlan;
    if (!plan) {
      return null;
    }
    if (!this.isBoundaryReached(plan.quantizeTo, musical.arrangement.bar, musical.arrangement.beat, musical.arrangement.phrasePosition)) {
      return null;
    }
    const beforeArrangement = musical.arrangement;
    const beforeConfig = this.config;
    try {
      this.config = plan.nextConfig;
      this.world.applyConfig(this.config);
      this.music.applyConfig(this.config);
      this.resolveRemovedLayers(plan.previousConfig, this.config);
      void this.configService.save(this.config);
      const updated = this.music.update(worldState);
      this.planLayerRamp(beforeArrangement, updated.arrangement, plan.durationMs);
      this.pendingConfigPlan = null;
      log('info', 'config_applied', {
        quantizeTo: plan.quantizeTo,
        latencyMs: Date.now() - plan.requestedAt,
      });
      return updated;
    } catch (error) {
      this.config = beforeConfig;
      this.world.applyConfig(this.config);
      this.music.applyConfig(this.config);
      this.pendingConfigPlan = null;
      log('error', 'config_apply_failed', { error: error instanceof Error ? error.message : 'unknown' });
      return null;
    }
  }

  private isBoundaryReached(quantizeTo: 'beat' | 'bar' | 'phrase', bar: number, beat: number, phrasePosition: number): boolean {
    if (quantizeTo === 'beat') {
      return true;
    }
    if (quantizeTo === 'bar') {
      return beat === 1;
    }
    return beat === 1 && phrasePosition === 0;
  }

  private planLayerRamp(
    fromArrangement: RuntimeSnapshot['arrangement'],
    toArrangement: RuntimeSnapshot['arrangement'],
    durationMs: number,
  ): void {
    const duration = Math.max(0, durationMs);
    if (duration === 0) {
      return;
    }
    const channels = [...new Set(Object.values(this.config.midi.channels))];
    const start = this.estimateLayerGain(fromArrangement.activeLayers);
    const end = this.estimateLayerGain(toArrangement.activeLayers);
    const steps = Math.max(1, Math.floor(duration / 100));
    for (let i = 1; i <= steps; i += 1) {
      const progress = i / steps;
      const gain = start + (end - start) * progress;
      const value = Math.max(0, Math.min(127, Math.round(20 + gain * 90)));
      const at = performance.now() + progress * duration;
      for (const channel of channels) {
        this.scheduler.schedule({ type: 'cc', channel, controller: 11, value }, at, 'hot-reload-ramp');
      }
    }
  }

  private estimateLayerGain(layers: RuntimeSnapshot['arrangement']['activeLayers']): number {
    const gains = Object.values(layers).map((layer) => {
      if (typeof layer.gain === 'number') {
        return layer.gain;
      }
      return layer.enabled ? 1 : 0;
    });
    if (gains.length === 0) {
      return 0;
    }
    return gains.reduce((sum, value) => sum + value, 0) / gains.length;
  }

  private createMidiAdapter(): MidiOutputAdapter {
    try {
      const adapter = new RtMidiOutputAdapter();
      log('info', 'midi_backend_selected', { backend: 'rtmidi' });
      return adapter;
    } catch (error) {
      log('warn', 'midi_backend_fallback', { backend: 'mock', reason: error instanceof Error ? error.message : 'unknown' });
      return new MockMidiOutputAdapter();
    }
  }

  private applyMappingCommands(commands: MappingCommand[]): void {
    for (const command of commands) {
      if (command.type === 'cc') {
        this.scheduler.send(
          {
            type: 'cc',
            channel: command.channel,
            controller: command.controller,
            value: command.value,
          },
          command.source,
        );
      } else if (command.type === 'pitchBend') {
        this.scheduler.send(
          {
            type: 'pitchBend',
            channel: command.channel,
            value: command.value,
          },
          command.source,
        );
      } else if (command.type === 'programChange') {
        this.scheduler.send(
          {
            type: 'programChange',
            channel: command.channel,
            program: command.program,
          },
          command.source,
        );
      }
    }
  }

  private resolveRemovedLayers(previous: typeof this.config, next: typeof this.config): void {
    const previousLayers = new Set<string>();
    const nextLayers = new Set<string>();

    for (const scene of Object.values(previous.arrangement.scenes)) {
      for (const name of Object.keys(scene.layers ?? {})) {
        previousLayers.add(name);
      }
    }
    for (const scene of Object.values(next.arrangement.scenes)) {
      for (const name of Object.keys(scene.layers ?? {})) {
        nextLayers.add(name);
      }
    }
    if ([...previousLayers].some((name) => !nextLayers.has(name))) {
      this.panic();
    }
  }
}
