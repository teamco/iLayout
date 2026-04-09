// packages/embed/src/widgets/__tests__/registry.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { registerWidget, getWidgetDef, getAllWidgetDefs, clearRegistry } from '../registry';
import type { WidgetDefinition } from '../../types';

const stub: WidgetDefinition = {
  resource: 'youtube',
  label: 'YouTube',
  component: () => null,
};

describe('widget registry', () => {
  beforeEach(() => clearRegistry());

  it('registers and retrieves a widget', () => {
    registerWidget(stub);
    expect(getWidgetDef('youtube')).toBe(stub);
  });

  it('returns undefined for unregistered resource', () => {
    expect(getWidgetDef('image')).toBeUndefined();
  });

  it('lists all registered widgets', () => {
    registerWidget(stub);
    registerWidget({ ...stub, resource: 'image', label: 'Image' });
    expect(getAllWidgetDefs()).toHaveLength(2);
  });
});
