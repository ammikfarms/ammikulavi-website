import { act, render, type RenderResult } from "@testing-library/react";
import type * as React from "react";
import {
  RouterProvider,
  createRootRoute,
  createMemoryHistory,
  createRouter,
  type RootRoute,
} from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

type RouteDef = {
  update: (opts: Record<string, unknown>) => unknown;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} & any;

export interface MiniRouteSpec {
  key: string;
  definition: RouteDef;
  /** full route id, e.g. "/auth/login" — mirrors routeTree.gen.ts `update({ id })` */
  id: string;
  /** route path relative to its parent layout route, e.g. "/login" */
  path: string;
  /** parent route key; defaults to the root route */
  parent?: string;
}

export interface MiniRouterSpec {
  routes: MiniRouteSpec[];
  initialPath?: string;
  routeContext?: Record<string, unknown>;
  /** Optional component for the root layout route (defaults to <Outlet />). */
  rootComponent?: React.ComponentType;
}

/**
 * Builds a lightweight router around the real file-defined route modules so
 * components that call `Link`/`useNavigate`/`useRouterState` have a working
 * router context — without the SSR `<html>`/`<body>` shell (defined in
 * `src/routes/__root.tsx`) that cannot be mounted into jsdom's document.
 *
 * Route keys must be ordered so parents appear before their children, matching
 * how `routeTree.gen.ts` wires routes with explicit `id`/`path`/`getParentRoute`
 * and one `_addFileChildren` call per parent.
 */
export async function renderMiniApp(spec: MiniRouterSpec): Promise<{
  router: ReturnType<typeof createRouter>;
  result: RenderResult;
}> {
  const root = createRootRoute({
    component: spec.rootComponent,
  }) as RootRoute;

  const nodes: Record<string, unknown> = { __root: root };

  // 1. Create every route bound to its parent key (order matters: parents first).
  const updated = spec.routes.map((r) => {
    if (!nodes[r.parent ?? "__root"]) {
      throw new Error(
        `renderMiniApp: parent route "${r.parent}" for "${r.key}" not found — order routes parents-first`,
      );
    }
    const route = r.definition.update({
      id: r.id,
      path: r.path,
      getParentRoute: () => nodes[r.parent ?? "__root"],
    });
    nodes[r.key] = route;
    return { ...r, route };
  });

  // 2. Attach children to each parent once (addChildren replaces, never appends).
  const childrenByParent = new Map<string, Record<string, unknown>>();
  for (const u of updated) {
    const parentKey = u.parent ?? "__root";
    if (!childrenByParent.has(parentKey)) childrenByParent.set(parentKey, {});
    childrenByParent.get(parentKey)![u.key] = u.route;
  }
  for (const [parentKey, children] of childrenByParent) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (nodes[parentKey] as any)._addFileChildren(children);
  }

  const queryClient = new QueryClient();
  const router = createRouter({
    routeTree: root as never,
    context: { queryClient, ...spec.routeContext },
    history: createMemoryHistory({
      initialEntries: [spec.initialPath ?? "/"],
    }),
    scrollRestoration: false,
  });

  const result = await act(async () => {
    const rendered = render(
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>,
    );
    // Let the router finish matching/loading and flush React updates so later
    // assertions run without "not wrapped in act()" noise.
    await new Promise((resolve) => setTimeout(resolve, 0));
    return rendered;
  });
  return { router: router as ReturnType<typeof createRouter>, result };
}
