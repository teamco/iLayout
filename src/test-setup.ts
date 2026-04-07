// src/test-setup.ts
import '@testing-library/jest-dom';

type StorageLike = Pick<
  Storage,
  'getItem' | 'setItem' | 'removeItem' | 'clear' | 'key' | 'length'
>;

function createMemoryStorage(): StorageLike {
  const store = new Map<string, string>();

  return {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null;
    },
    key(index: number) {
      return Array.from(store.keys())[index] ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(key, String(value));
    },
  };
}

function ensureStorage(name: 'localStorage' | 'sessionStorage') {
  const current = globalThis[name];

  if (
    current &&
    typeof current.getItem === 'function' &&
    typeof current.setItem === 'function' &&
    typeof current.removeItem === 'function' &&
    typeof current.clear === 'function'
  ) {
    return;
  }

  Object.defineProperty(globalThis, name, {
    configurable: true,
    value: createMemoryStorage(),
  });
}

ensureStorage('localStorage');
ensureStorage('sessionStorage');
