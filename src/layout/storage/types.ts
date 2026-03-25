// src/layout/storage/types.ts
import type { LayoutNode } from '../types';

export interface LayoutStorage {
  load(layoutId: string): Promise<LayoutNode | null>;
  save(layoutId: string, root: LayoutNode): Promise<void>;
}
