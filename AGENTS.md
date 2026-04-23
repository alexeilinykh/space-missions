<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Project

Next.js 16.2.4 + React 19.2.4, App Router only. Single-app repo, no monorepo, no `src/` — code lives at the root (`app/`, `public/`, `data/`).

## Commands

```
npm run dev      # dev server (Turbopack by default — no flag needed)
npm run build    # production build (also Turbopack)
npm run start    # production server
npm run lint     # runs eslint directly — NOT next lint (removed in v16)
npx tsc --noEmit # typecheck (no dedicated script)
```

No test framework, no CI, no pre-commit hooks.

## Critical Next.js 16 Differences

**Read before touching any Next.js API.** Full upgrade notes: `node_modules/next/dist/docs/01-app/02-guides/upgrading/version-16.md`

### Async-only request APIs (sync access throws)
`params`, `searchParams`, `cookies()`, `headers()`, `draftMode()` are all `Promise`s now.

```tsx
// correct
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
}
// wrong — throws at runtime
export default function Page({ params }: { params: { slug: string } }) { ... }
```

Run `npx next typegen` to generate `PageProps`/`LayoutProps`/`RouteContext` type helpers.

### `middleware.ts` → `proxy.ts`
Rename the file **and** the exported function from `middleware` to `proxy`. Edge runtime is not supported; runtime is always `nodejs`. Config key renamed: `skipMiddlewareUrlNormalize` → `skipProxyUrlNormalize`.

### Turbopack is default
`next dev` and `next build` both use Turbopack. Custom `webpack` config in `next.config.ts` breaks builds unless `--webpack` is passed explicitly.

### Caching API changes
- `revalidateTag` now requires a second `cacheLife` arg: `revalidateTag('tag', 'max')`
- `cacheLife` / `cacheTag` are stable — drop the `unstable_` prefix
- `experimental.dynamicIO` renamed to `cacheComponents` (top-level, not under `experimental`)

### Removed in v16
`next lint`, `serverRuntimeConfig`, `publicRuntimeConfig`, `getConfig()` from `next/config`, AMP support, `experimental.ppr`, `unstable_rootParams`.

### Parallel routes
All `@slot` directories require an explicit `default.js` — builds fail without them.

### `next/image` defaults changed
`minimumCacheTTL`: 60s → 4h. `images.domains` deprecated — use `images.remotePatterns`. Local IP optimization blocked by default.

## Styling

Tailwind CSS v4. Import syntax changed — do **not** use v3 directives:
```css
/* correct */
@import "tailwindcss";

/* wrong (v3 style — does nothing in v4) */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

PostCSS plugin is `@tailwindcss/postcss` (not `tailwindcss`). Custom tokens go in `@theme inline {}` blocks inside CSS.

## TypeScript

- Module resolution: `"bundler"` (not `"node"`)
- Path alias: `@/*` → `./*` (root-relative)
- `.next/dev/types/**/*.ts` is included (dev output separated from build output in v16)

## Local Docs

Authoritative docs for the installed version are at `node_modules/next/dist/docs/`. Key files:

| Topic | Path |
|---|---|
| v16 upgrade guide | `01-app/02-guides/upgrading/version-16.md` |
| Server/Client Components | `01-app/01-getting-started/05-server-and-client-components.md` |
| Caching | `01-app/01-getting-started/08-caching.md` |
| Data fetching | `01-app/01-getting-started/06-fetching-data.md` |
| File conventions | `01-app/03-api-reference/03-file-conventions/` |
| `use cache` directive | `01-app/03-api-reference/01-directives/use-cache.md` |
| AI agents guide | `01-app/02-guides/ai-agents.md` |
