# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Immich is a self-hosted photo and video management solution. It is a pnpm monorepo (pnpm 11, Node 24) whose task runner is **mise** — the legacy `Makefile` targets are stubs that just tell you to use mise instead. Tasks are addressed as `mise //<dir>:<task>` from anywhere in the repo (e.g. `mise //server:test`), or `mise <task>` for root tasks.

## Repository Layout

- `server/` — NestJS backend (TypeScript, Express, Kysely + Postgres, BullMQ + Redis)
- `web/` — SvelteKit frontend (Svelte 5, Tailwind CSS 4)
- `mobile/` — Flutter app (Dart, Riverpod, Drift/Isar local DB)
- `machine-learning/` — Python FastAPI service running ONNX models (uv, Python 3.11)
- `e2e/` — end-to-end tests (vitest for API, Playwright for web) against a dockerized stack
- `packages/sdk/` — `@immich/sdk` TypeScript client, **generated** from the OpenAPI spec
- `packages/cli/` — `@immich/cli` bulk-upload command-line tool
- `packages/plugin-core`, `packages/plugin-sdk` — Extism/WASM plugin system
- `open-api/` — `immich-openapi-specs.json` (generated — never edit by hand) and SDK generators
- `i18n/` — translation files; **only edit `i18n/en.json`**, all other locales are managed through Weblate
- `docs/` — Docusaurus documentation site (developer docs in `docs/docs/developer/`)

## Common Commands

Run each workspace's install once before its tests/lints (e.g. `mise //server:install`).

### Server

```bash
mise //server:test              # unit tests (vitest); append a file path to run one file,
                                # e.g. mise //server:test src/services/album.service.spec.ts
mise //server:test-medium       # medium tests (testcontainers, real Postgres)
mise //server:lint              # eslint (--max-warnings 0)
mise //server:format-fix        # prettier
mise //server:check             # tsc --noEmit
mise //server:checklist         # everything CI runs (unit + medium)
```

Equivalent pnpm scripts exist inside `server/` (`pnpm test`, `pnpm run lint`, `pnpm run check:code`, …). Single tests can also be run directly: `pnpm --dir server exec vitest --config test/vitest.config.mjs run src/services/album.service.spec.ts`.

### Web

```bash
mise //web:start                # dev server on port 3000 (builds @immich/sdk first)
mise //web:test                 # vitest unit tests (file path arg to narrow)
mise //web:lint / lint-fix
mise //web:format / format-fix
mise //web:check-svelte         # svelte-check
mise //web:check-typescript     # tsc --noEmit
mise //web:checklist            # all web checks
```

### Machine Learning

```bash
mise //machine-learning:test        # pytest with coverage
mise //machine-learning:lint        # ruff check
mise //machine-learning:format      # ruff format
mise //machine-learning:check       # mypy --strict
mise //machine-learning:checklist
```

### Mobile

```bash
mise //mobile:codegen           # build_runner codegen — run after changing annotated Dart code
mise //mobile:lint / lint-fix   # Dart analyzer + DCM
mise //mobile:format
mise //mobile:test
mise //mobile:checklist
```

### E2E

```bash
mise //e2e:ci-setup             # one-time: installs e2e, SDK, and CLI deps
mise e2e                        # start dockerized test stack (from repo root)
mise //e2e:test                 # API e2e tests (vitest)
mise //e2e:test-web             # web e2e tests (Playwright)
```

### Full dev environment

```bash
mise dev            # docker compose dev stack (server, web, ML, Postgres, Redis)
mise dev-down       # tear down
mise dev-update     # rebuild containers
```

## Server Architecture

The server loosely follows hexagonal architecture. The request path is:

**controller → service → repository**

- `src/controllers/` — HTTP endpoints only; validation and auth happen via decorators/DTOs. Endpoints follow standard CRUD per resource.
- `src/services/` — all business logic. Services extend `base.service.ts` (which wires up repositories) and have colocated `*.service.spec.ts` unit tests.
- `src/repositories/` — the only layer touching technology specifics (Postgres via Kysely, Redis, filesystem, ML service HTTP calls, exiftool, ffmpeg, …).
- `src/dtos/` — request/response DTOs. These define the OpenAPI schema, which in turn defines every generated client (web SDK, Dart SDK, CLI).
- `src/schema/` — Kysely database schema definitions (`tables/`, `enums.ts`) plus `migrations/`.
- `src/workers/` — the server runs as separate workers: `api.ts` (HTTP) and `microservices.ts` (background jobs from the BullMQ/Redis queue: thumbnails, metadata extraction, transcoding, smart search, facial recognition, …), plus `maintenance.ts`.

### Database migrations

Migrations are generated from schema changes, not written first:

1. Edit `server/src/schema/` (tables/enums).
2. `mise //server:migrations generate <migration-name>`
3. Review the generated file and move it into `server/src/schema/migrations/`.
4. Migrations run automatically at server startup. `mise //server:migrations revert` rolls back the latest one.

### OpenAPI flow

Changing any controller/DTO changes the API surface. Regenerate everything with:

```bash
mise open-api
```

This rebuilds the server, syncs `open-api/immich-openapi-specs.json`, and regenerates the TypeScript SDK (`packages/sdk/src/fetch-client.ts`, via oazapfts) and the Dart SDK (`mobile/openapi/`). Never hand-edit the spec or generated clients; commit the regenerated output alongside your API change.

## Web Architecture

SvelteKit app in `web/src/`:

- `routes/` — pages (SvelteKit file-based routing)
- `lib/components/`, `lib/modals/`, `lib/elements/` — UI (shared primitives come from the external `@immich/ui` library)
- `lib/services/` — API calls through `@immich/sdk`
- `lib/stores/`, `lib/managers/` — state
- All user-facing strings go through svelte-i18n with keys in `i18n/en.json` (ICU message format).

## Mobile Architecture

New code follows a layered architecture (docs/docs/developer/architecture.mdx): repositories are the only place foreign data classes (OpenAPI DTOs, DB entities) may be used internally, and their interfaces must not expose them. State management is Riverpod; newer code lives under `lib/domain/`, `lib/infrastructure/`, and `lib/presentation/`, while older code sits in `lib/pages/`, `lib/services/`, etc. Run `mise //mobile:codegen` after modifying code that relies on generated files (`*.g.dart`, Drift, router).

## Conventions and Constraints

- Keep PRs small and focused — one thing per PR.
- **Feature freezes** (PRs in these areas are rejected except minor bug fixes): Sharing/Asset ownership, and (External) libraries.
- Lint runs with `--max-warnings 0` everywhere; formatting is enforced by Prettier (TS), ruff (Python), and dart format.
- Only edit `i18n/en.json` for translations; other languages come from Weblate.
- Generated artifacts to never hand-edit: `open-api/immich-openapi-specs.json`, `packages/sdk/src/fetch-client.ts`, `mobile/openapi/`, Dart `*.g.dart`/`*.gr.dart` files.
- Version numbers (currently in `package.json` files as one shared version) are managed by release tooling.
