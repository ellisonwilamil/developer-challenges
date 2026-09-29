# Condition Monitor

Full-stack application for machine condition monitoring: authentication, machines,
monitoring points, sensors and sensor time-series, built for the Dynamox full-stack
challenge ([full-stack-challenge.md](../full-stack-challenge.md)).

> The challenge asks for a pull request to `dynamox-s-a/js-ts-full-stack-test`. That
> repository was renamed to `dynamox-s-a/developer-challenges`, which is where this
> branch is proposed. The project lives in this folder so that the challenge catalog
> at the repository root stays untouched.

## Status

Planning. Documentation and decisions come first; code follows in small, reviewable
commits.

## Stack

An Nx monorepo with a React and Vite frontend (Material UI 5, Redux Toolkit), a
NestJS API and PostgreSQL 16 through Prisma. Each choice is recorded as an
architecture decision record in [docs/adr](docs/adr/README.md).

## Repository layout

To be defined with the workspace scaffolding.

## Getting started

To be written once the application runs end to end.

## Assumptions

The challenge leaves several points open. Each one is recorded with the decision
taken in [docs/assumptions.md](docs/assumptions.md).

## Architecture

Entities, relations and database rules in [docs/domain-model.md](docs/domain-model.md).
Components, workspace layout and data flows in [docs/architecture.md](docs/architecture.md).
REST endpoints, payloads and error format in [docs/api-contract.md](docs/api-contract.md).

## Testing

To be written.

## Commit convention

[Conventional Commits](https://www.conventionalcommits.org/), one logical change per
commit.
