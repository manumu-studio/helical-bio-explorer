# ADR-007 — Engineering Standards

## Context

`helical-bio-explorer` is a bilingual codebase: Python on the backend, TypeScript on the frontend, with a network boundary and a database in between. Both sides consume external data (HTTP requests, parquet files from S3, database rows, environment variables, URL parameters, user input). Every one of those boundaries is an opportunity for untyped, unvalidated data to leak into the interior of the application.

This ADR records the engineering standards the codebase enforces to prevent that leakage. The central principle is simple: **types are documentation, validation is runtime safety, and both must hold at every external boundary.** Loose typing anywhere on a critical path is a bug waiting for a user to find it.

The rules below are enforced by CI. A change that violates any of them does not merge.

## Decision

### TypeScript (frontend)

**Compiler configuration.** `tsconfig.json` enables the full strict surface:

- `strict: true`
- `noUncheckedIndexedAccess`
- `exactOptionalPropertyTypes`
- `noImplicitReturns`
- `noUnusedLocals`
- `noUnusedParameters`
- `noFallthroughCasesInSwitch`
- `forceConsistentCasingInFileNames`

**Type safety rules.**

- **Zero `any`.** Use `unknown` plus a type guard if the shape is genuinely unknown at compile time.
- **Zero `as` assertions** except `as const` and `satisfies`. Replace casts with Zod parsing, type guards, or generics.
- **Zero non-null assertions (`!.`).** Use optional chaining, explicit `| null` typing, or early returns.
- **Union types over enums** for constrained string values (e.g., `'forward' | 'backward'`).
- **Discriminated unions** for state machines and variant handling.
- **`satisfies`** for type-safe object literals that still want inference.

**Runtime validation at boundaries.** Every `fetch().json()`, every `URLSearchParams` read, every `FormData` parse, every environment variable, and every database row entering the TypeScript side is validated with Zod:

```typescript
import { z } from "zod";

const UserSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
});

const response = await fetch("/api/users/me");
const user = UserSchema.parse(await response.json()); // throws if shape is wrong
```

Never write `as User` on external data. If you find yourself reaching for `as`, the schema is missing.

**Component structure.** Every React component lives in its own folder following a 4-file pattern:

```
ComponentName/
├── ComponentName.tsx        # the component (client/server as needed)
├── ComponentName.types.ts   # exported interfaces — no inline types
├── index.ts                 # barrel export
└── useComponentName.ts      # custom hook, only when state/effects exist
```

Props are always declared as exported interfaces in the `.types.ts` file. The barrel export keeps imports clean (`import { ComponentName } from "@/components/ComponentName"`).

**Imports and exports.**

- **Named exports only.** The only exceptions are Next.js framework files that require default exports: `page.tsx`, `layout.tsx`, `middleware.ts`, `not-found.tsx`, `error.tsx`, `loading.tsx`.
- **`@/*` path alias** for every non-relative import. No deep relative paths (`../../../`).

### Python (backend)

**Module preamble.** Every module starts with:

```python
from __future__ import annotations
```

This normalizes annotation evaluation and allows forward references without string literals.

**Type hints.**

- Full type hints on every function signature, including return types.
- No `Any` without a `# type: ignore[reason]` comment explaining why.
- `mypy --strict` is the floor. CI fails on any error.

**Pydantic v2 at every boundary.**

- **Request bodies** are `BaseModel` subclasses with field validators where needed.
- **Response bodies** are frozen `BaseModel` subclasses (`model_config = ConfigDict(frozen=True)`).
- **Environment variables** are loaded via `pydantic_settings.BaseSettings` with `.env` support and `Field(..., description=...)` per variable. Missing or malformed config fails fast at startup, not at first request.

**Lint rules.** `ruff check` enforces `E, F, I, N, UP, B, SIM, RUF` rule sets. CI fails on any warning.

**Feature-folder layout.** Modules are organized by feature, not by layer:

