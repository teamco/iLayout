// packages/embed/src/mount.ts
import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { WidgetLayout } from './WidgetLayout';
import type { WidgetLayoutProps } from './WidgetLayout';
import type { WidgetLayoutTheme } from './types';
import './widgets/init';

function parseTheme(attr: string | null): WidgetLayoutTheme | undefined {
  if (!attr) return undefined;
  try {
    return JSON.parse(attr) as WidgetLayoutTheme;
  } catch {
    console.warn('[anthill-layout] Invalid data-theme JSON:', attr);
    return undefined;
  }
}

function propsFromElement(el: Element): WidgetLayoutProps {
  const layoutId = el.getAttribute('data-widget-layout') ?? undefined;
  const layoutUrl = el.getAttribute('data-widget-layout-url') ?? undefined;
  const fullPage = el.getAttribute('data-full-page') === 'true';
  const theme = parseTheme(el.getAttribute('data-theme'));
  const apiBase = el.getAttribute('data-api-base') ?? undefined;
  const apiKey = el.getAttribute('data-api-key') ?? undefined;

  return { layoutId, layoutUrl, fullPage, theme, apiBase, apiKey };
}

export function mount(el: Element, props: WidgetLayoutProps): void {
  const root = createRoot(el);
  root.render(createElement(WidgetLayout, props));
}

export function scanAndMount(): void {
  const elements = document.querySelectorAll(
    '[data-widget-layout], [data-widget-layout-url]',
  );
  elements.forEach((el) => {
    mount(el, propsFromElement(el));
  });
}
