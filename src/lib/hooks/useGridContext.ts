import { createContext, useContext } from 'react';

export type GridContextValue = {
  canvasWidth: number;
  canvasHeight: number;
  columns: number;
  gutter: number;
  rows: number;
  rowGutter: number;
};

export const GridContext = createContext<GridContextValue>({
  canvasWidth: 0,
  canvasHeight: 0,
  columns: 24,
  gutter: 16,
  rows: 24,
  rowGutter: 16,
});

export function useGridContext() {
  return useContext(GridContext);
}
