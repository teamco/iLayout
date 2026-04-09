// packages/embed/src/types.ts

// ─── CSS helpers ──────────────────────────────────────────────────────────────

export type CssValue = string;

export type WidgetBounds = {
  marginTop?: CssValue;
  marginRight?: CssValue;
  marginBottom?: CssValue;
  marginLeft?: CssValue;
  align?:
    | 'top-left' | 'top-center' | 'top-right'
    | 'center-left' | 'center' | 'center-right'
    | 'bottom-left' | 'bottom-center' | 'bottom-right';
};

// ─── Widget types ─────────────────────────────────────────────────────────────

export const EWidgetResource = {
  YOUTUBE: 'youtube',
  IMAGE: 'image',
  IFRAME: 'iframe',
  COMPONENT: 'component',
  EMPTY: 'empty',
} as const;
export type EWidgetResource = (typeof EWidgetResource)[keyof typeof EWidgetResource];

export type WidgetContent = {
  value: string;
};

export type WidgetConfig = {
  isEditable: boolean;
  isClonable: boolean;
  css?: WidgetBounds;
};

export type WidgetRef = {
  widgetId: string;
  resource: string;
  content: WidgetContent;
  config: Record<string, unknown>;
  bounds?: WidgetBounds;
};

// ─── Layout tree ──────────────────────────────────────────────────────────────

export type LeafNode = {
  id: string;
  type: 'leaf';
  widget?: WidgetRef;
};

export type SplitterNode = {
  id: string;
  type: 'splitter';
  direction: 'horizontal' | 'vertical';
  sizes: number[];
  children: LayoutNode[];
};

export type SectionHeight =
  | { type: 'auto' }
  | { type: 'fixed'; value: string }
  | { type: 'min'; value: string };

export type SectionNode = {
  id: string;
  type: 'section';
  height: SectionHeight;
  child: LayoutNode;
  overlap?: string;
  zIndex?: number;
};

export type ScrollRoot = {
  id: string;
  type: 'scroll';
  sections: SectionNode[];
};

export type LayoutNode = LeafNode | SplitterNode | SectionNode | ScrollRoot;

// ─── Theme ────────────────────────────────────────────────────────────────────

export type WidgetLayoutTheme = {
  colorPrimary?: string;
  colorBg?: string;
  colorText?: string;
  colorBorder?: string;
  fontFamily?: string;
  fontSize?: number;
  borderRadius?: number;
  spacing?: number;
};

// ─── Widget definition (render-only, no editor/icon) ──────────────────────────

export type WidgetComponentProps = {
  content: WidgetContent;
  config: WidgetConfig;
};

export type WidgetDefinition = {
  resource: EWidgetResource;
  label: string;
  component: React.ComponentType<WidgetComponentProps>;
};
