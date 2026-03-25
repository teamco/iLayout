// src/layout/storage/localStorageAdapter.ts
import type { LayoutStorage } from './types';
import type { LayoutNode } from '../types';

const KEY = (id: string) => `layout:${id}`;

export const localStorageAdapter: LayoutStorage = {
  async load(layoutId) {
    const raw = localStorage.getItem(KEY(layoutId));
    return raw ? (JSON.parse(raw) as LayoutNode) : null;
  },
  async save(layoutId, root) {
    localStorage.setItem(KEY(layoutId), JSON.stringify(root));
  },
};
