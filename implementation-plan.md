# Helpdesk MVP — Implementation Plan

Phases run roughly in order; later phases depend on earlier ones. Each task is
independently completable and verifiable.

---

## Phase 0 — Solution scaffold

Set up the skeleton everything else builds on.

- [ ] Create the `.NET 10` solution and add three class library / web API projects:
      `HelpDeskApp.Core`, `HelpDeskApp.Infrastructure`, `HelpDeskApp.API`.
- [ ] Set project references: `Infrastructure` → `Core`; `API` → `Core` + `Infrastructure`.
- [ ] Add NuGet packages to each project (EF Core, Npgsql, Identity, JWT bearer, Google APIs, etc.).
- [ ] Scaffold the `frontend/` folder with Vite + React + TypeScript (`npm create vite`).
- [ ] Add Tailwind CSS to the frontend.
- [ ] Add a root `.gitignore` covering .NET, Node, and environment files.
- [ ] Verify the solution builds and the frontend dev server starts.

---

## Phase 1 — Core domain model

Pure C# — no EF, no HTTP, no external references.

- [ ] Define enums: `TicketStatus` (`NeedsReview`, `Sent`), `TicketCategory`
      (`AccountLogin`, `Billing`, `Academic`, `Technical`, `Other`), `UserRole` (`Admin`, `Agent`).
- [ ] Define entity `User`: `Id`, `Name`, `Email`, `PasswordHash`, `Role`.
- [ ] Define entity `EmailThread`: `Id`, `GmailThreadId`, `Subject`, `SenderEmail`, `SenderName`, `ReceivedAt`.
- [ ] Define entity `Ticket`: `Id`, `ThreadId` (FK), `AssignedToId` (nullable FK), `Category`,
      `Status`, `AiSummary`, `AiDraft`, `FinalReply` (nullable), `CreatedAt`, `SentAt` (nullable).
- [ ] Define repository interfaces: `ITicketRepository`, `IUserRepository`, `IEmailThreadRepository`.
- [ ] Define service interfaces: `IGmailService` (ingest + send), `IAiService` (classify, summarize, draft).

---

## Phase 2 — Infrastructure: database

Wire the domain to PostgreSQL via EF Core.

- [ ] Create `AppDbContext` with `DbSet`s for all entities.
- [ ] Configure entity mappings (table names, required fields, FK relationships) using
      `IEntityTypeConfiguration<T>` classes.
- [ ] Implement `TicketRepository`, `UserRepository`, `EmailThreadRepository` against `AppDbContext`.
- [ ] Register `AppDbContext` with the Npgsql provider in `API/Program.cs`.
- [ ] Add the first EF Core migration (`InitialSchema`).
- [ ] Write a `DatabaseSeeder` (`IHostedService`) that creates the admin account on first run
      if no users exist (reads credentials from environment variables).
- [ ] Verify: `dotnet ef database update` creates the schema and seeds the admin user.

---

## Phase 3 — Auth

Email/password login with JWT; role-gated endpoints.

