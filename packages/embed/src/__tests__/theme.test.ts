import { describe, it, expect } from 'vitest';
import { themeToStyleVars } from '../theme';

describe('themeToStyleVars', () => {
  it('returns empty object for undefined theme', () => {
    expect(themeToStyleVars(undefined)).toEqual({});
  });

  it('maps string properties to CSS variables', () => {
    const result = themeToStyleVars({
      colorPrimary: '#ff0000',
      fontFamily: 'Inter',
    });
    expect(result).toEqual({
      '--al-color-primary': '#ff0000',
      '--al-font-family': 'Inter',
    });
  });

  it('maps number properties with px suffix', () => {
    const result = themeToStyleVars({
      fontSize: 16,
      borderRadius: 8,
      spacing: 4,
    });
    expect(result).toEqual({
      '--al-font-size': '16px',
      '--al-border-radius': '8px',
      '--al-spacing': '4px',
    });
  });

  it('skips undefined values', () => {
    const result = themeToStyleVars({
      colorPrimary: '#000',
      colorBg: undefined,
    });
    expect(result).toEqual({
      '--al-color-primary': '#000',
    });
  });
});
