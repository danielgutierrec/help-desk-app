# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this project is

AI-assisted helpdesk MVP. Support emails are ingested from Gmail, classified and summarised by an LLM, and a draft reply is generated from a hardcoded knowledge base. Human agents review, edit, and send replies. See `project-scope.md` for the full scope and `implementation-plan.md` for the phased build plan.

## Commands

### Backend (.NET 10)

Run from the repo root unless otherwise noted.

```bash
# Build the whole solution
dotnet build HelpDeskApp.slnx

# Run the API (http only, port 5112) — ADMIN_EMAIL/ADMIN_PASSWORD seed the first admin on an empty DB
ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=YourPassword123! \
  dotnet run --project src/HelpDeskApp.API --launch-profile http

# Add an EF Core migration (run from repo root; startup project is API)
dotnet ef migrations add <MigrationName> \
  --project src/HelpDeskApp.Infrastructure \
  --startup-project src/HelpDeskApp.API

# Apply migrations
dotnet ef database update \
  --project src/HelpDeskApp.Infrastructure \
  --startup-project src/HelpDeskApp.API
```

### Frontend (Vite + React)

```bash
cd frontend

npm run dev      # dev server on http://localhost:5173
npm run build    # TypeScript check + production build
npm run lint     # oxlint
```

## Architecture

### Solution layout

```
src/
  HelpDeskApp.Core/           # Domain — entities, enums, interfaces only
  HelpDeskApp.Infrastructure/ # EF Core, repositories, Gmail client, AI service
  HelpDeskApp.API/            # ASP.NET Core controllers, DI wiring, JWT auth
frontend/                     # React 19 + TypeScript SPA (Vite)
```

### Dependency rule

`Core` ← `Infrastructure` ← `API`. `Core` has zero external dependencies. `Infrastructure` implements interfaces declared in `Core`. `API` wires everything together in `Program.cs` and owns no domain logic. The frontend is fully decoupled — it only communicates with the API over HTTP.

### Key layers

**`HelpDeskApp.Core`** — entities (`Ticket`, `EmailThread`), enums (`TicketStatus`, `TicketCategory`, `UserRole`), repository interfaces (`ITicketRepository`, `IEmailThreadRepository`), service interfaces (`IGmailService`, `IAiService`). No EF, no HTTP references allowed here. `User` entity and `IUserRepository` have been retired — user management goes through ASP.NET Core Identity.

**`HelpDeskApp.Infrastructure`** — `AppDbContext` (extends `IdentityDbContext<ApplicationUser, IdentityRole<Guid>, Guid>`, Npgsql/PostgreSQL), `ApplicationUser : IdentityUser<Guid>` (adds `Name` and `Role` properties) in `Identity/`, `IEntityTypeConfiguration<T>` mapping classes, repository implementations (`TicketRepository`, `EmailThreadRepository`), `DatabaseSeeder : IHostedService`. `GmailService` and `AiService` packages are installed (`Google.Apis.Gmail.v1`, `Anthropic.SDK`) but not yet implemented.

**`HelpDeskApp.API`** — controller-based (not Minimal APIs), JWT bearer auth via `Microsoft.AspNetCore.Authentication.JwtBearer` with `MapInboundClaims = false` (claim names in `ClaimsPrincipal` match JWT directly: `sub`, `email`, `role`), `TokenService` for JWT generation, `AppDbContextFactory` for `dotnet ef` CLI. HTTPS redirect is disabled in `Development` environment.

**`frontend/`** — Vite dev server proxies all `/api/*` requests to `http://localhost:5112`, so no CORS configuration is needed during development. Tailwind CSS v4 is loaded via the `@tailwindcss/vite` plugin (no `tailwind.config.js`).

### Auth model

Two roles: `Admin` and `Agent`. `Admin` account is database-seeded on first run via `ADMIN_EMAIL` and `ADMIN_PASSWORD` environment variables (uses `UserManager<ApplicationUser>.CreateAsync`). Admin can create Agent accounts; there is no self-registration. JWTs carry `sub` (user GUID), `email`, and `role` claims, signed with HMAC-SHA256, 8-hour expiry. JWT config keys: `Jwt:Key`, `Jwt:Issuer`, `Jwt:Audience` — override `Jwt__Key` via environment variable in production, never commit a real key.

### Implemented endpoints

| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/api/health` | none | Health check |
| POST | `/api/auth/login` | none | `{email, password}` → `{token, email, role}` |
| GET | `/api/auth/me` | Bearer | Returns `{id, email, role}` from JWT claims |

### Ticket lifecycle

`NeedsReview` → `Sent`. No reopen logic in the MVP.