```
app/features/embeddings/
├── router.py    # @router endpoints — delegates to service
├── service.py   # business logic
├── schemas.py   # Pydantic request/response models
└── deps.py      # FastAPI dependencies (lazy singletons, clients)
```

There is no top-level `app/routers/` + `app/services/` + `app/schemas/` tree. Feature folders keep changes localized.

**Thin routers.** Route handlers parse input, delegate to a service function, and format the response. No business logic in a `@router.get`.

**Error handling.**

- No bare `except:` and no `except Exception:` without a logged, narrowed re-raise.
- Expected domain errors raise typed exceptions caught by a FastAPI exception handler.

**Lazy singletons for expensive clients.** The Helical SDK, data loaders, and any other expensive object is instantiated once behind a module-level `@lru_cache` or a FastAPI dependency. Never instantiate expensive clients per request.

### Shared rules

- **No file exceeds 400 lines.** Refactor at 300. If a file is approaching the limit, the shape of the code is the problem, not the limit.
- **No function exceeds 50 lines** without a comment explaining why.
- **Every source file starts with a one-line header comment** describing what it does.
- **Comments explain *why*, not *what*.** If removing the comment would not confuse a new reader, delete it.
- **Named constants, not magic numbers.** `EMBEDDING_DIM = 256`, not `256` sprinkled through function bodies.
- **Every external input is validated** (Pydantic on Python, Zod on TypeScript). There are no exceptions.
- **Secrets flow through a single typed gate** per side (`lib/env.ts` on the frontend, `app/core/settings.py` on the backend). Both fail fast on load if required variables are missing.

## Quality gates

Every change passes the following before it merges. CI runs the same commands.

### Backend

```bash
ruff check app/ tests/
ruff format --check app/ tests/
mypy --strict app/
pytest -q --cov=app --cov-report=term-missing
```

### Frontend

```bash
npx tsc --noEmit
npx eslint . --ext .ts,.tsx
npx prettier --check .
npx vitest run --coverage
```

### Both

```bash
docker compose config
git diff --check
```

Never bypass these with `--no-verify`, unexplained `# type: ignore`, or `// @ts-expect-error`. If a gate is failing, the fix is the code, not the gate.

## Consequences

**What this buys:**

- External data cannot silently corrupt application state. Every boundary is parsed, not cast.
- Types serve as up-to-date documentation that cannot drift from the code.
- Refactors are safe: the type checker flags every affected call site.
- Onboarding is faster because the rules are explicit and the layout is predictable.
- Business logic stays out of route handlers, which keeps handlers testable and services reusable.

**What this costs:**

- More lines per feature — schemas on both sides of the wire, explicit types on every signature, separate files per component.
- A learning curve for contributors who are used to looser TypeScript or Python.
- Slower first-draft velocity. The trade is fewer defects at the boundary and cheaper refactors later.
- CI enforcement means some changes fail the build on formatting, lint, or typing before the logic even runs.

These trade-offs are deliberate. A codebase that validates its inputs and documents itself through types is cheaper to maintain than one that relies on convention and vigilance.

## Out of scope

The following are **not** enforced as hard rules, either because the cost outweighs the benefit at this scale or because the risk surface does not exist in this project.

- **100% test coverage.** Tests focus on load-bearing logic (service functions, validation, parquet loaders), not on line counts.
- **End-to-end browser matrix.** Chromium-only Playwright is sufficient for the target audience.
- **Formal accessibility audit tooling (pa11y, axe in CI).** Semantic HTML, alt text, and keyboard focus are enforced by review, not by an automated scanner.
- **Edge-runtime deployment.** Node runtime is the target; cold-start latency is not a constraint for this workload.
- **Rate limiting, WAF, external error tracking.** The runtime surface and traffic volume do not justify the integration cost.
- **CSP nonces.** The standard Next.js CSP middleware is sufficient for a read-mostly single-page application.

Each item above can be added later without contradicting any existing decision. None of them is a precondition for the standards above to hold.
