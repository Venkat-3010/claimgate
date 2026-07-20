import type { GateAdapter } from "./adapter.js";

export function createAdapterRegistry(adapters: GateAdapter[]): Map<string, GateAdapter> {
  const map = new Map<string, GateAdapter>();
  for (const adapter of adapters) {
    map.set(adapter.type, adapter);
  }
  return map;
}
