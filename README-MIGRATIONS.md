# Monarca - Database Migrations Guide

This document explains how to create and run TypeORM migrations in this project.

## Prerequisites

1. Be inside the monarca project folder.
2. Have `.env` configured with database variables:
   - `POSTGRES_HOST`
   - `POSTGRES_PORT`
   - `POSTGRES_USER`
   - `POSTGRES_PASSWORD`
   - `POSTGRES_DATABASE`
3. Ensure the database is running and reachable.

## Migration Setup Used by This Project

- DataSource file: `src/data-source.ts`
- Migration output folder: `migrations/`
- NPM scripts are defined in `package.json`.

## Recommended Workflow

1. Modify or add your TypeORM entity files.
2. Generate a migration from those entity changes.
3. Review the generated migration file before executing it.
4. Run the migration.
5. Commit both entity changes and migration file together.

## Commands

Run all commands from the monarca root folder.

### 1) Generate migration from entity changes

Windows PowerShell or CMD:

```bash
npm run migration:generate --name=YourMigrationName
```

Example:

```bash
npm run migration:generate --name=AddFieldToRequests
```

This creates a file in `migrations/`.

### 2) Create empty migration manually

Use this when you need custom SQL not inferred from entities.

```bash
npm run migration:create --name=ManualMigrationName
```

### 3) Apply pending migrations

```bash
npm run migration:run
```

### 4) Revert last executed migration

```bash
npm run migration:revert
```

## Typical Local Flow

```bash
npm run migration:generate --name=AddSomething
npm run migration:run
```

If needed:

```bash
npm run migration:revert
```

## Naming Conventions
- Database_vx
- x being the current version from 1 onward
- In each version, you have to put the comment that all files need, and in that comment, you need to add what was added to the database

## Important Notes

1. Keep `synchronize` set to `false` in runtime config to avoid schema drift.
2. Do not edit old migrations that are already shared/applied in other environments.
3. If a migration includes unwanted changes, delete that generated file and generate again.
4. Migrations manage schema. Seed scripts (`db:seed`) manage initial or dummy data.

## Troubleshooting

### Database connection refused

- Verify Docker/Postgres is running.
- Verify `.env` host and port values.

### Module path resolution errors (`Cannot find module 'src/...'`)

- Use the provided npm scripts, because they already load `tsconfig-paths/register`.

### Migration generated with unexpected changes

- Ensure your branch only contains intended entity modifications.
- Regenerate the migration after cleaning unintended code changes.
