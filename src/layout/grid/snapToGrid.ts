/**
 * Returns absolute pixel positions of grid column left edges (including 0 and canvasSize).
 * For 24 columns there are 25 edges: [0, col1_start, col2_start, ..., canvasSize].
 */
export function getGridEdges(canvasSize: number, columns: number, gutter: number): number[] {
  const colWidth = (canvasSize - (columns - 1) * gutter) / columns;
  const edges: number[] = [0];
  for (let i = 1; i < columns; i++) {
    edges.push(i * (colWidth + gutter));
  }
  edges.push(canvasSize);
  return edges;
}

function findNearestEdge(pos: number, edges: number[]): number {
  let best = edges[0];
  let bestDist = Math.abs(pos - best);
  for (let i = 1; i < edges.length; i++) {
    const dist = Math.abs(pos - edges[i]);
    if (dist < bestDist) {
      best = edges[i];
      bestDist = dist;
    }
  }
  return best;
}

/**
 * Snaps splitter boundaries to the nearest global grid column edge.
 *
 * @param pixelSizes  Raw pixel sizes from antd Splitter onResize
 * @param containerOffset  Pixel offset of this splitter from canvas edge
 * @param canvasSize  Total canvas width (horizontal) or height (vertical)
 * @param columns  Number of grid columns (24)
 * @param gutter  Gutter size in px (16)
 * @returns Snapped pixel sizes with preserved total
 */
export function snapToGrid(
  pixelSizes: number[],
  containerOffset: number,
  canvasSize: number,
  columns: number,
  gutter: number,
): number[] {
  if (pixelSizes.length <= 1) return pixelSizes;

  const minColWidth = (canvasSize - (columns - 1) * gutter) / columns;
  if (minColWidth <= 0) return pixelSizes;

  const totalSize = pixelSizes.reduce((a, b) => a + b, 0);
  const edges = getGridEdges(canvasSize, columns, gutter);

  // Compute absolute boundaries and snap each to nearest grid edge
  const snappedBoundaries: number[] = [];
  let cumulative = 0;
  for (let i = 0; i < pixelSizes.length - 1; i++) {
    cumulative += pixelSizes[i];
    const absPos = containerOffset + cumulative;
    const snapped = findNearestEdge(absPos, edges);
    snappedBoundaries.push(snapped - containerOffset);
  }

  // Convert boundaries back to sizes
  const result: number[] = [];
  let prev = 0;
  for (const boundary of snappedBoundaries) {
    result.push(boundary - prev);
    prev = boundary;
  }
  result.push(totalSize - prev);

  // Clamp: ensure no panel smaller than one column width
  for (let i = 0; i < result.length; i++) {
    if (result[i] < minColWidth) {
      const deficit = minColWidth - result[i];
      result[i] = minColWidth;
      const neighbor = i > 0 ? i - 1 : i + 1;
      if (neighbor < result.length) {
        result[neighbor] -= deficit;
      }
    }
  }

  // Normalize to preserve exact total
  const currentSum = result.reduce((a, b) => a + b, 0);
  if (Math.abs(currentSum - totalSize) > 0.01) {
    const diff = totalSize - currentSum;
    result[result.length - 1] += diff;
  }

  return result;
}
