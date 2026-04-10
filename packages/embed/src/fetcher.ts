import type { LayoutNode } from './types';

const DEFAULT_API_BASE = import.meta.env.VITE_SUPABASE_URL as
  | string
  | undefined;
const DEFAULT_API_KEY = import.meta.env
  .VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY as string | undefined;

export type FetchOptions = {
  layout?: LayoutNode;
  layoutUrl?: string;
  layoutId?: string;
  apiBase?: string;
  apiKey?: string;
};

type CacheEntry = { data: LayoutNode; timestamp: number };

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const cache = new Map<string, CacheEntry>();
const inflight = new Map<string, Promise<LayoutNode>>();

export function clearCache(): void {
  cache.clear();
  inflight.clear();
}

function getCached(key: string): LayoutNode | undefined {
  const entry = cache.get(key);
  if (!entry) return undefined;
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    cache.delete(key);
    return undefined;
  }
  return entry.data;
}

function setCache(key: string, data: LayoutNode): void {
  cache.set(key, { data, timestamp: Date.now() });
}

async function fetchFromUrl(url: string): Promise<LayoutNode> {
  const res = await fetch(url);
  if (!res.ok)
    throw new Error(`Failed to fetch layout: ${res.status} ${res.statusText}`);
  return res.json() as Promise<LayoutNode>;
}

async function fetchFromApi(
  layoutId: string,
  apiBase: string,
  apiKey: string,
): Promise<LayoutNode> {
  const url = `${apiBase}/rest/v1/layouts?id=eq.${encodeURIComponent(layoutId)}&status=eq.published&order=version.desc&limit=1`;
  const res = await fetch(url, {
    headers: {
      apikey: apiKey,
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok)
    throw new Error(`Failed to fetch layout: ${res.status} ${res.statusText}`);
  const rows = (await res.json()) as Array<{ data: LayoutNode }>;
  if (rows.length === 0) throw new Error(`Layout not found: ${layoutId}`);
  return rows[0].data;
}

async function doFetch(opts: FetchOptions): Promise<LayoutNode> {
  if (opts.layout) return opts.layout;

  if (opts.layoutUrl) return fetchFromUrl(opts.layoutUrl);

  if (opts.layoutId) {
    const apiBase = opts.apiBase ?? DEFAULT_API_BASE;
    const apiKey = opts.apiKey ?? DEFAULT_API_KEY;
    if (!apiBase)
      throw new Error(
        'apiBase is required when using layoutId (set VITE_SUPABASE_URL at build time or pass apiBase prop)',
      );
    if (!apiKey)
      throw new Error(
        'apiKey is required when using layoutId (set VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY at build time or pass apiKey prop)',
      );
    return fetchFromApi(opts.layoutId, apiBase, apiKey);
  }

  throw new Error('No layout source provided');
}

export async function fetchLayout(opts: FetchOptions): Promise<LayoutNode> {
  // Inline layout — no caching needed
  if (opts.layout) return opts.layout;

  const key = opts.layoutUrl ?? `api:${opts.layoutId}`;

  // Check cache
  const cached = getCached(key);
  if (cached) return cached;

  // Deduplicate concurrent requests
  const existing = inflight.get(key);
  if (existing) return existing;

  const promise = doFetch(opts)
    .then((data) => {
      setCache(key, data);
      inflight.delete(key);
      return data;
    })
    .catch((err: unknown) => {
      inflight.delete(key);
      throw err;
    });

  inflight.set(key, promise);
  return promise;
}
