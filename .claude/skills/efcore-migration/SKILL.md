---
name: efcore-migration
description: Use when any change requires a database schema update — adding or removing entities/properties, changing column types, nullability, max length, precision, default values, indexes, unique constraints, foreign keys, cascade rules, owned entities, table renames, or seed data managed by HasData. Covers the full workflow: update the EF configuration in Infrastructure, generate the migration, review Up()/Down(), and apply it to the database.
---

# EF Core Migration Skill

Guide for adding or modifying entities and keeping the database schema in sync.

## When to use

A migration is required whenever a change affects the database schema. Trigger this skill for any of the following:

**Entity structure**
- Adding a new entity class (also needs a `DbSet<T>` in `AppDbContext` and a new configuration class)
- Deleting an entity class
- Adding or removing a property on an existing entity

**Column definition changes** (require updating the configuration class too)
- Renaming a property (EF generates a drop + add — consider `migrationBuilder.RenameColumn` manually to preserve data)
- Changing a property's CLR type (e.g. `int` → `long`, `string` → `Guid`)
- Changing nullability (`string` ↔ `string?`, `IsRequired()` toggled)
- Changing max length (`HasMaxLength`)
- Changing numeric precision/scale (`HasPrecision`)
- Adding or removing a default value (`HasDefaultValue` / `HasDefaultValueSql`)
- Adding or removing a computed column (`HasComputedColumnSql`)
- Changing the column name via `HasColumnName`

**Indexes and constraints**
- Adding or removing a unique constraint (`HasIndex(...).IsUnique()`)
- Adding or removing a non-unique index (`HasIndex`)
- Adding or removing an alternate key (`HasAlternateKey`)
- Adding or removing a check constraint (`HasCheckConstraint`)

**Relationships**
- Adding or removing a foreign key / navigation property
- Changing cascade delete behaviour (`OnDelete`)
- Adding or removing a join table for a many-to-many relationship
- Adding or removing an owned entity (`OwnsOne` / `OwnsMany`)

**Table-level**
- Renaming a table (`ToTable`)
- Moving a table to a different schema
- Changing the primary key columns or type

**Seed data**
- Adding, updating, or removing rows managed by `HasData` in a configuration class

## Steps

### 1. Edit or create the entity in `Core`

All entities live in `src/HelpDeskApp.Core/Entities/`. Each entity must be a plain C# class — no EF or HTTP references.

### 2. Update the EF configuration in `Infrastructure`

Each entity has a matching configuration class in `src/HelpDeskApp.Infrastructure/Data/Configurations/`. Update (or create) the `IEntityTypeConfiguration<T>` class to reflect the change — column type, max length, nullability, indexes, relationships.

If creating a new entity, also register it as a `DbSet<T>` in `src/HelpDeskApp.Infrastructure/Data/AppDbContext.cs`.

### 3. Generate the migration

Run from the repo root:

```bash
dotnet ef migrations add <DescriptiveName> \
  --project src/HelpDeskApp.Infrastructure \
  --startup-project src/HelpDeskApp.API
```

Use a clear name that describes the change, e.g. `AddPhoneNumberToUser` or `CreateTicketTable`.

### 4. Review the generated migration

Open the new file in `src/HelpDeskApp.Infrastructure/Migrations/`. Check that `Up()` contains only the expected operations and `Down()` correctly reverses them. If it looks wrong, delete the file and fix the entity/configuration before regenerating.

### 5. Apply the migration

```bash
dotnet ef database update \
  --project src/HelpDeskApp.Infrastructure \
  --startup-project src/HelpDeskApp.API
```

This runs all pending migrations against the database defined in `appsettings.json` (`Host=localhost;Port=5432;Database=helpdesk`).

### 6. Run the app

```bash
ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=YourPassword123 \
  dotnet run --project src/HelpDeskApp.API --launch-profile http
```

## Rules

- Never edit `*.Designer.cs` migration files — EF owns them.
- Never delete old migration files.
- `migrations add` is always safe — it only writes files, never touches the DB.
- `database update` can be destructive on existing data (e.g. `DropColumn`). Review before applying.
- `Core` must stay free of EF references — all mapping belongs in `Infrastructure`.
