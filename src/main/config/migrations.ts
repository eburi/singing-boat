export function migrateConfig<T extends { version: number }>(config: T): T {
  if (config.version !== 1) {
    return { ...config, version: 1 };
  }
  return config;
}
