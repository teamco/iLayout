import { describe, it, expect } from 'vitest';
import { snapToGrid, getGridEdges } from '../snapToGrid';

const COLUMNS = 24;
const GUTTER = 16;

describe('getGridEdges', () => {
  it('returns both sides of each gutter', () => {
    const edges = getGridEdges(1000, COLUMNS, GUTTER);
    // 24 columns → 23 gutters → 23*2 inner edges + 0 + canvasSize = 48
    expect(edges.length).toBe(2 * (COLUMNS - 1) + 2);
    expect(edges[0]).toBeCloseTo(0);
    const colWidth = (1000 - 23 * GUTTER) / COLUMNS; // ≈ 26.333
    // First inner edges: right edge of col 1, left edge of col 2
    expect(edges[1]).toBeCloseTo(colWidth);            // ≈ 26.333
    expect(edges[2]).toBeCloseTo(colWidth + GUTTER);   // ≈ 42.333
    expect(edges[edges.length - 1]).toBeCloseTo(1000);
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

  it('handles multi-panel clamping without negative sizes', () => {
    // Three panels, two very small — clamping should not produce negatives
    const sizes = [5, 5, 990];
    const result = snapToGrid(sizes, 0, 1000, COLUMNS, GUTTER);
    expect(result.every(s => s >= 0)).toBe(true);
    expect(result.reduce((a, b) => a + b, 0)).toBeCloseTo(1000);
  });
});
