// src/layout/dnd/DragActiveContext.tsx
import { createContext, useContext } from 'react';

export const DragActiveContext = createContext(false);

export function useDragActive(): boolean {
  return useContext(DragActiveContext);
}
