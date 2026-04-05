import { useId } from 'react';
import { useGridContext } from '@/layout/grid/GridContext';
import styles from './GridOverlay.module.less';

const FILL = 'rgba(24, 144, 255, 0.08)';

export function GridOverlay() {
  const patternId = useId();
  const { canvasWidth, canvasHeight, columns, gutter } = useGridContext();

  if (canvasWidth <= 0) return null;

  const colWidth = (canvasWidth - (columns - 1) * gutter) / columns;
  const patternWidth = colWidth + gutter;

  return (
    <div className={styles.overlay}>
      <svg width={canvasWidth} height={canvasHeight}>
        <defs>
          <pattern
            id={patternId}
            x="0"
            y="0"
            width={patternWidth}
            height={canvasHeight}
            patternUnits="userSpaceOnUse"
          >
            <rect x="0" y="0" width={colWidth} height={canvasHeight} fill={FILL} />
          </pattern>
        </defs>
        <rect width={canvasWidth} height={canvasHeight} fill={`url(#${patternId})`} />
      </svg>
    </div>
  );
}