- [ ] Configure ASP.NET Core Identity to use the existing `User` entity and `AppDbContext`
      (skip Identity's default tables; map to the `users` table).
- [ ] Implement `POST /api/auth/login` controller action: validate credentials via
      `UserManager`, return a signed JWT containing `userId`, `email`, `role`.
- [ ] Configure JWT bearer authentication middleware in `Program.cs`.
- [ ] Add `[Authorize]` to the base controller and `[Authorize(Roles = "Admin")]` to
      admin-only actions.
- [ ] Implement `POST /api/admin/agents` — admin creates an agent account
      (name + email + password).
- [ ] Verify: login returns a token; calling a protected endpoint without a token returns 401;
      calling an admin endpoint with an agent token returns 403.

---

## Phase 4 — Ticket API

CRUD and queue endpoints; no AI yet — use placeholder values.

- [ ] `GET /api/tickets` — returns all `NeedsReview` tickets (queue list):
      id, subject, sender, category, summary, created at.
- [ ] `GET /api/tickets/{id}` — returns full ticket detail including `AiDraft`,
      original email body, and thread metadata.
- [ ] `PATCH /api/tickets/{id}/draft` — agent saves an edited draft (`FinalReply`).
- [ ] `POST /api/tickets/{id}/send` — marks ticket as `Sent`, records `SentAt`
      (actual Gmail send wired in Phase 6).
- [ ] Verify all endpoints with a REST client (Swagger / HTTP file); confirm role guards work.

---

## Phase 5 — AI pipeline

Integrate the LLM for classification, summarisation, and draft generation.

- [ ] Add the hardcoded knowledge base as a static class in `Infrastructure`
      (3–5 articles covering the taxonomy categories).
- [ ] Implement `AiService` against the chosen LLM provider SDK:
  - `ClassifyAndSummarize(emailBody)` → `(TicketCategory, summary)` via a structured prompt.
  - `DraftReply(emailBody, category, kbArticles)` → draft reply string.
- [ ] Register `AiService` as `IAiService` in DI.
- [ ] Create `TicketProcessingService` that, given a new `EmailThread`, calls
      `ClassifyAndSummarize` then `DraftReply` and persists the resulting `Ticket`.
- [ ] Write unit tests for the prompts using recorded LLM responses (no live calls in CI).
- [ ] Verify end-to-end with a hardcoded sample email: ticket appears in DB with correct
      category, summary, and draft.

---

## Phase 6 — Gmail integration

Connect real (or mock) Gmail for ingest and send.

- [ ] Implement `GmailService` using the Google.Apis.Gmail.v1 .NET client:
  - `IngestNewEmails()` — fetches unread messages from the `support@` inbox, skips
    threads already in the DB, creates `EmailThread` + runs `TicketProcessingService`.
  - `SendReply(gmailThreadId, replyBody)` — sends the final reply in the original thread.
- [ ] Register `GmailService` as `IGmailService` in DI.
- [ ] Add a `GmailPollingBackgroundService` (`BackgroundService`) that calls
      `IngestNewEmails()` on a configurable interval (e.g. every 2 minutes).
- [ ] Wire `SendReply` into `POST /api/tickets/{id}/send`.
- [ ] Add a mock `GmailService` implementation (reads from a JSON seed file) toggled by an
      environment variable — used for local dev before OAuth is configured.
- [ ] Verify: seeded emails create tickets with AI drafts; sending a ticket calls `SendReply`.

---

## Phase 7 — Frontend

React SPA; talks to the API over HTTP.

### Auth
- [ ] Build the login page (email + password form).
- [ ] On success, store the JWT in `localStorage`; attach it as `Authorization: Bearer`
      on all requests via an Axios interceptor.
- [ ] Implement a protected route wrapper that redirects unauthenticated users to `/login`.
- [ ] Decode the JWT on the client to read the `role` claim; hide admin-only UI for agents.

### Queue page (`/tickets`)
- [ ] Fetch and display the list of `NeedsReview` tickets: subject, sender, category badge,
      short summary, relative timestamp.
- [ ] Each row links to the review page.

### Review page (`/tickets/:id`)
- [ ] Display original email (subject, sender, body).
- [ ] Display AI-generated summary and category.
- [ ] Show the AI draft in an editable textarea pre-populated with `AiDraft`.
- [ ] "Save draft" button calls `PATCH /api/tickets/{id}/draft`.
- [ ] "Send reply" button calls `POST /api/tickets/{id}/send`; on success redirects back
      to the queue.

### Admin: create agent (`/admin/agents/new`)
- [ ] Simple form: name, email, password.
- [ ] Calls `POST /api/admin/agents`; shows success/error feedback.
- [ ] Route visible only to admin role.

---

## Phase 8 — Integration and end-to-end validation

Connect everything and verify the full loop works.

- [ ] Configure CORS in `API/Program.cs` to allow requests from the Vite dev origin.
- [ ] Add a `.env.local` template and a `README` section documenting required environment
      variables (DB connection string, JWT secret, LLM API key, Gmail credentials).
- [ ] Run the full core loop manually: seed an email → ticket appears in queue → open
      review screen → edit draft → send → ticket moves out of queue.
- [ ] Verify role separation: agent cannot reach `/admin/agents/new`; admin can.
- [ ] Fix any integration issues found during the run-through.
- [ ] Confirm the frontend shows meaningful error states (invalid login, send failure).