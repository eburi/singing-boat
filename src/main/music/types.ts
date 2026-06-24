import type { WorldState } from '../state/WorldStateStore';

export interface LayerState {
  enabled: boolean;
  density?: number;
  gain?: number;
  motif?: string;
}

export interface ArrangementTransitionState {
  fromScene: string;
  toScene: string;
  progress: number;
}

export interface ArrangementState {
  scene: string;
  intensity: number;
  tension: number;
  density: number;
  phrasePosition: number;
  bar: number;
  beat: number;
  activeLayers: Record<string, LayerState>;
  activeMotifs: string[];
  transition?: ArrangementTransitionState;
}

export interface HarmonyState {
  key: string;
  mode: string;
  chord: string;
  progressionIndex: number;
  tension: number;
  quantizeEnabled: boolean;
}

export interface MidiNoteCandidate {
  note: number;
  velocity: number;
  channel: number;
  beatPosition: number;
}

export interface QuantizeOptions {
  allowPassingTones?: boolean;
}

export interface NoteRange {
  low: number;
  high: number;
}

export interface MusicalState {
  world: WorldState;
  arrangement: ArrangementState;
  harmony: HarmonyState;
}
