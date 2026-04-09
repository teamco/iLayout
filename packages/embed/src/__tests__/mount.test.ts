import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('mount', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('mounts into element with data-widget-layout', async () => {
    document.body.innerHTML = '<div data-widget-layout="test-id"></div>';

    const { scanAndMount } = await import('../mount');
    scanAndMount();

    const el = document.querySelector('[data-widget-layout]');
    expect(el!.children.length).toBeGreaterThan(0);
  });

  it('mounts into element with data-widget-layout-url', async () => {
    document.body.innerHTML = '<div data-widget-layout-url="https://example.com/l.json"></div>';

    vi.spyOn(globalThis, 'fetch').mockReturnValue(new Promise(() => {}));

    const { scanAndMount } = await import('../mount');
    scanAndMount();

    const el = document.querySelector('[data-widget-layout-url]');
    expect(el!.children.length).toBeGreaterThan(0);
  });

  it('parses data-theme JSON', async () => {
    document.body.innerHTML = `<div data-widget-layout="x" data-theme='{"colorPrimary":"red"}'></div>`;

    const { scanAndMount } = await import('../mount');
    scanAndMount();

    const root = document.querySelector('.al-root') as HTMLElement;
    expect(root).not.toBeNull();
  });
});
