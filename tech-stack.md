# Helpdesk — Tech Stack

## Architecture overview

Clean multi-project .NET solution with a separate React frontend.

```
HelpDeskApp/
├── src/
│   ├── HelpDeskApp.Core/            # Entities, interfaces, domain logic
│   ├── HelpDeskApp.Infrastructure/  # EF Core, Identity, repositories, Gmail, AI
│   └── HelpDeskApp.API/             # ASP.NET Core controllers, auth, DI wiring
├── frontend/                        # React + TypeScript frontend (Vite)
└── HelpDeskApp.slnx
```

## Dependency direction (Clean Architecture)

```
         ┌─────────────┐
         │    API      │  ← controllers, DI wiring, auth middleware
         └──────┬──────┘
                │ references
         ┌──────▼──────┐
         │Infrastructure│  ← EF Core, Identity, repositories, Gmail client, AI services
         └──────┬──────┘
                │ references
         ┌──────▼──────┐
         │    Core     │  ← entities, interfaces, enums — no external dependencies
         └─────────────┘

         ┌─────────────┐
         │  frontend/  │  ← React SPA — communicates with API over HTTP only
         └─────────────┘
```

Rules:
- `Core` has **zero** references to `Infrastructure` or `API`. It defines interfaces; it never implements them.
- `Infrastructure` references `Core` to implement its interfaces and map its entities — never references `API`.
- `API` references both `Core` (for DTOs and interfaces) and `Infrastructure` (to register concrete implementations in DI).
- `frontend` is fully decoupled from the .NET projects — it only talks to `API` via REST over HTTP.

---

## Backend

### Framework: ASP.NET Core 10 — Controller-based Web API
- Controller-based (not Minimal APIs) for explicit routing, filters, and attribute-based auth that scale cleanly as endpoints grow.
- .NET 10 LTS — latest stable runtime.

### Project breakdown

| Project | Responsibility |
|---|---|
| **HelpDeskApp.Core** | Entities (`Ticket`, `EmailThread`), enums (`TicketStatus`, `TicketCategory`, `UserRole`), repository interfaces (`ITicketRepository`, `IEmailThreadRepository`), service interfaces (`IAiService`, `IGmailService`). Zero external NuGet dependencies. |
| **HelpDeskApp.Infrastructure** | `AppDbContext` (extends `IdentityDbContext<ApplicationUser>`), `ApplicationUser : IdentityUser<Guid>`, EF configurations, repository implementations (`TicketRepository`, `EmailThreadRepository`), `DatabaseSeeder` (seeds admin on first run via `UserManager`). Packages: `Microsoft.AspNetCore.Identity.EntityFrameworkCore` 10.0.11, `Microsoft.EntityFrameworkCore` 10.0.11, `Npgsql.EntityFrameworkCore.PostgreSQL` 10.0.3, `Microsoft.Extensions.Hosting.Abstractions` 10.0.11, `Anthropic.SDK` 5.10.0 (not yet wired), `Google.Apis.Gmail.v1` 1.75.0 (not yet wired). |
| **HelpDeskApp.API** | Controllers (`HealthController`, `AuthController`), `TokenService` (JWT generation), auth middleware wiring, `Program.cs`. Packages: `Microsoft.AspNetCore.Authentication.JwtBearer` 10.0.11, `Microsoft.EntityFrameworkCore.Design` 10.0.11 (design-time only). |

### ORM: Entity Framework Core 10
- Code-first with migrations. 4 migrations applied so far: `InitialSchema`, `AddPhoneNumberToUser`, `UpdateSenderEmailMaxLength`, `AddIdentitySchema`.
- `Infrastructure` project owns the `AppDbContext` and all migrations. `AppDbContextFactory` lives in `API` for `dotnet ef` CLI support.
- Repository pattern: interfaces in `Core`, implementations in `Infrastructure`.
- All table and column names are snake_case (`users`, `tickets`, `email_threads`, etc.).

### Database: PostgreSQL
- Relational model fits the ticket/thread/user structure cleanly.
- EF Core uses `Npgsql.EntityFrameworkCore.PostgreSQL` 10.0.3 provider.
- Local dev connection: `Host=localhost;Port=5432;Database=helpdesk`.

### Auth: ASP.NET Core Identity + JWT bearer ✅ implemented
- `ApplicationUser : IdentityUser<Guid>` lives in `Infrastructure/Identity/`. Adds `Name` (string) and `Role` (`UserRole` enum) on top of Identity's built-ins.
- `UserRole` enum (`Admin = 0`, `Agent = 1`) stays in `Core` — the only Identity-aware type that crosses into Core is the enum.
- `AddIdentityCore<ApplicationUser>().AddRoles<IdentityRole<Guid>>().AddEntityFrameworkStores<AppDbContext>()` registered in `Infrastructure.DependencyInjection`.
- JWT bearer tokens issued on `POST /api/auth/login`. Claims: `sub` (user GUID), `email`, `role`.
- `options.MapInboundClaims = false` — claim names in the `ClaimsPrincipal` match the JWT directly (no ASP.NET remapping).
- JWT config read from `Jwt:Key`, `Jwt:Issuer`, `Jwt:Audience` in `appsettings.json`; override `Jwt__Key` via env var in production.
- Admin account seeded via `DatabaseSeeder : IHostedService` on first run (requires `ADMIN_EMAIL` + `ADMIN_PASSWORD` env vars).
- Two roles: `Admin`, `Agent`. No self-registration — Admin creates Agent accounts.

### Implemented endpoints
| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/api/health` | none | Health check |
| POST | `/api/auth/login` | none | Returns JWT on valid email + password |
| GET | `/api/auth/me` | Bearer | Returns `{id, email, role}` from token claims |

---

## Frontend

### Framework: React 19 + TypeScript (Vite)
- Vite for fast dev server and build.
- Standalone SPA — talks to the .NET API via REST.
- Vite dev server proxies `/api/*` to `http://localhost:5112` (no CORS config needed in dev).
- React Router v7 for client-side routing.

### Styling: Tailwind CSS v4
- Loaded via `@tailwindcss/vite` plugin — no `tailwind.config.js` needed.

### HTTP client: Axios (or fetch with a thin wrapper)
- Centralized instance with JWT auth header injection and error handling.

> **Status:** Frontend scaffolded but no feature pages implemented yet.

---

## Key third-party integrations

| Integration | Library | Status |
|---|---|---|
| PostgreSQL driver | `Npgsql.EntityFrameworkCore.PostgreSQL` 10.0.3 | ✅ in use |
| Identity + password hashing | `Microsoft.AspNetCore.Identity.EntityFrameworkCore` 10.0.11 | ✅ in use |
| JWT | `Microsoft.AspNetCore.Authentication.JwtBearer` 10.0.11 | ✅ in use |
| LLM (classify / summarize / draft) | `Anthropic.SDK` 5.10.0 | installed, not yet wired |
| Gmail read + send | `Google.Apis.Gmail.v1` 1.75.0 | installed, not yet wired |

---

## Still to decide
- Gmail access method (OAuth on the mailbox vs. service account; mock for local dev).
- Deployment target.