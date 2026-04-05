import { createContext, useContext, useRef, useState, useEffect, useCallback, type ReactNode } from 'react';

export type GridContextValue = {
  canvasWidth: number;
  canvasHeight: number;
  columns: number;
  gutter: number;
};

const GridContext = createContext<GridContextValue>({
  canvasWidth: 0,
  canvasHeight: 0,
  columns: 24,
  gutter: 16,
});

export function useGridContext() {
  return useContext(GridContext);
}

type GridProviderProps = {
  columns?: number;
  gutter?: number;
  children: ReactNode;
};

export function GridProvider({ columns = 24, gutter = 16, children }: GridProviderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasWidth, setCanvasWidth] = useState(0);
  const [canvasHeight, setCanvasHeight] = useState(0);

  const measure = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    setCanvasWidth(el.clientWidth);
    setCanvasHeight(el.clientHeight);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [measure]);

  return (
    <GridContext.Provider value={{ canvasWidth, canvasHeight, columns, gutter }}>
      <div ref={containerRef} data-grid-canvas style={{ width: '100%', height: '100%', position: 'relative' }}>
        {children}
      </div>
    </GridContext.Provider>
  );
}
