import { useRef, useState, useEffect, useCallback } from 'react';
import styles from './GridOverlay.module.less';

const COLUMNS = 24;
const GUTTER = 16;
const FILL = 'rgba(24, 144, 255, 0.08)';

export function GridOverlay() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);

  const measure = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    setWidth(el.clientWidth);
    setHeight(el.clientHeight);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [measure]);

  const colWidth = width > 0 ? (width - (COLUMNS - 1) * GUTTER) / COLUMNS : 0;
  const patternWidth = colWidth + GUTTER;

  return (
    <div ref={containerRef} className={styles.overlay}>
      {width > 0 && (
        <svg width={width} height={height}>
          <defs>
            <pattern
              id="grid-col"
              x="0"
              y="0"
              width={patternWidth}
              height={height}
              patternUnits="userSpaceOnUse"
            >
              <rect x="0" y="0" width={colWidth} height={height} fill={FILL} />
            </pattern>
          </defs>
          <rect width={width} height={height} fill="url(#grid-col)" />
        </svg>
      )}
    </div>
  );
}
