---
name: pre-commit-ci
description: Runs backend build and frontend lint/type-check for staged files in a non-interactive pre-commit hook. Invoked automatically by .githooks/pre-commit. Do not call interactively.
---

# Pre-Commit CI Skill

Validates staged changes by running the minimum checks required to catch build and lint errors before a commit lands. You are running non-interactively inside a git hook — be fast, be concise, and emit exactly one sentinel as the final line.

## Inputs

You will receive a list of staged file paths (relative to repo root), one per line. Use this list to decide which checks to run. Do not read file contents — file paths are sufficient.

## Decision table

| Staged files contain                        | Run                                            |
|---------------------------------------------|------------------------------------------------|
| any `*.cs`, `*.csproj`, or `*.slnx` file   | Backend build                                  |
| any file under `frontend/`                  | Frontend lint, then frontend build             |
| both                                        | Backend build, then frontend lint + build      |
| neither                                     | (hook skips Claude — you won't run)            |

## Steps

### Backend build

Run from repo root:

```bash
dotnet build HelpDeskApp.slnx
```

A non-zero exit code means the build failed.

### Frontend lint

Run from repo root:

```bash
cd frontend && npm run lint
```

A non-zero exit code means lint errors exist.

### Frontend build (TypeScript check + production build)

Run from repo root:

```bash
cd frontend && npm run build
```

A non-zero exit code means type errors or build failures.

## Output requirements

Your final line of output must be **exactly** one of:

```
CI_PASS
```

or

```
CI_FAIL: <short reason>
```

Where `<short reason>` is a single sentence identifying the first failure, e.g.:
- `CI_FAIL: dotnet build failed with 2 error(s)`
- `CI_FAIL: frontend lint reported 3 error(s)`
- `CI_FAIL: frontend build failed — TypeScript type error in App.tsx`

Before the sentinel you may output command results, error excerpts, or a brief summary. The sentinel must be the absolute last line with no trailing whitespace or blank lines after it.

## Rules

- Run checks sequentially. Stop at the first failure and emit `CI_FAIL:` immediately.
- Never start the dev server, the API, or E2E tests.
- Do not edit files. `--allowedTools "Bash"` is your only permitted tool.
- Do not prompt for input or ask clarifying questions.
- Keep total output under 50 lines — truncate long build logs to the last 20 lines of relevant errors.
