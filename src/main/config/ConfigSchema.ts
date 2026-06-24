import { z } from 'zod';

const sensorSchema = z.object({
  path: z.string().optional(),
  derivedFrom: z.string().optional(),
  mode: z.string().optional(),
  windowMs: z.number().optional(),
  sourceUnits: z.string().optional(),
  displayUnits: z.string().optional(),
  normalize: z.object({
    min: z.number(),
    max: z.number(),
    curve: z.string().optional(),
    invert: z.boolean().optional(),
    mode: z.string().optional(),
  }),
  smoothing: z
    .object({
      type: z.string(),
      alpha: z.number(),
    })
    .optional(),
  deadband: z.number().optional(),
  staleAfterMs: z.number().optional(),
});

export const appConfigSchema = z.object({
  version: z.number().int().min(1),
  app: z.object({ name: z.string(), randomSeed: z.string() }),
  signalk: z.object({
    enabled: z.boolean(),
    protocol: z.enum(['ws', 'wss']),
    host: z.string(),
    port: z.number(),
    version: z.string(),
    subscribe: z.enum(['self', 'all', 'none']),
    token: z.string().nullable(),
    reconnect: z.object({ minDelayMs: z.number(), maxDelayMs: z.number(), jitter: z.boolean() }),
    stalePolicy: z.object({ defaultStaleAfterMs: z.number(), onDisconnect: z.string(), fadeMs: z.number() }),
  }),
  midi: z.object({
    output: z.object({ mode: z.string(), preferredName: z.string(), createVirtual: z.boolean() }),
    panicOnStop: z.boolean(),
    sendClock: z.boolean(),
    channels: z.record(z.string(), z.number().int().min(1).max(16)),
  }),
  clock: z.object({
    bpm: z.object({ base: z.number(), min: z.number(), max: z.number(), source: z.string(), amount: z.number() }),
    beatsPerBar: z.number().int().min(1),
    phraseLengthBars: z.number().int().min(1),
    swing: z.number(),
  }),
  sensors: z.record(z.string(), sensorSchema),
  harmony: z.any(),
  motifs: z.record(z.string(), z.any()),
  arrangement: z.any(),
  mappings: z.array(z.any()),
});

export type AppConfigSchema = z.infer<typeof appConfigSchema>;
