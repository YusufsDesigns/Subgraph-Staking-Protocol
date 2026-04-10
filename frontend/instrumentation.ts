export async function register() {
  // Turbopack's SSR worker injects a broken localStorage stub
  // (warns: "--localstorage-file was provided without a valid path").
  // wagmi / WalletConnect call localStorage.getItem() synchronously during
  // module evaluation, crashing SSR with "localStorage.getItem is not a function".
  // Replace ONLY the storage objects — do NOT create a fake `window`, which
  // would confuse Next.js into treating SSR as a browser environment.
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const store = new Map<string, string>()

    const mockStorage: Storage = {
      getItem: (key) => store.get(key) ?? null,
      setItem: (key, value) => { store.set(key, String(value)) },
      removeItem: (key) => { store.delete(key) },
      clear: () => store.clear(),
      key: (index) => Array.from(store.keys())[index] ?? null,
      get length() { return store.size },
    }

    for (const name of ["localStorage", "sessionStorage"] as const) {
      try {
        Object.defineProperty(globalThis, name, {
          value: mockStorage,
          writable: true,
          configurable: true,
        })
      } catch {
        ;(globalThis as unknown as Record<string, unknown>)[name] = mockStorage
      }
    }
  }
}
