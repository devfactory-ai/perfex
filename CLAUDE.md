# Project Instructions for AI Agents

This file provides instructions and context for AI coding agents working on this project.

<!-- BEGIN BEADS INTEGRATION v:1 profile:minimal hash:ca08a54f -->
## Beads Issue Tracker

This project uses **bd (beads)** for issue tracking. Run `bd prime` to see full workflow context and commands.

### Quick Reference

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --claim  # Claim work
bd close <id>         # Complete work
```

### Rules

- Use `bd` for ALL task tracking — do NOT use TodoWrite, TaskCreate, or markdown TODO lists
- Run `bd prime` for detailed command reference and session close protocol
- Use `bd remember` for persistent knowledge — do NOT use MEMORY.md files

## Session Completion

**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.

**MANDATORY WORKFLOW:**

1. **File issues for remaining work** - Create issues for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **PUSH TO REMOTE** - This is MANDATORY:
   ```bash
   git pull --rebase
   bd dolt push
   git push
   git status  # MUST show "up to date with origin"
   ```
5. **Clean up** - Clear stashes, prune remote branches
6. **Verify** - All changes committed AND pushed
7. **Hand off** - Provide context for next session

**CRITICAL RULES:**
- Work is NOT complete until `git push` succeeds
- NEVER stop before pushing - that leaves work stranded locally
- NEVER say "ready to push when you are" - YOU must push
- If push fails, resolve and retry until it succeeds
<!-- END BEADS INTEGRATION -->


## Build & Test

```bash
pnpm install              # Install all dependencies
pnpm build                # Build all packages (turbo)
pnpm test                 # Run all tests (turbo)
pnpm type-check           # TypeScript checking
pnpm lint                 # ESLint
pnpm format               # Prettier

# Per-package
cd apps/web && pnpm dev                  # Frontend dev server
cd apps/workers/api && pnpm dev          # API dev (wrangler)
cd apps/web && pnpm test:run             # Frontend tests (vitest)
cd apps/workers/api && pnpm test         # API tests (vitest)

# Database
pnpm db:generate                         # Generate migration from schema
pnpm db:migrate:local                    # Apply migrations locally
pnpm db:migrate:prod                     # Apply migrations to production

# Deploy
cd apps/workers/api && pnpm deploy       # Deploy API (production)
cd apps/workers/api && pnpm deploy:staging  # Deploy API (staging)
```

## Architecture Overview

**Perfex Bakery** — ERP dedie boulangeries-patisseries. Monorepo pnpm + Turborepo deploye sur Cloudflare.

- `apps/web` : SPA React 18 + Vite + TailwindCSS -> Cloudflare Pages
- `apps/workers/api` : API REST Hono.js -> Cloudflare Workers (19 routes)
- `packages/database` : Schemas Drizzle ORM + 35 migrations -> Cloudflare D1 (12 schemas, 44 tables bakery)
- `packages/shared` : Types TypeScript + validateurs Zod (partages front/back)
- `packages/integrations` : Connecteurs marche tunisien (paiement, SMS, shipping)
- `perfex-vitrine/` : Site vitrine boulangerie (sous-repo git)

**Modules** : Bakery (stock/production/maintenance/ventes/reporting), Recettes, Tracabilite, POS, Inventaire, RH, Finance.
**Auth** : JWT (access 24h + refresh 7j), bcrypt, CSRF, rate-limiting KV.
**State** : Zustand (auth), React Query (data fetching).
**Multi-tenant** : Organisations -> membres.

## Conventions & Patterns

- **API** : Routes Hono dans `routes/`, logique dans `services/`, validation Zod
- **Frontend** : Pages dans `pages/`, composants dans `components/`, hooks dans `hooks/`
- **Auth middleware** : `authMiddleware` -> `requirePermissions` / `requireRole`
- **Permissions** : Role-based (admin/owner/manager/member/viewer) avec wildcards
- **IDs** : UUID v4 (`crypto.randomUUID()`)
- **Dates** : objets `Date` natifs
- **Erreurs API** : `{ error: { code, message } }` avec status HTTP standard
- **DB** : Drizzle ORM, schemas dans `packages/database/src/schema/`
- **Build** : `VITE_APP_VARIANT=perfex-bakery` (defaut)
- **Tests** : Vitest + Testing Library — ~20 fichiers de test, modules critiques couverts
- **Erreurs** : Classes structurees AppError (NotFoundError, ValidationError, etc.)
- **Pagination** : Server-side via `utils/pagination.ts` (parsePagination, buildPaginationMeta)
- **Notifications** : sonner (toast) — pas d'alert() natif
