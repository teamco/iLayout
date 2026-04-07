import { useId } from 'react';
import { useGridContext } from '@/layout/grid/GridContext';
import styles from './GridOverlay.module.less';

const COL_FILL = 'rgba(24, 144, 255, 0.08)';
const ROW_FILL = 'rgba(24, 144, 255, 0.06)';

export function GridOverlay() {
  const colPatternId = useId();
  const rowPatternId = useId();
  const { canvasWidth, canvasHeight, columns, gutter, rows, rowGutter } = useGridContext();

  if (canvasWidth <= 0 || canvasHeight <= 0) return null;

  const colWidth = (canvasWidth - (columns - 1) * gutter) / columns;
  const colPatternWidth = colWidth + gutter;

  const rowHeight = (canvasHeight - (rows - 1) * rowGutter) / rows;
  const rowPatternHeight = rowHeight + rowGutter;

  return (
    <div className={styles.overlay}>
      <svg width={canvasWidth} height={canvasHeight}>
        <defs>
          <pattern
            id={colPatternId}
            x="0"
            y="0"
            width={colPatternWidth}
            height={canvasHeight}
            patternUnits="userSpaceOnUse"
          >
            <rect x="0" y="0" width={colWidth} height={canvasHeight} fill={COL_FILL} />
          </pattern>

          <pattern
            id={rowPatternId}
            x="0"
            y="0"
            width={canvasWidth}
            height={rowPatternHeight}
            patternUnits="userSpaceOnUse"
          >
            <rect x="0" y="0" width={canvasWidth} height={rowHeight} fill={ROW_FILL} />
          </pattern>
        </defs>

        <rect width={canvasWidth} height={canvasHeight} fill={`url(#${colPatternId})`} />
        <rect width={canvasWidth} height={canvasHeight} fill={`url(#${rowPatternId})`} />
      </svg>
    </div>
  );
}
