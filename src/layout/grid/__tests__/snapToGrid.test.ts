import { describe, it, expect } from 'vitest';
import { snapToGrid, getGridEdges } from '../snapToGrid';

const COLUMNS = 24;
const GUTTER = 16;

describe('getGridEdges', () => {
  it('returns correct edges for a 1000px canvas', () => {
    const edges = getGridEdges(1000, COLUMNS, GUTTER);
    expect(edges.length).toBe(COLUMNS + 1);
    expect(edges[0]).toBeCloseTo(0);
    expect(edges[1]).toBeCloseTo(26.333 + GUTTER);
    expect(edges[COLUMNS]).toBeCloseTo(1000);
  });
});

describe('snapToGrid', () => {
  it('returns input unchanged when canvas is too small', () => {
    const sizes = [50, 50];
    const result = snapToGrid(sizes, 0, 100, COLUMNS, GUTTER);
    expect(result).toEqual(sizes);
  });

  it('returns input unchanged for a single panel', () => {
    const sizes = [500];
    const result = snapToGrid(sizes, 0, 1000, COLUMNS, GUTTER);
    expect(result).toEqual(sizes);
  });

  it('snaps two equal panels to nearest grid edge', () => {
    const sizes = [500, 500];
    const result = snapToGrid(sizes, 0, 1000, COLUMNS, GUTTER);
    expect(result[0] + result[1]).toBeCloseTo(1000);
    const edges = getGridEdges(1000, COLUMNS, GUTTER);
    const snappedBoundary = result[0];
    const isOnEdge = edges.some(e => Math.abs(e - snappedBoundary) < 0.5);
    expect(isOnEdge).toBe(true);
  });

  it('preserves total size', () => {
    const sizes = [300, 400, 300];
    const result = snapToGrid(sizes, 0, 1000, COLUMNS, GUTTER);
    const inputSum = sizes.reduce((a, b) => a + b, 0);
    const outputSum = result.reduce((a, b) => a + b, 0);
    expect(outputSum).toBeCloseTo(inputSum);
  });

  it('handles non-zero container offset', () => {
    const sizes = [150, 150];
    const result = snapToGrid(sizes, 200, 1000, COLUMNS, GUTTER);
    expect(result[0] + result[1]).toBeCloseTo(300);
    const edges = getGridEdges(1000, COLUMNS, GUTTER);
    const snappedAbsBoundary = 200 + result[0];
    const isOnEdge = edges.some(e => Math.abs(e - snappedAbsBoundary) < 0.5);
    expect(isOnEdge).toBe(true);
  });

  it('enforces minimum panel size of one column width', () => {
    const colWidth = (1000 - 23 * GUTTER) / COLUMNS;
    const sizes = [5, 995];
    const result = snapToGrid(sizes, 0, 1000, COLUMNS, GUTTER);
    expect(result[0]).toBeGreaterThanOrEqual(colWidth - 0.5);
    expect(result[0] + result[1]).toBeCloseTo(1000);
  });
});
