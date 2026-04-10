// src/layout/types.ts

/** CSS value with unit, e.g. "10px", "5%" */
export type CssValue = string;

export type WidgetBounds = {
  marginTop?: CssValue;
  marginRight?: CssValue;
  marginBottom?: CssValue;
  marginLeft?: CssValue;
  align?:
    | 'top-left'
    | 'top-center'
    | 'top-right'
    | 'center-left'
    | 'center'
    | 'center-right'
    | 'bottom-left'
    | 'bottom-center'
    | 'bottom-right';
};

export type WidgetRef = {
  widgetId: string;
  resource: string;
  content: { value: string };
  config: Record<string, unknown>;
  bounds?: WidgetBounds;
};

export type LeafNode = {
  id: string;
  type: 'leaf';
  widget?: WidgetRef;
};

export type SplitterNode = {
  id: string;
  type: 'splitter';
  direction: 'horizontal' | 'vertical';
  /** Percentages, always length === children.length, sum === 100 */
  sizes: number[];
  children: LayoutNode[];
};

// ─── Layout modes ─────────────────────────────────────────────────────────────

export type LayoutMode = 'viewport' | 'scroll';

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

export type GridColumn = {
  id: string;
  size: string;
  child: LayoutNode;
};

export type GridRoot = {
  id: string;
  type: 'grid';
  columns: GridColumn[];
  headerSections: SectionNode[];
  footerSections: SectionNode[];
};

export type LayoutNode =
  | LeafNode
  | SplitterNode
  | SectionNode
  | ScrollRoot
  | GridRoot;

export type SplitDirection = 'left' | 'right' | 'top' | 'bottom';
