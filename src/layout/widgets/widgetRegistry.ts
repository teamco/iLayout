// src/layout/widgets/widgetRegistry.ts
import React from 'react';

export type WidgetDefinition = {
  widgetId: string;
  label: string;
  description?: string;
  defaultConfig: Record<string, unknown>;
  defaultType?: 'component' | 'iframe' | 'embed';  // defaults to 'component' if omitted
  component?: React.ComponentType<{ config: Record<string, unknown> }>;
};

const registry = new Map<string, WidgetDefinition>();

export function registerWidget(def: WidgetDefinition) {
  registry.set(def.widgetId, def);
}

export function getWidget(widgetId: string): WidgetDefinition | undefined {
  return registry.get(widgetId);
}

export function getAllWidgets(): WidgetDefinition[] {
  return Array.from(registry.values());
}

// Built-in demo widget
registerWidget({
  widgetId: 'demo-placeholder',
  label: 'Placeholder',
  description: 'Empty placeholder panel',
  defaultConfig: { label: 'Widget' },
});
