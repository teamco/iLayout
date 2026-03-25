// src/layout/types.ts

export type WidgetBounds = {
  width?: number | string;
  height?: number | string;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  align?:
    | 'top-left' | 'top-center' | 'top-right'
    | 'center-left' | 'center' | 'center-right'
    | 'bottom-left' | 'bottom-center' | 'bottom-right';
};

export type WidgetRef = {
  widgetId: string;
  type: 'iframe' | 'component' | 'embed';
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

export type LayoutNode = LeafNode | SplitterNode;

export type SplitDirection = 'left' | 'right' | 'top' | 'bottom';
