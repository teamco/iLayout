import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchLayout, clearCache } from '../fetcher';
import type { LayoutNode } from '../types';

const mockLeaf: LayoutNode = { id: 'leaf-1', type: 'leaf' };

describe('fetchLayout', () => {
  beforeEach(() => {
    clearCache();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns inline layout directly', async () => {
    const result = await fetchLayout({ layout: mockLeaf });
    expect(result).toBe(mockLeaf);
  });

  it('fetches layout from URL', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(mockLeaf), { status: 200 }),
    );

    const result = await fetchLayout({ layoutUrl: 'https://example.com/layout.json' });
    expect(result).toEqual(mockLeaf);
    expect(fetch).toHaveBeenCalledWith('https://example.com/layout.json');
  });

  it('fetches layout by ID from API', async () => {
    const apiResponse = [{ data: mockLeaf }];
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(apiResponse), { status: 200 }),
    );

    const result = await fetchLayout({
      layoutId: 'abc-123',
      apiBase: 'https://api.test.com',
      apiKey: 'test-key',
    });

    expect(result).toEqual(mockLeaf);
    expect(fetch).toHaveBeenCalledWith(
      'https://api.test.com/rest/v1/layouts?id=eq.abc-123&status=eq.published&order=version.desc&limit=1',
      {
        headers: {
          apikey: 'test-key',
          'Content-Type': 'application/json',
        },
      },
    );
  });

  it('prioritizes layout > layoutUrl > layoutId', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const result = await fetchLayout({
      layout: mockLeaf,
      layoutUrl: 'https://example.com/layout.json',
      layoutId: 'abc-123',
    });
    expect(result).toBe(mockLeaf);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('caches results by key', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(mockLeaf), { status: 200 }),
    );

    const r1 = await fetchLayout({ layoutUrl: 'https://example.com/a.json' });
    const r2 = await fetchLayout({ layoutUrl: 'https://example.com/a.json' });
    expect(r1).toEqual(r2);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('deduplicates concurrent requests', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(mockLeaf), { status: 200 }),
    );

    const [r1, r2] = await Promise.all([
      fetchLayout({ layoutUrl: 'https://example.com/b.json' }),
      fetchLayout({ layoutUrl: 'https://example.com/b.json' }),
    ]);
    expect(r1).toEqual(r2);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('throws on fetch failure', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response('Not Found', { status: 404 }),
    );

    await expect(
      fetchLayout({ layoutUrl: 'https://example.com/missing.json' }),
    ).rejects.toThrow();
  });

  it('throws when API returns empty result', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify([]), { status: 200 }),
    );

    await expect(
      fetchLayout({ layoutId: 'missing-id', apiBase: 'https://api.test.com', apiKey: 'key' }),
    ).rejects.toThrow('Layout not found: missing-id');
  });

  it('throws when no source provided', async () => {
    await expect(fetchLayout({})).rejects.toThrow(
      'No layout source provided',
    );
  });
});
