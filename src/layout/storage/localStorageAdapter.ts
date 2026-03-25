// src/layout/storage/localStorageAdapter.ts
import type { LayoutStorage } from './types';
import type { LayoutNode } from '../types';

const KEY = (id: string) => `layout:${id}`;

export const localStorageAdapter: LayoutStorage = {
  async load(layoutId) {
    const raw = localStorage.getItem(KEY(layoutId));
    if (!raw) return null;
    try {
      return JSON.parse(raw) as LayoutNode;
    } catch {
      return null;
    }
  },
  async save(layoutId, root) {
    localStorage.setItem(KEY(layoutId), JSON.stringify(root));
  },
};
