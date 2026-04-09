import type { WidgetLayoutTheme } from './types';

const THEME_MAP: Record<keyof WidgetLayoutTheme, { var: string; unit?: string }> = {
  colorPrimary: { var: '--al-color-primary' },
  colorBg: { var: '--al-color-bg' },
  colorText: { var: '--al-color-text' },
  colorBorder: { var: '--al-color-border' },
  fontFamily: { var: '--al-font-family' },
  fontSize: { var: '--al-font-size', unit: 'px' },
  borderRadius: { var: '--al-border-radius', unit: 'px' },
  spacing: { var: '--al-spacing', unit: 'px' },
};

export function themeToStyleVars(
  theme: WidgetLayoutTheme | undefined,
): Record<string, string> {
  if (!theme) return {};

  const vars: Record<string, string> = {};

  for (const [key, mapping] of Object.entries(THEME_MAP)) {
    const value = theme[key as keyof WidgetLayoutTheme];
    if (value === undefined) continue;
    vars[mapping.var] = mapping.unit ? `${value}${mapping.unit}` : String(value);
  }

  return vars;
}
