import { vi } from "vitest";

/**
 * A small, controllable mock of the subset of the Supabase client used by
 * this app (`@/integrations/supabase/client`). It supports chained PostgREST
 * builders for `.from(...)`, plus `auth`, `rpc` and `storage` surfaces.
 *
 * Each table's chain resolves to `{ data, error }` supplied by the caller via
 * `tableResults`. Resolution is deferred so tests can override after render.
 */

type QueryResult = { data?: unknown; error?: unknown; count?: number | null };

export interface FakeBuilder {
  select: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  gte: ReturnType<typeof vi.fn>;
  order: ReturnType<typeof vi.fn>;
  limit: ReturnType<typeof vi.fn>;
  maybeSingle: ReturnType<typeof vi.fn>;
  single: ReturnType<typeof vi.fn>;
  upsert: ReturnType<typeof vi.fn>;
  _result: () => Promise<QueryResult>;
}

type AsyncOrSync<T> = T | Promise<T>;

function chainOf(resolve: () => QueryResult) {
  const builder: Record<string, unknown> = {};
  const method = (name: string) =>
    vi.fn(() => {
      if (name === "then") return builder;
      return builder;
    });

  for (const m of [
    "select",
    "insert",
    "update",
    "delete",
    "eq",
    "gte",
    "order",
    "limit",
    "maybeSingle",
    "single",
    "upsert",
  ]) {
    builder[m] = method(m);
  }

  builder._result = () => Promise.resolve(resolve());
  builder.then = async (onFulfilled: (v: QueryResult) => unknown) =>
    onFulfilled(await builder._result());

  return builder as unknown as FakeBuilder;
}

export interface FakeSupabase {
  from: ReturnType<typeof vi.fn>;
  rpc: ReturnType<typeof vi.fn>;
  auth: {
    getUser: ReturnType<typeof vi.fn>;
    getSession: ReturnType<typeof vi.fn>;
    signInWithPassword: ReturnType<typeof vi.fn>;
    signOut: ReturnType<typeof vi.fn>;
    onAuthStateChange: ReturnType<typeof vi.fn>;
  };
  storage: {
    from: ReturnType<typeof vi.fn>;
  };
  tableResults: Record<string, () => QueryResult>;
  rpcResults: Record<string, () => QueryResult>;
  storageBuckets: Record<string, Record<string, () => QueryResult>>;
}

export function createFakeSupabase(): FakeSupabase {
  const tableResults: Record<string, () => QueryResult> = {};
  const rpcResults: Record<string, () => QueryResult> = {};
  const storageBuckets: Record<string, Record<string, () => QueryResult>> = {};

  const rpc = vi.fn((fn: string) => {
    const resolve = rpcResults[fn] ?? (() => ({ data: null, error: null }));
    return chainOf(resolve);
  });

  const from = vi.fn((table: string) => {
    const resolve = tableResults[table] ?? (() => ({ data: null, error: null }));
    const builder = chainOf(resolve);
    // Expose every builder created for a table so tests can find the one a
    // mutation used (refetches overwrite __lastBuilders, so keep them all).
    // @ts-expect-error test hook
    from.__allBuilders ??= {};
    // @ts-expect-error test hook
    from.__allBuilders[String(table)] ??= [];
    // @ts-expect-error test hook
    from.__allBuilders[String(table)].push(builder);
    // @ts-expect-error test hook
    from.__lastBuilders ??= {};
    // @ts-expect-error test hook
    from.__lastBuilders[String(table)] = builder;
    return builder;
  });

  const storageOps: Record<string, Record<string, unknown>> = {};
  const storageFrom = vi.fn((bucket: string) => {
    const overrides = storageBuckets[bucket] ?? {};
    // Cache per bucket so multiple .from() calls share the same remove/upload
    // mocks — the app calls storage.from() separately for upload, public URL
    // and delete, and tests need to observe those calls.
    storageOps[bucket] ??= {
      remove: vi.fn(() => Promise.resolve({ error: null, data: null })),
      upload: vi.fn(() => Promise.resolve({ error: null, data: null })),
      getPublicUrl: vi.fn(() => ({
        data: { publicUrl: `https://cdn.example/${bucket}/x`, path: "x" },
      })),
      createSignedUrls: vi.fn(() => Promise.resolve({ error: null, data: [] })),
      ...overrides,
    };
    return storageOps[bucket];
  });

  return {
    from,
    rpc,
    auth: {
      getUser: vi.fn(async () => ({ data: { user: null }, error: null })),
      getSession: vi.fn(async () => ({ data: { session: null }, error: null })),
      signInWithPassword: vi.fn(async () => ({ data: {}, error: null })),
      signOut: vi.fn(async () => ({ error: null })),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
    storage: { from: storageFrom },
    tableResults,
    rpcResults,
    storageBuckets,
  };
}
