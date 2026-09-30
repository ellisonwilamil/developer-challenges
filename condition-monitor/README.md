# Condition Monitor

Full-stack application for machine condition monitoring: authentication, machines,
monitoring points, sensors and sensor time-series, built for the Dynamox full-stack
challenge ([full-stack-challenge.md](../full-stack-challenge.md)).

> The challenge asks for a pull request to `dynamox-s-a/js-ts-full-stack-test`. That
> repository was renamed to `dynamox-s-a/developer-challenges`, which is where this
> branch is proposed. The project lives in this folder so that the challenge catalog
> at the repository root stays untouched.

## Status

The workspace runs end to end: the web app reaches the API through its dev server, the
API reaches PostgreSQL through Prisma, and CI checks every project on each push. The
features arrive one vertical slice at a time, each with its migration, API routes,
tests and screen:

| Slice | State |
|---|---|
| Authentication | done: login, logout, session cookie, every route private by default |
| Sectors | done: list, create, edit and delete, with the `DRY` sector seeded |
| Machines | next |
| Monitoring points and sensors | planned |
| Time-series | planned |
| Simulator | planned |

Until its slice lands, a screen shows a placeholder.

## Stack

An Nx monorepo with a React and Vite frontend (Material UI 5, Redux Toolkit), a
NestJS API and PostgreSQL 16 through Prisma. Each choice is recorded as an
architecture decision record in [docs/adr](docs/adr/README.md).

## Repository layout

```
condition-monitor/
  apps/
    api/              NestJS API, Prisma schema and migrations
    web/              React app built with Vite
    simulator/        command-line telemetry simulator
  libs/
    shared/           types, rules and mappings used by the three apps
  docker/postgres/    database initialisation scripts
  docs/               assumptions, domain model, architecture, API contract, ADRs
  docker-compose.yml  PostgreSQL for development and integration tests
```

## Getting started

### Prerequisites

- **Node.js 24**, the version in `.nvmrc`. With nvm: `nvm install` then `nvm use`.
  npm 11, bundled with Node 24, is required: npm 10 fails to install the test tooling.
- **Docker** with Compose, for PostgreSQL.
- Free ports: **5432** (PostgreSQL), **3000** (API) and **4200** (web app).

### Run

From this folder, `condition-monitor/`:

```bash
npm ci
cp .env.example .env
docker compose up -d
npm run db:deploy
npm run db:seed
npm run dev
```

- `npm ci` installs the exact versions in `package-lock.json`.
- `.env.example` holds development-only values; the defaults work as they are.
- `docker compose up -d` starts PostgreSQL 16 with two databases: `condition_monitor`
  for the application and `condition_monitor_test` for integration tests.
- `npm run db:deploy` applies the database migrations.
- `npm run db:seed` creates the fixed user from `SEED_USER_EMAIL` and
  `SEED_USER_PASSWORD` in `.env`. It is idempotent: run again, it reports `unchanged`.
- `npm run dev` serves the API and the web app together. The API refuses to start
  without a `JWT_SECRET` of at least 32 characters, which `.env.example` provides.

Then open **http://localhost:4200** and log in with the development credentials from
`.env.example` (assumption A1):

| Email | Password |
|---|---|
| `operator@condition-monitor.test` | `Monitor-2026-dev` |

These are local development values only. The chip in the top bar reads "API: online"
when the web app reaches the API, which alone answers at
`http://localhost:3000/api/health`.

An `.env` copied before a slice added new variables lacks them: compare it with
`.env.example`, or copy it again.

The container restarts on its own after a reboot, unless it was stopped with
`docker compose stop`. The data is kept in the volume.

The test database is created only when the data volume is first created. If the volume
already existed from an earlier run, recreate it, which erases its data:

```bash
docker compose down -v
docker compose up -d
```

### Simulator

```bash
npm run simulate -- help
```

It parses its commands and options already; generating telemetry arrives with the
time-series slice, and until then `backfill` and `live` exit with an error saying so.

## Assumptions

The challenge leaves several points open. Each one is recorded with the decision
taken in [docs/assumptions.md](docs/assumptions.md).

## Architecture

Entities, relations and database rules in [docs/domain-model.md](docs/domain-model.md).
Components, workspace layout and data flows in [docs/architecture.md](docs/architecture.md).
REST endpoints, payloads and error format in [docs/api-contract.md](docs/api-contract.md).

## Testing

| Command | What it runs | Needs |
|---|---|---|
| `npm test` | unit tests of every project: Vitest for web, simulator and shared, Jest for the API | nothing |
| `npm run test:integration` | API tests against the real test database | `docker compose up -d` |
| `npm run lint` | ESLint, including module boundary rules between projects | nothing |
| `npm run typecheck` | TypeScript in strict mode | nothing |
| `npm run format:check` | Prettier | nothing |

Integration tests always use `DATABASE_URL_TEST`, never the development database
([ADR 0010](docs/adr/0010-testing-strategy.md)).

### Continuous integration

[`.github/workflows/condition-monitor.yml`](../.github/workflows/condition-monitor.yml)
runs on every push and pull request that touches this folder: `npm ci`, format check,
then lint, unit tests, type check and build of every project, and the integration tests
against a PostgreSQL 16 service. GitHub reads workflows only from the repository root,
which is why the file lives there.

## Known issues

### Dependency audit

`npm audit` reports advisories in six packages, all third-party and none in this
project's code. Measured on 2026-09-30 with `npm audit` after `npm ci`:

| Package | Pulled in by | Why this project is not exposed |
|---|---|---|
| `mysql2` | Prisma CLI | only used with MySQL; this project uses PostgreSQL |
| `deepmerge-ts` | Prisma configuration loader | only merges this project's own static `prisma.config.ts` |
| `brace-expansion` | Nx Jest and webpack tooling | expands file patterns written in this project's configuration |
| `smol-toml` | Nx | parses TOML files, and the project has none |
| `uuid` | `webpack-dev-server` | development server the API does not use; the advisory covers v3, v5 and v6 with a buffer, not the v4 it calls |
| `esbuild` | Vite, simulator build | affects esbuild's own development server on Windows, which is not used |

`npm audit --omit=dev` still lists the Prisma CLI, because `@prisma/client` declares it
as a peer dependency and npm then counts it as a production package. The built API
never loads the CLI. `npm audit fix --force` is not a fix here: it would move Nx and
Prisma to older versions.

### Install script warnings

npm 11 warns that some packages (`@swc/core`, `nx`, `@parcel/watcher`, `unrs-resolver`)
have install scripts not yet approved in its new install-scripts policy. The warning
does not block the installation, and the project installs, builds and tests as is.

## Commit convention

[Conventional Commits](https://www.conventionalcommits.org/), one logical change per
commit.
