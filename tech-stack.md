# Helpdesk — Tech Stack

## Architecture overview

Clean multi-project .NET solution with a separate React frontend.

```
HelpDeskApp/
├── src/
│   ├── HelpDeskApp.Core/            # Entities, interfaces, domain logic
│   ├── HelpDeskApp.Infrastructure/  # EF Core, repositories, Gmail, AI
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
         │Infrastructure│  ← EF Core, repositories, Gmail client, AI services
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
| **HelpDeskApp.Core** | Entities (`Ticket`, `User`, `Thread`), enums (`TicketStatus`, `Role`, `Category`), repository interfaces (`ITicketRepository`, `IUserRepository`), service interfaces (`IClassifierService`, `IDraftService`) |
| **HelpDeskApp.Infrastructure** | EF Core `DbContext`, repository implementations, EF migrations, Gmail API client, LLM (AI) service implementations |
| **HelpDeskApp.API** | Controllers, request/response DTOs, auth middleware (JWT), dependency injection setup, `Program.cs` |

### ORM: Entity Framework Core 10
- Code-first with migrations.
- `Infrastructure` project owns the `DbContext` and all migrations.
- Repository pattern: interfaces in `Core`, implementations in `Infrastructure` — keeps `API` and `Core` free of EF references.

### Database: PostgreSQL
- Relational model fits the ticket/thread/user structure cleanly.
- EF Core uses `Npgsql.EntityFrameworkCore.PostgreSQL` provider.

### Auth: ASP.NET Core Identity + JWT
- Identity manages users and password hashing.
- JWT bearer tokens issued on login; role claims (`admin`, `agent`) gate controller endpoints via `[Authorize(Roles = "...")]`.
- Admin account seeded via `IHostedService` on first run if no users exist.

---

## Frontend

### Framework: React 19 + TypeScript (Vite)
- Vite for fast dev server and build.
- Standalone SPA — talks to the .NET API via REST.
- React Router v7 for client-side routing.

### Styling: Tailwind CSS
- Utility-first; no component library dependency. Keeps the queue UI fast to build.

### HTTP client: Axios (or fetch with a thin wrapper)
- Centralized instance with JWT auth header injection and error handling.

---

## Key third-party integrations

| Integration | Library |
|---|---|
| Gmail read + send | Google.Apis.Gmail.v1 (.NET client) |
| LLM (classify / summarize / draft) | Anthropic .NET SDK or OpenAI .NET SDK (TBD) |
| PostgreSQL driver | Npgsql |
| JWT | `Microsoft.AspNetCore.Authentication.JwtBearer` |

---

## Still to decide
- LLM provider (Claude vs. OpenAI).
- Gmail access method (OAuth on the mailbox vs. service account; or mock for now).
- Deployment target.