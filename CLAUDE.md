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

# Run the API (http only, port 5112)
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

**`HelpDeskApp.Core`** — entities (`Ticket`, `User`, `EmailThread`), enums (`TicketStatus`, `TicketCategory`, `UserRole`), repository interfaces (`ITicketRepository`, `IUserRepository`, `IEmailThreadRepository`), service interfaces (`IGmailService`, `IAiService`). No EF, no HTTP references allowed here.

**`HelpDeskApp.Infrastructure`** — `AppDbContext` (Npgsql/PostgreSQL), `IEntityTypeConfiguration<T>` mapping classes, repository implementations, `GmailService` (Google.Apis.Gmail.v1), `AiService` (Anthropic.SDK). A mock `GmailService` toggled by environment variable is used for local dev before OAuth is configured.

**`HelpDeskApp.API`** — controller-based (not Minimal APIs), JWT bearer auth via `Microsoft.AspNetCore.Authentication.JwtBearer`, role-based `[Authorize]` attributes. `Microsoft.EntityFrameworkCore.Design` is here (not in Infrastructure) so `dotnet ef` can find the design-time factory. HTTPS redirect is disabled in `Development` environment.

**`frontend/`** — Vite dev server proxies all `/api/*` requests to `http://localhost:5112`, so no CORS configuration is needed during development. Tailwind CSS v4 is loaded via the `@tailwindcss/vite` plugin (no `tailwind.config.js`).

### Auth model

Two roles: `Admin` and `Agent`. Admin account is database-seeded on first run from environment variables. Admin can create Agent accounts; there is no self-registration. JWTs carry `userId`, `email`, and `role` claims.

### Ticket lifecycle

`NeedsReview` → `Sent`. No reopen logic in the MVP.