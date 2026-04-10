// packages/embed/src/widgets/registry.ts
import type { EWidgetResource, WidgetDefinition } from '../types';

const registry = new Map<EWidgetResource, WidgetDefinition>();

export function registerWidget(def: WidgetDefinition): void {
  registry.set(def.resource, def);
}

export function getWidgetDef(
  resource: EWidgetResource,
): WidgetDefinition | undefined {
  return registry.get(resource);
}

export function getAllWidgetDefs(): WidgetDefinition[] {
  return Array.from(registry.values());
}

export function clearRegistry(): void {
  registry.clear();
}
