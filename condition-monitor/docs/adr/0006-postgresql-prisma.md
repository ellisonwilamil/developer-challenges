# 0006. PostgreSQL 16 with Prisma

- Status: accepted
- Date: 2026-09-29

## Context

The challenge requires PostgreSQL with Prisma, Drizzle or Kysely, or MongoDB with
Mongoose. The [domain model](../domain-model.md) relies on composite foreign keys,
`CHECK` constraints, a partial unique index and a unique index with
`NULLS NOT DISTINCT`, which requires PostgreSQL 15 or later.

## Decision

PostgreSQL 16, accessed through Prisma, with schema changes applied by Prisma Migrate.
What Prisma cannot model, the `CHECK` constraints, the partial index and
`NULLS NOT DISTINCT`, is written as SQL inside the generated migration files. Each
migration holds one change.

## Alternatives considered

- **MongoDB with Mongoose.** The model is relational and its rules are relational
  constraints; a document store would move them into application code.
- **Drizzle or Kysely.** Closer to SQL, and Drizzle models more constraints. Prisma's
  schema file is the most readable single description of the model for a reviewer.

## Consequences

- Part of the schema lives in SQL outside `schema.prisma`, so the migrations are the
  complete source of truth, and integration tests prove those constraints reject
  invalid data ([ADR 0010](0010-testing-strategy.md)).
- A migration regenerated from `schema.prisma` alone would drop the hand-written SQL;
  new migrations are generated and then completed, never regenerated.
- Prisma Migrate does not generate `down` migrations; reverting a change means a new
  migration.
