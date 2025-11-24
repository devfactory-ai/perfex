# Tâches Complètes - Perfex ERP AI-Native

> Toutes les tâches pour les 12 modules sur 12 mois
> Organisation: Phase → Module → Semaine → Tâche
> Version 1.0 - Novembre 2025

---

# LÉGENDE

**Priorité:**
- 🔴 P0 - Critique (bloquant)
- 🟠 P1 - Important
- 🟡 P2 - Nice to have

**Estimation:**
- ⏱️ 15min | 30min | 1h | 2h | 4h | 1j

**Status:**
- ⬜ Todo
- 🔄 In Progress
- ✅ Done

---

# PHASE 1: MVP (Mois 1-4)

---

## MODULE 1: AUTH (Semaines 1-4)

### Semaine 1: Infrastructure & Auth Core

#### Jour 1: Setup Infrastructure

| ID | Tâche | Priorité | Temps | Status |
|----|-------|----------|-------|--------|
| AUTH-001 | Créer compte Cloudflare si nécessaire | 🔴 P0 | ⏱️ 15min | ⬜ |
| AUTH-002 | `wrangler login` et vérifier accès | 🔴 P0 | ⏱️ 5min | ⬜ |
| AUTH-003 | Créer D1 database: `wrangler d1 create perfex-db` | 🔴 P0 | ⏱️ 5min | ⬜ |
| AUTH-004 | Créer R2 bucket: `wrangler r2 bucket create perfex-storage` | 🔴 P0 | ⏱️ 5min | ⬜ |
| AUTH-005 | Créer KV namespaces (CACHE, SESSIONS) | 🔴 P0 | ⏱️ 5min | ⬜ |
| AUTH-006 | Créer Vectorize index | 🟠 P1 | ⏱️ 5min | ⬜ |
| AUTH-007 | Créer Queue | 🟠 P1 | ⏱️ 5min | ⬜ |
| AUTH-008 | Configurer JWT_SECRET: `wrangler secret put JWT_SECRET` | 🔴 P0 | ⏱️ 5min | ⬜ |
| AUTH-009 | Sauvegarder TOUS les IDs dans un fichier sécurisé | 🔴 P0 | ⏱️ 10min | ⬜ |

#### Jour 1: Init Projet

| ID | Tâche | Priorité | Temps | Status |
|----|-------|----------|-------|--------|
| AUTH-010 | Créer dossier projet: `mkdir perfex && cd perfex` | 🔴 P0 | ⏱️ 1min | ⬜ |
| AUTH-011 | Init Speckit: `specify init . --ai claude` | 🔴 P0 | ⏱️ 2min | ⬜ |
| AUTH-012 | Copier constitution dans `.specify/memory/constitution.md` | 🔴 P0 | ⏱️ 5min | ⬜ |
| AUTH-013 | Créer structure monorepo (apps/, packages/) | 🔴 P0 | ⏱️ 10min | ⬜ |
| AUTH-014 | Créer pnpm-workspace.yaml | 🔴 P0 | ⏱️ 5min | ⬜ |
| AUTH-015 | Créer package.json root avec turbo | 🔴 P0 | ⏱️ 5min | ⬜ |
| AUTH-016 | `pnpm install` | 🔴 P0 | ⏱️ 2min | ⬜ |
| AUTH-017 | Init git: `git init && git add . && git commit -m "chore: init"` | 🔴 P0 | ⏱️ 5min | ⬜ |

#### Jour 2: Database Package

| ID | Tâche | Priorité | Temps | Status |
|----|-------|----------|-------|--------|
| AUTH-018 | Créer packages/database/package.json | 🔴 P0 | ⏱️ 10min | ⬜ |
| AUTH-019 | Créer packages/database/drizzle.config.ts | 🔴 P0 | ⏱️ 10min | ⬜ |
| AUTH-020 | Créer packages/database/src/schema/users.ts | 🔴 P0 | ⏱️ 30min | ⬜ |
| AUTH-021 | Créer packages/database/src/schema/index.ts | 🔴 P0 | ⏱️ 5min | ⬜ |
| AUTH-022 | Générer migration: `pnpm drizzle-kit generate:sqlite` | 🔴 P0 | ⏱️ 5min | ⬜ |
| AUTH-023 | Appliquer migration locale: `wrangler d1 migrations apply --local` | 🔴 P0 | ⏱️ 5min | ⬜ |
| AUTH-024 | Vérifier table créée avec query SQL | 🔴 P0 | ⏱️ 5min | ⬜ |

#### Jour 2: Shared Package

| ID | Tâche | Priorité | Temps | Status |
|----|-------|----------|-------|--------|
| AUTH-025 | Créer packages/shared/package.json | 🔴 P0 | ⏱️ 10min | ⬜ |
| AUTH-026 | Créer packages/shared/src/types/auth.ts (User, SafeUser, Tokens, etc.) | 🔴 P0 | ⏱️ 30min | ⬜ |
| AUTH-027 | Créer packages/shared/src/validators/auth.ts (6 schemas Zod) | 🔴 P0 | ⏱️ 45min | ⬜ |
| AUTH-028 | Créer packages/shared/src/index.ts (exports) | 🔴 P0 | ⏱️ 5min | ⬜ |
| AUTH-029 | Vérifier compilation TypeScript | 🔴 P0 | ⏱️ 5min | ⬜ |

#### Jour 3: Worker API Setup

| ID | Tâche | Priorité | Temps | Status |
|----|-------|----------|-------|--------|
| AUTH-030 | Créer apps/workers/api/package.json | 🔴 P0 | ⏱️ 15min | ⬜ |
| AUTH-031 | Créer apps/workers/api/tsconfig.json | 🔴 P0 | ⏱️ 10min | ⬜ |
| AUTH-032 | Créer apps/workers/api/wrangler.toml (avec IDs) | 🔴 P0 | ⏱️ 20min | ⬜ |
| AUTH-033 | Créer apps/workers/api/src/index.ts (Hono base) | 🔴 P0 | ⏱️ 30min | ⬜ |
| AUTH-034 | Test worker: `wrangler dev` | 🔴 P0 | ⏱️ 10min | ⬜ |
| AUTH-035 | Test health check: `curl localhost:8787` | 🔴 P0 | ⏱️ 5min | ⬜ |

#### Jour 3-4: AuthService Implementation

| ID | Tâche | Priorité | Temps | Status |
|----|-------|----------|-------|--------|
| AUTH-036 | Créer apps/workers/api/src/services/auth.service.ts (structure) | 🔴 P0 | ⏱️ 30min | ⬜ |
| AUTH-037 | Implémenter hashPassword() et comparePassword() | 🔴 P0 | ⏱️ 20min | ⬜ |
| AUTH-038 | Implémenter generateAccessToken() et generateRefreshToken() | 🔴 P0 | ⏱️ 30min | ⬜ |
| AUTH-039 | Implémenter verifyToken() | 🔴 P0 | ⏱️ 15min | ⬜ |
| AUTH-040 | Implémenter checkRateLimit() et incrementRateLimit() | 🔴 P0 | ⏱️ 30min | ⬜ |
| AUTH-041 | Implémenter register() | 🔴 P0 | ⏱️ 45min | ⬜ |
| AUTH-042 | Implémenter login() | 🔴 P0 | ⏱️ 45min | ⬜ |
| AUTH-043 | Implémenter refresh() | 🔴 P0 | ⏱️ 20min | ⬜ |
| AUTH-044 | Implémenter logout() | 🔴 P0 | ⏱️ 15min | ⬜ |
| AUTH-045 | Implémenter getProfile() | 🔴 P0 | ⏱️ 15min | ⬜ |
| AUTH-046 | Implémenter updateProfile() | 🔴 P0 | ⏱️ 20min | ⬜ |
| AUTH-047 | Implémenter forgotPassword() | 🔴 P0 | ⏱️ 30min | ⬜ |
| AUTH-048 | Implémenter resetPassword() | 🔴 P0 | ⏱️ 30min | ⬜ |

#### Jour 4-5: Middleware & Routes

| ID | Tâche | Priorité | Temps | Status |
|----|-------|----------|-------|--------|
| AUTH-049 | Créer apps/workers/api/src/middleware/auth.ts (JWT middleware) | 🔴 P0 | ⏱️ 45min | ⬜ |
| AUTH-050 | Créer apps/workers/api/src/routes/auth.ts | 🔴 P0 | ⏱️ 30min | ⬜ |
| AUTH-051 | Implémenter POST /register | 🔴 P0 | ⏱️ 20min | ⬜ |
| AUTH-052 | Implémenter POST /login | 🔴 P0 | ⏱️ 20min | ⬜ |
| AUTH-053 | Implémenter POST /refresh | 🔴 P0 | ⏱️ 15min | ⬜ |
| AUTH-054 | Implémenter POST /logout | 🔴 P0 | ⏱️ 15min | ⬜ |
| AUTH-055 | Implémenter GET /me | 🔴 P0 | ⏱️ 15min | ⬜ |
| AUTH-056 | Implémenter PUT /me | 🔴 P0 | ⏱️ 15min | ⬜ |
| AUTH-057 | Implémenter POST /forgot-password | 🔴 P0 | ⏱️ 15min | ⬜ |
| AUTH-058 | Implémenter POST /reset-password | 🔴 P0 | ⏱️ 15min | ⬜ |
| AUTH-059 | Monter routes dans index.ts | 🔴 P0 | ⏱️ 10min | ⬜ |
| AUTH-060 | Test manuel tous endpoints avec curl | 🔴 P0 | ⏱️ 30min | ⬜ |

#### Jour 5: Tests & Documentation

| ID | Tâche | Priorité | Temps | Status |
|----|-------|----------|-------|--------|
| AUTH-061 | Créer apps/workers/api/vitest.config.ts | 🔴 P0 | ⏱️ 15min | ⬜ |
| AUTH-062 | Créer tests auth.service.test.ts | 🔴 P0 | ⏱️ 2h | ⬜ |
| AUTH-063 | Créer tests auth.test.ts (routes) | 🔴 P0 | ⏱️ 1h | ⬜ |
| AUTH-064 | Vérifier coverage ≥ 80% | 🔴 P0 | ⏱️ 30min | ⬜ |
| AUTH-065 | Créer README.md pour api/ | 🟠 P1 | ⏱️ 30min | ⬜ |
| AUTH-066 | Git commit: "feat(auth): implement auth module" | 🔴 P0 | ⏱️ 5min | ⬜ |

### Semaine 2: Auth Advanced & Organizations

#### Organizations Schema & Service

| ID | Tâche | Priorité | Temps | Status |
|----|-------|----------|-------|--------|
| AUTH-067 | Créer schema organizations.ts | 🔴 P0 | ⏱️ 30min | ⬜ |
| AUTH-068 | Créer schema organization_members.ts | 🔴 P0 | ⏱️ 20min | ⬜ |
| AUTH-069 | Créer schema roles.ts et user_roles.ts | 🔴 P0 | ⏱️ 30min | ⬜ |
| AUTH-070 | Générer et appliquer migrations | 🔴 P0 | ⏱️ 10min | ⬜ |
| AUTH-071 | Créer types organizations (shared) | 🔴 P0 | ⏱️ 20min | ⬜ |
| AUTH-072 | Créer validators organizations (Zod) | 🔴 P0 | ⏱️ 30min | ⬜ |
| AUTH-073 | Créer OrganizationService | 🔴 P0 | ⏱️ 2h | ⬜ |
| AUTH-074 | Créer RoleService | 🔴 P0 | ⏱️ 1h | ⬜ |

#### Organizations Routes

| ID | Tâche | Priorité | Temps | Status |
|----|-------|----------|-------|--------|
| AUTH-075 | Créer routes/organizations.ts | 🔴 P0 | ⏱️ 30min | ⬜ |
| AUTH-076 | POST /organizations (créer) | 🔴 P0 | ⏱️ 20min | ⬜ |
| AUTH-077 | GET /organizations (liste) | 🔴 P0 | ⏱️ 15min | ⬜ |
| AUTH-078 | GET /organizations/:id | 🔴 P0 | ⏱️ 15min | ⬜ |
| AUTH-079 | PUT /organizations/:id | 🔴 P0 | ⏱️ 15min | ⬜ |
| AUTH-080 | DELETE /organizations/:id | 🔴 P0 | ⏱️ 15min | ⬜ |
| AUTH-081 | POST /organizations/:id/invite | 🔴 P0 | ⏱️ 30min | ⬜ |
| AUTH-082 | GET /organizations/:id/members | 🔴 P0 | ⏱️ 15min | ⬜ |
| AUTH-083 | PUT /organizations/:id/members/:userId | 🔴 P0 | ⏱️ 20min | ⬜ |
| AUTH-084 | DELETE /organizations/:id/members/:userId | 🔴 P0 | ⏱️ 15min | ⬜ |

#### RBAC Routes

| ID | Tâche | Priorité | Temps | Status |
|----|-------|----------|-------|--------|
| AUTH-085 | Créer routes/roles.ts | 🔴 P0 | ⏱️ 20min | ⬜ |
| AUTH-086 | GET /roles | 🔴 P0 | ⏱️ 15min | ⬜ |
| AUTH-087 | POST /roles | 🔴 P0 | ⏱️ 20min | ⬜ |
| AUTH-088 | PUT /roles/:id | 🔴 P0 | ⏱️ 15min | ⬜ |
| AUTH-089 | DELETE /roles/:id | 🔴 P0 | ⏱️ 15min | ⬜ |
| AUTH-090 | Créer middleware RBAC (checkPermission) | 🔴 P0 | ⏱️ 45min | ⬜ |

### Semaine 3-4: Frontend Auth

#### Frontend Setup

| ID | Tâche | Priorité | Temps | Status |
|----|-------|----------|-------|--------|
| AUTH-091 | Créer apps/web/package.json (React, Vite) | 🔴 P0 | ⏱️ 15min | ⬜ |
| AUTH-092 | Créer vite.config.ts | 🔴 P0 | ⏱️ 10min | ⬜ |
| AUTH-093 | Créer tailwind.config.js | 🔴 P0 | ⏱️ 10min | ⬜ |
| AUTH-094 | Installer Shadcn/ui: `npx shadcn-ui@latest init` | 🔴 P0 | ⏱️ 10min | ⬜ |
| AUTH-095 | Installer components Shadcn (button, input, form, card, toast) | 🔴 P0 | ⏱️ 15min | ⬜ |
| AUTH-096 | Créer structure src/ (components, pages, lib, stores, hooks) | 🔴 P0 | ⏱️ 10min | ⬜ |

#### Auth Store & API

| ID | Tâche | Priorité | Temps | Status |
|----|-------|----------|-------|--------|
| AUTH-097 | Créer lib/api.ts (axios instance) | 🔴 P0 | ⏱️ 20min | ⬜ |
| AUTH-098 | Créer stores/auth.ts (Zustand) | 🔴 P0 | ⏱️ 45min | ⬜ |
| AUTH-099 | Créer hooks/useAuth.ts | 🔴 P0 | ⏱️ 20min | ⬜ |
| AUTH-100 | Créer components/ProtectedRoute.tsx | 🔴 P0 | ⏱️ 30min | ⬜ |

#### Auth Pages

| ID | Tâche | Priorité | Temps | Status |
|----|-------|----------|-------|--------|
| AUTH-101 | Créer pages/auth/LoginPage.tsx | 🔴 P0 | ⏱️ 1h | ⬜ |
| AUTH-102 | Créer pages/auth/RegisterPage.tsx | 🔴 P0 | ⏱️ 1h | ⬜ |
| AUTH-103 | Créer pages/auth/ForgotPasswordPage.tsx | 🟠 P1 | ⏱️ 45min | ⬜ |
| AUTH-104 | Créer pages/auth/ResetPasswordPage.tsx | 🟠 P1 | ⏱️ 45min | ⬜ |

#### Dashboard Layout

| ID | Tâche | Priorité | Temps | Status |
|----|-------|----------|-------|--------|
| AUTH-105 | Créer components/layouts/DashboardLayout.tsx | 🔴 P0 | ⏱️ 1h | ⬜ |
| AUTH-106 | Créer components/layouts/Sidebar.tsx | 🔴 P0 | ⏱️ 45min | ⬜ |
| AUTH-107 | Créer components/layouts/TopBar.tsx | 🔴 P0 | ⏱️ 30min | ⬜ |
| AUTH-108 | Créer pages/DashboardPage.tsx | 🔴 P0 | ⏱️ 30min | ⬜ |
| AUTH-109 | Créer pages/profile/ProfilePage.tsx | 🔴 P0 | ⏱️ 1h | ⬜ |

#### Organizations UI

| ID | Tâche | Priorité | Temps | Status |
|----|-------|----------|-------|--------|
| AUTH-110 | Créer pages/organizations/OrganizationsPage.tsx | 🔴 P0 | ⏱️ 1h | ⬜ |
| AUTH-111 | Créer pages/organizations/OrganizationSettingsPage.tsx | 🔴 P0 | ⏱️ 1h | ⬜ |
| AUTH-112 | Créer pages/organizations/MembersPage.tsx | 🔴 P0 | ⏱️ 1h | ⬜ |
| AUTH-113 | Créer components/OrganizationSwitcher.tsx | 🔴 P0 | ⏱️ 45min | ⬜ |

#### Routing & Tests

| ID | Tâche | Priorité | Temps | Status |
|----|-------|----------|-------|--------|
| AUTH-114 | Configurer React Router (routes.tsx) | 🔴 P0 | ⏱️ 30min | ⬜ |
| AUTH-115 | Test flow complet: Register → Login → Dashboard | 🔴 P0 | ⏱️ 30min | ⬜ |
| AUTH-116 | Test responsive mobile | 🟠 P1 | ⏱️ 30min | ⬜ |
| AUTH-117 | Git commit: "feat(auth): add frontend auth" | 🔴 P0 | ⏱️ 5min | ⬜ |

---

## MODULE 2: FINANCE (Semaines 5-8)

### Semaine 5-6: Comptabilité Base

#### Database Schema Finance

| ID | Tâche | Priorité | Temps | Status |
|----|-------|----------|-------|--------|
| FIN-001 | Créer schema accounts.ts (plan comptable) | 🔴 P0 | ⏱️ 30min | ⬜ |
| FIN-002 | Créer schema journals.ts | 🔴 P0 | ⏱️ 20min | ⬜ |
| FIN-003 | Créer schema journal_entries.ts | 🔴 P0 | ⏱️ 30min | ⬜ |
| FIN-004 | Créer schema journal_entry_lines.ts | 🔴 P0 | ⏱️ 25min | ⬜ |
| FIN-005 | Créer schema fiscal_years.ts | 🔴 P0 | ⏱️ 15min | ⬜ |
| FIN-006 | Créer schema tax_rates.ts | 🔴 P0 | ⏱️ 15min | ⬜ |
| FIN-007 | Générer et appliquer migrations | 🔴 P0 | ⏱️ 10min | ⬜ |

#### Types & Validators Finance

| ID | Tâche | Priorité | Temps | Status |
|----|-------|----------|-------|--------|
| FIN-008 | Créer types/finance.ts | 🔴 P0 | ⏱️ 45min | ⬜ |
| FIN-009 | Créer validators/finance.ts | 🔴 P0 | ⏱️ 1h | ⬜ |

#### Accounts Service & Routes

| ID | Tâche | Priorité | Temps | Status |
|----|-------|----------|-------|--------|
| FIN-010 | Créer AccountService | 🔴 P0 | ⏱️ 2h | ⬜ |
| FIN-011 | Créer routes/accounts.ts | 🔴 P0 | ⏱️ 1h | ⬜ |
| FIN-012 | Import plan comptable template (FR) | 🔴 P0 | ⏱️ 1h | ⬜ |
| FIN-013 | Export plan comptable | 🟠 P1 | ⏱️ 30min | ⬜ |

#### Journal Entries Service & Routes

| ID | Tâche | Priorité | Temps | Status |
|----|-------|----------|-------|--------|
| FIN-014 | Créer JournalEntryService | 🔴 P0 | ⏱️ 3h | ⬜ |
| FIN-015 | Validation équilibre débit/crédit | 🔴 P0 | ⏱️ 30min | ⬜ |
| FIN-016 | Créer routes/journal-entries.ts | 🔴 P0 | ⏱️ 1h30 | ⬜ |
| FIN-017 | Endpoint POST pour validation écriture | 🔴 P0 | ⏱️ 30min | ⬜ |
| FIN-018 | Endpoint POST pour annulation | 🔴 P0 | ⏱️ 30min | ⬜ |
| FIN-019 | Endpoint POST pour extourne | 🟠 P1 | ⏱️ 45min | ⬜ |

#### Reports Comptables

| ID | Tâche | Priorité | Temps | Status |
|----|-------|----------|-------|--------|
| FIN-020 | Créer ReportService | 🔴 P0 | ⏱️ 2h | ⬜ |
| FIN-021 | GET /reports/general-ledger | 🔴 P0 | ⏱️ 1h | ⬜ |
| FIN-022 | GET /reports/trial-balance | 🔴 P0 | ⏱️ 1h | ⬜ |
| FIN-023 | GET /reports/balance-sheet | 🟠 P1 | ⏱️ 1h30 | ⬜ |
| FIN-024 | GET /reports/income-statement | 🟠 P1 | ⏱️ 1h30 | ⬜ |

### Semaine 7-8: Facturation

#### Invoices Schema & Service

| ID | Tâche | Priorité | Temps | Status |
|----|-------|----------|-------|--------|
| FIN-025 | Créer schema invoices.ts | 🔴 P0 | ⏱️ 30min | ⬜ |
| FIN-026 | Créer schema invoice_lines.ts | 🔴 P0 | ⏱️ 20min | ⬜ |
| FIN-027 | Créer InvoiceService | 🔴 P0 | ⏱️ 3h | ⬜ |
| FIN-028 | Numérotation séquentielle automatique | 🔴 P0 | ⏱️ 30min | ⬜ |
| FIN-029 | Calcul TVA automatique | 🔴 P0 | ⏱️ 45min | ⬜ |
| FIN-030 | Génération écriture comptable | 🔴 P0 | ⏱️ 1h | ⬜ |

#### Invoices Routes

| ID | Tâche | Priorité | Temps | Status |
|----|-------|----------|-------|--------|
| FIN-031 | Créer routes/invoices.ts | 🔴 P0 | ⏱️ 30min | ⬜ |
| FIN-032 | CRUD factures complet | 🔴 P0 | ⏱️ 1h | ⬜ |
| FIN-033 | POST /invoices/:id/send | 🔴 P0 | ⏱️ 45min | ⬜ |
| FIN-034 | POST /invoices/:id/pdf | 🔴 P0 | ⏱️ 2h | ⬜ |
| FIN-035 | POST /invoices/:id/duplicate | 🟠 P1 | ⏱️ 30min | ⬜ |

#### Payments

| ID | Tâche | Priorité | Temps | Status |
|----|-------|----------|-------|--------|
| FIN-036 | Créer schema payments.ts | 🔴 P0 | ⏱️ 20min | ⬜ |
| FIN-037 | Créer schema payment_allocations.ts | 🔴 P0 | ⏱️ 15min | ⬜ |
| FIN-038 | Créer PaymentService | 🔴 P0 | ⏱️ 2h | ⬜ |
| FIN-039 | Créer routes/payments.ts | 🔴 P0 | ⏱️ 1h | ⬜ |
| FIN-040 | Affectation paiement aux factures | 🔴 P0 | ⏱️ 1h | ⬜ |

#### Bank Accounts

| ID | Tâche | Priorité | Temps | Status |
|----|-------|----------|-------|--------|
| FIN-041 | Créer schema bank_accounts.ts | 🔴 P0 | ⏱️ 20min | ⬜ |
| FIN-042 | Créer BankAccountService | 🔴 P0 | ⏱️ 1h30 | ⬜ |
| FIN-043 | Créer routes/bank-accounts.ts | 🔴 P0 | ⏱️ 1h | ⬜ |
| FIN-044 | Rapprochement bancaire basique | 🟠 P1 | ⏱️ 2h | ⬜ |

#### Frontend Finance

| ID | Tâche | Priorité | Temps | Status |
|----|-------|----------|-------|--------|
| FIN-045 | Créer pages/finance/AccountsPage.tsx | 🔴 P0 | ⏱️ 2h | ⬜ |
| FIN-046 | Créer pages/finance/JournalEntriesPage.tsx | 🔴 P0 | ⏱️ 2h | ⬜ |
| FIN-047 | Créer pages/finance/InvoicesPage.tsx | 🔴 P0 | ⏱️ 2h | ⬜ |
| FIN-048 | Créer pages/finance/InvoiceDetailPage.tsx | 🔴 P0 | ⏱️ 2h | ⬜ |
| FIN-049 | Créer components/InvoiceForm.tsx | 🔴 P0 | ⏱️ 2h | ⬜ |
| FIN-050 | Créer pages/finance/PaymentsPage.tsx | 🔴 P0 | ⏱️ 1h30 | ⬜ |
| FIN-051 | Créer pages/finance/ReportsPage.tsx | 🔴 P0 | ⏱️ 2h | ⬜ |
| FIN-052 | Tests Finance (80%+ coverage) | 🔴 P0 | ⏱️ 4h | ⬜ |
| FIN-053 | Git commit: "feat(finance): implement finance module" | 🔴 P0 | ⏱️ 5min | ⬜ |

---

## MODULE 3: CRM (Semaines 9-12)

### Semaine 9-10: CRM Core

#### Database Schema CRM

| ID | Tâche | Priorité | Temps | Status |
|----|-------|----------|-------|--------|
| CRM-001 | Créer schema companies.ts | 🔴 P0 | ⏱️ 30min | ⬜ |
| CRM-002 | Créer schema contacts.ts | 🔴 P0 | ⏱️ 30min | ⬜ |
| CRM-003 | Créer schema pipeline_stages.ts | 🔴 P0 | ⏱️ 15min | ⬜ |
| CRM-004 | Créer schema opportunities.ts | 🔴 P0 | ⏱️ 25min | ⬜ |
| CRM-005 | Créer schema activities.ts | 🔴 P0 | ⏱️ 20min | ⬜ |
| CRM-006 | Créer schema products.ts | 🔴 P0 | ⏱️ 20min | ⬜ |
| CRM-007 | Générer et appliquer migrations | 🔴 P0 | ⏱️ 10min | ⬜ |

#### Contacts & Companies Services

| ID | Tâche | Priorité | Temps | Status |
|----|-------|----------|-------|--------|
| CRM-008 | Créer types/crm.ts | 🔴 P0 | ⏱️ 45min | ⬜ |
| CRM-009 | Créer validators/crm.ts | 🔴 P0 | ⏱️ 1h | ⬜ |
| CRM-010 | Créer ContactService | 🔴 P0 | ⏱️ 2h | ⬜ |
| CRM-011 | Créer CompanyService | 🔴 P0 | ⏱️ 1h30 | ⬜ |
| CRM-012 | Import CSV contacts | 🔴 P0 | ⏱️ 2h | ⬜ |
| CRM-013 | Export CSV contacts | 🟠 P1 | ⏱️ 1h | ⬜ |

#### Contacts Routes

| ID | Tâche | Priorité | Temps | Status |
|----|-------|----------|-------|--------|
| CRM-014 | Créer routes/contacts.ts | 🔴 P0 | ⏱️ 1h30 | ⬜ |
| CRM-015 | Créer routes/companies.ts | 🔴 P0 | ⏱️ 1h | ⬜ |
| CRM-016 | Pagination et filtres avancés | 🔴 P0 | ⏱️ 1h | ⬜ |
| CRM-017 | Tags et catégories | 🟠 P1 | ⏱️ 45min | ⬜ |

#### Pipeline & Opportunities

| ID | Tâche | Priorité | Temps | Status |
|----|-------|----------|-------|--------|
| CRM-018 | Créer OpportunityService | 🔴 P0 | ⏱️ 2h | ⬜ |
| CRM-019 | Créer PipelineService | 🔴 P0 | ⏱️ 1h | ⬜ |
| CRM-020 | Créer routes/opportunities.ts | 🔴 P0 | ⏱️ 1h30 | ⬜ |
| CRM-021 | PUT /opportunities/:id/stage (drag & drop) | 🔴 P0 | ⏱️ 30min | ⬜ |
| CRM-022 | POST /opportunities/:id/won | 🔴 P0 | ⏱️ 20min | ⬜ |
| CRM-023 | POST /opportunities/:id/lost | 🔴 P0 | ⏱️ 20min | ⬜ |

#### Activities

| ID | Tâche | Priorité | Temps | Status |
|----|-------|----------|-------|--------|
| CRM-024 | Créer ActivityService | 🔴 P0 | ⏱️ 1h30 | ⬜ |
| CRM-025 | Créer routes/activities.ts | 🔴 P0 | ⏱️ 1h | ⬜ |
| CRM-026 | Lien activités ↔ contacts/opportunities | 🔴 P0 | ⏱️ 30min | ⬜ |

### Semaine 11-12: Devis & Frontend CRM

#### Quotes

| ID | Tâche | Priorité | Temps | Status |
|----|-------|----------|-------|--------|
| CRM-027 | Créer schema quotes.ts | 🔴 P0 | ⏱️ 25min | ⬜ |
| CRM-028 | Créer schema quote_lines.ts | 🔴 P0 | ⏱️ 15min | ⬜ |
| CRM-029 | Créer QuoteService | 🔴 P0 | ⏱️ 2h | ⬜ |
| CRM-030 | Créer routes/quotes.ts | 🔴 P0 | ⏱️ 1h30 | ⬜ |
| CRM-031 | Versions devis | 🔴 P0 | ⏱️ 45min | ⬜ |
| CRM-032 | Conversion devis → facture | 🔴 P0 | ⏱️ 1h | ⬜ |
| CRM-033 | Génération PDF devis | 🔴 P0 | ⏱️ 1h30 | ⬜ |

#### Products Catalog

| ID | Tâche | Priorité | Temps | Status |
|----|-------|----------|-------|--------|
| CRM-034 | Créer ProductService | 🔴 P0 | ⏱️ 1h | ⬜ |
| CRM-035 | Créer routes/products.ts | 🔴 P0 | ⏱️ 45min | ⬜ |

#### Frontend CRM

| ID | Tâche | Priorité | Temps | Status |
|----|-------|----------|-------|--------|
| CRM-036 | Créer pages/crm/ContactsPage.tsx | 🔴 P0 | ⏱️ 2h | ⬜ |
| CRM-037 | Créer pages/crm/ContactDetailPage.tsx | 🔴 P0 | ⏱️ 2h | ⬜ |
| CRM-038 | Créer pages/crm/CompaniesPage.tsx | 🔴 P0 | ⏱️ 1h30 | ⬜ |
| CRM-039 | Créer pages/crm/PipelinePage.tsx (Kanban) | 🔴 P0 | ⏱️ 3h | ⬜ |
| CRM-040 | Créer components/KanbanBoard.tsx | 🔴 P0 | ⏱️ 2h | ⬜ |
| CRM-041 | Créer pages/crm/OpportunityDetailPage.tsx | 🔴 P0 | ⏱️ 2h | ⬜ |
| CRM-042 | Créer pages/crm/QuotesPage.tsx | 🔴 P0 | ⏱️ 1h30 | ⬜ |
| CRM-043 | Créer pages/crm/QuoteDetailPage.tsx | 🔴 P0 | ⏱️ 2h | ⬜ |
| CRM-044 | Créer components/QuoteForm.tsx | 🔴 P0 | ⏱️ 2h | ⬜ |
| CRM-045 | Créer pages/crm/ActivitiesPage.tsx | 🔴 P0 | ⏱️ 1h30 | ⬜ |
| CRM-046 | Tests CRM (80%+ coverage) | 🔴 P0 | ⏱️ 4h | ⬜ |
| CRM-047 | Git commit: "feat(crm): implement CRM module" | 🔴 P0 | ⏱️ 5min | ⬜ |

---

## MODULE 4: AI CORE (Semaines 13-16)

### Semaine 13-14: Chat & Agents

#### Database Schema AI

| ID | Tâche | Priorité | Temps | Status |
|----|-------|----------|-------|--------|
| AI-001 | Créer schema conversations.ts | 🔴 P0 | ⏱️ 20min | ⬜ |
| AI-002 | Créer schema messages.ts | 🔴 P0 | ⏱️ 25min | ⬜ |
| AI-003 | Créer schema documents.ts | 🔴 P0 | ⏱️ 20min | ⬜ |
| AI-004 | Créer schema document_chunks.ts | 🔴 P0 | ⏱️ 15min | ⬜ |
| AI-005 | Créer schema agent_configs.ts | 🔴 P0 | ⏱️ 20min | ⬜ |
| AI-006 | Créer schema tools.ts | 🔴 P0 | ⏱️ 15min | ⬜ |
| AI-007 | Générer et appliquer migrations | 🔴 P0 | ⏱️ 10min | ⬜ |

#### AI Worker Setup

| ID | Tâche | Priorité | Temps | Status |
|----|-------|----------|-------|--------|
| AI-008 | Créer apps/workers/ai/ (nouveau worker) | 🔴 P0 | ⏱️ 30min | ⬜ |
| AI-009 | Configurer wrangler.toml AI worker | 🔴 P0 | ⏱️ 20min | ⬜ |
| AI-010 | Créer packages/ai-core/ | 🔴 P0 | ⏱️ 30min | ⬜ |

#### Chat Service

| ID | Tâche | Priorité | Temps | Status |
|----|-------|----------|-------|--------|
| AI-011 | Créer ChatService | 🔴 P0 | ⏱️ 2h | ⬜ |
| AI-012 | Intégration Workers AI (Llama 3.1) | 🔴 P0 | ⏱️ 2h | ⬜ |
| AI-013 | Streaming response implementation | 🔴 P0 | ⏱️ 2h | ⬜ |
| AI-014 | Conversation context management | 🔴 P0 | ⏱️ 1h | ⬜ |
| AI-015 | POST /chat (streaming endpoint) | 🔴 P0 | ⏱️ 1h | ⬜ |
| AI-016 | GET /chat/conversations | 🔴 P0 | ⏱️ 30min | ⬜ |
| AI-017 | DELETE /chat/conversations/:id | 🔴 P0 | ⏱️ 20min | ⬜ |

#### Agents Framework

| ID | Tâche | Priorité | Temps | Status |
|----|-------|----------|-------|--------|
| AI-018 | Créer AgentOrchestrator | 🔴 P0 | ⏱️ 3h | ⬜ |
| AI-019 | Créer FinanceAgent | 🔴 P0 | ⏱️ 2h | ⬜ |
| AI-020 | Créer SalesAgent | 🔴 P0 | ⏱️ 2h | ⬜ |
| AI-021 | Tools: get_invoices, create_invoice | 🔴 P0 | ⏱️ 2h | ⬜ |
| AI-022 | Tools: get_contacts, get_pipeline | 🔴 P0 | ⏱️ 1h30 | ⬜ |
| AI-023 | Tools: search_knowledge | 🔴 P0 | ⏱️ 1h | ⬜ |

### Semaine 15-16: RAG & Integration

#### RAG Pipeline

| ID | Tâche | Priorité | Temps | Status |
|----|-------|----------|-------|--------|
| AI-024 | Créer DocumentService | 🔴 P0 | ⏱️ 2h | ⬜ |
| AI-025 | Document upload (PDF, DOCX) | 🔴 P0 | ⏱️ 2h | ⬜ |
| AI-026 | Chunking intelligent | 🔴 P0 | ⏱️ 2h | ⬜ |
| AI-027 | Embeddings avec BGE (Vectorize) | 🔴 P0 | ⏱️ 2h | ⬜ |
| AI-028 | Vector search implementation | 🔴 P0 | ⏱️ 2h | ⬜ |
| AI-029 | Context injection dans prompts | 🔴 P0 | ⏱️ 1h30 | ⬜ |
| AI-030 | POST /documents (upload) | 🔴 P0 | ⏱️ 1h | ⬜ |
| AI-031 | POST /search (semantic search) | 🔴 P0 | ⏱️ 1h | ⬜ |

#### Frontend AI

| ID | Tâche | Priorité | Temps | Status |
|----|-------|----------|-------|--------|
| AI-032 | Créer components/ChatInterface.tsx | 🔴 P0 | ⏱️ 3h | ⬜ |
| AI-033 | Créer components/ChatMessage.tsx | 🔴 P0 | ⏱️ 1h | ⬜ |
| AI-034 | Streaming UI avec SSE | 🔴 P0 | ⏱️ 2h | ⬜ |
| AI-035 | Créer pages/ai/ChatPage.tsx | 🔴 P0 | ⏱️ 2h | ⬜ |
| AI-036 | Créer pages/ai/DocumentsPage.tsx | 🔴 P0 | ⏱️ 1h30 | ⬜ |
| AI-037 | Chat intégré dans tous modules | 🔴 P0 | ⏱️ 2h | ⬜ |

#### Integration & Polish MVP

| ID | Tâche | Priorité | Temps | Status |
|----|-------|----------|-------|--------|
| AI-038 | Cross-module linking (contact → facture) | 🔴 P0 | ⏱️ 2h | ⬜ |
| AI-039 | Dashboard unifié avec widgets | 🔴 P0 | ⏱️ 3h | ⬜ |
| AI-040 | Recherche globale | 🔴 P0 | ⏱️ 2h | ⬜ |
| AI-041 | Tests E2E parcours critiques | 🔴 P0 | ⏱️ 4h | ⬜ |
| AI-042 | Documentation API (OpenAPI) | 🔴 P0 | ⏱️ 3h | ⬜ |
| AI-043 | Guide utilisateur | 🟠 P1 | ⏱️ 3h | ⬜ |
| AI-044 | Deploy production Cloudflare | 🔴 P0 | ⏱️ 2h | ⬜ |
| AI-045 | Monitoring & alertes | 🔴 P0 | ⏱️ 2h | ⬜ |
| AI-046 | Git tag: "v0.1.0-mvp" | 🔴 P0 | ⏱️ 5min | ⬜ |

---

# PHASE 2: CORE MODULES (Mois 5-8)

## MODULE 5: PURCHASES (Semaines 17-20)

| ID | Tâche | Priorité | Temps | Status |
|----|-------|----------|-------|--------|
| PUR-001 | Schema suppliers.ts | 🔴 P0 | ⏱️ 25min | ⬜ |
| PUR-002 | Schema purchase_requisitions.ts | 🔴 P0 | ⏱️ 25min | ⬜ |
| PUR-003 | Schema purchase_orders.ts + lines | 🔴 P0 | ⏱️ 30min | ⬜ |
| PUR-004 | Schema goods_receipts.ts | 🔴 P0 | ⏱️ 20min | ⬜ |
| PUR-005 | Schema supplier_invoices.ts | 🔴 P0 | ⏱️ 25min | ⬜ |
| PUR-006 | Migrations | 🔴 P0 | ⏱️ 10min | ⬜ |
| PUR-007 | SupplierService | 🔴 P0 | ⏱️ 1h30 | ⬜ |
| PUR-008 | PurchaseRequisitionService | 🔴 P0 | ⏱️ 2h | ⬜ |
| PUR-009 | PurchaseOrderService | 🔴 P0 | ⏱️ 3h | ⬜ |
| PUR-010 | GoodsReceiptService | 🔴 P0 | ⏱️ 2h | ⬜ |
| PUR-011 | SupplierInvoiceService | 🔴 P0 | ⏱️ 2h | ⬜ |
| PUR-012 | Routes suppliers | 🔴 P0 | ⏱️ 1h | ⬜ |
| PUR-013 | Routes purchase-orders | 🔴 P0 | ⏱️ 1h30 | ⬜ |
| PUR-014 | Routes goods-receipts | 🔴 P0 | ⏱️ 1h | ⬜ |
| PUR-015 | Frontend: SuppliersPage | 🔴 P0 | ⏱️ 2h | ⬜ |
| PUR-016 | Frontend: PurchaseOrdersPage | 🔴 P0 | ⏱️ 2h | ⬜ |
| PUR-017 | Frontend: GoodsReceiptsPage | 🔴 P0 | ⏱️ 2h | ⬜ |
| PUR-018 | Tests & commit | 🔴 P0 | ⏱️ 4h | ⬜ |

---

## MODULE 6: INVENTORY (Semaines 21-24)

| ID | Tâche | Priorité | Temps | Status |
|----|-------|----------|-------|--------|
| INV-001 | Schema warehouses.ts | 🔴 P0 | ⏱️ 20min | ⬜ |
| INV-002 | Schema locations.ts | 🔴 P0 | ⏱️ 15min | ⬜ |
| INV-003 | Schema stock_levels.ts | 🔴 P0 | ⏱️ 25min | ⬜ |
| INV-004 | Schema stock_movements.ts | 🔴 P0 | ⏱️ 25min | ⬜ |
| INV-005 | Schema inventory_counts.ts + lines | 🔴 P0 | ⏱️ 25min | ⬜ |
| INV-006 | Schema lots.ts | 🔴 P0 | ⏱️ 15min | ⬜ |
| INV-007 | Schema serial_numbers.ts | 🔴 P0 | ⏱️ 15min | ⬜ |
| INV-008 | Migrations | 🔴 P0 | ⏱️ 10min | ⬜ |
| INV-009 | WarehouseService | 🔴 P0 | ⏱️ 1h30 | ⬜ |
| INV-010 | StockService | 🔴 P0 | ⏱️ 3h | ⬜ |
| INV-011 | StockMovementService | 🔴 P0 | ⏱️ 2h | ⬜ |
| INV-012 | InventoryCountService | 🔴 P0 | ⏱️ 2h | ⬜ |
| INV-013 | LotService | 🔴 P0 | ⏱️ 1h30 | ⬜ |
| INV-014 | Routes warehouses | 🔴 P0 | ⏱️ 1h | ⬜ |
| INV-015 | Routes stock | 🔴 P0 | ⏱️ 1h30 | ⬜ |
| INV-016 | Routes inventory-counts | 🔴 P0 | ⏱️ 1h | ⬜ |
| INV-017 | Alertes stock minimum | 🔴 P0 | ⏱️ 1h | ⬜ |
| INV-018 | Frontend: WarehousesPage | 🔴 P0 | ⏱️ 2h | ⬜ |
| INV-019 | Frontend: StockPage | 🔴 P0 | ⏱️ 2h | ⬜ |
| INV-020 | Frontend: MovementsPage | 🔴 P0 | ⏱️ 2h | ⬜ |
| INV-021 | Frontend: InventoryCountPage | 🔴 P0 | ⏱️ 2h | ⬜ |
| INV-022 | Tests & commit | 🔴 P0 | ⏱️ 4h | ⬜ |

---

## MODULE 7: PROJECTS (Semaines 25-28)

| ID | Tâche | Priorité | Temps | Status |
|----|-------|----------|-------|--------|
| PRJ-001 | Schema projects.ts | 🔴 P0 | ⏱️ 30min | ⬜ |
| PRJ-002 | Schema tasks.ts | 🔴 P0 | ⏱️ 25min | ⬜ |
| PRJ-003 | Schema task_dependencies.ts | 🔴 P0 | ⏱️ 15min | ⬜ |
| PRJ-004 | Schema milestones.ts | 🔴 P0 | ⏱️ 15min | ⬜ |
| PRJ-005 | Schema time_entries.ts | 🔴 P0 | ⏱️ 20min | ⬜ |
| PRJ-006 | Schema project_members.ts | 🔴 P0 | ⏱️ 15min | ⬜ |
| PRJ-007 | Schema project_documents.ts | 🔴 P0 | ⏱️ 15min | ⬜ |
| PRJ-008 | Migrations | 🔴 P0 | ⏱️ 10min | ⬜ |
| PRJ-009 | ProjectService | 🔴 P0 | ⏱️ 2h | ⬜ |
| PRJ-010 | TaskService | 🔴 P0 | ⏱️ 2h | ⬜ |
| PRJ-011 | TimeEntryService | 🔴 P0 | ⏱️ 1h30 | ⬜ |
| PRJ-012 | Routes projects | 🔴 P0 | ⏱️ 1h30 | ⬜ |
| PRJ-013 | Routes tasks | 🔴 P0 | ⏱️ 1h | ⬜ |
| PRJ-014 | Routes time-entries | 🔴 P0 | ⏱️ 1h | ⬜ |
| PRJ-015 | Frontend: ProjectsPage | 🔴 P0 | ⏱️ 2h | ⬜ |
| PRJ-016 | Frontend: ProjectDetailPage | 🔴 P0 | ⏱️ 3h | ⬜ |
| PRJ-017 | Frontend: TaskKanban | 🔴 P0 | ⏱️ 2h | ⬜ |
| PRJ-018 | Frontend: TimesheetPage | 🔴 P0 | ⏱️ 2h | ⬜ |
| PRJ-019 | Tests & commit | 🔴 P0 | ⏱️ 4h | ⬜ |

---

## MODULE 8: HR (Semaines 29-32)

| ID | Tâche | Priorité | Temps | Status |
|----|-------|----------|-------|--------|
| HR-001 | Schema departments.ts | 🔴 P0 | ⏱️ 15min | ⬜ |
| HR-002 | Schema job_positions.ts | 🔴 P0 | ⏱️ 15min | ⬜ |
| HR-003 | Schema employees.ts | 🔴 P0 | ⏱️ 35min | ⬜ |
| HR-004 | Schema contracts.ts | 🔴 P0 | ⏱️ 25min | ⬜ |
| HR-005 | Schema leave_types.ts | 🔴 P0 | ⏱️ 15min | ⬜ |
| HR-006 | Schema leave_requests.ts | 🔴 P0 | ⏱️ 20min | ⬜ |
| HR-007 | Schema leave_balances.ts | 🔴 P0 | ⏱️ 15min | ⬜ |
| HR-008 | Schema payslips.ts | 🔴 P0 | ⏱️ 25min | ⬜ |
| HR-009 | Schema expense_reports.ts + lines | 🔴 P0 | ⏱️ 25min | ⬜ |
| HR-010 | Migrations | 🔴 P0 | ⏱️ 10min | ⬜ |
| HR-011 | EmployeeService | 🔴 P0 | ⏱️ 2h | ⬜ |
| HR-012 | LeaveService | 🔴 P0 | ⏱️ 2h | ⬜ |
| HR-013 | PayrollService | 🔴 P0 | ⏱️ 3h | ⬜ |
| HR-014 | ExpenseService | 🔴 P0 | ⏱️ 2h | ⬜ |
| HR-015 | Routes employees | 🔴 P0 | ⏱️ 1h30 | ⬜ |
| HR-016 | Routes leaves | 🔴 P0 | ⏱️ 1h | ⬜ |
| HR-017 | Routes payroll | 🔴 P0 | ⏱️ 1h | ⬜ |
| HR-018 | Routes expenses | 🔴 P0 | ⏱️ 1h | ⬜ |
| HR-019 | Frontend: EmployeesPage | 🔴 P0 | ⏱️ 2h | ⬜ |
| HR-020 | Frontend: OrgChartPage | 🔴 P0 | ⏱️ 2h | ⬜ |
| HR-021 | Frontend: LeavesPage | 🔴 P0 | ⏱️ 2h | ⬜ |
| HR-022 | Frontend: PayrollPage | 🔴 P0 | ⏱️ 2h | ⬜ |
| HR-023 | Frontend: ExpensesPage | 🔴 P0 | ⏱️ 2h | ⬜ |
| HR-024 | Tests & commit | 🔴 P0 | ⏱️ 4h | ⬜ |
| HR-025 | Git tag: "v0.2.0-core" | 🔴 P0 | ⏱️ 5min | ⬜ |

---

# PHASE 3: ADVANCED (Mois 9-12)

## MODULE 9: MANUFACTURING (Semaines 33-37)

| ID | Tâche | Priorité | Temps | Status |
|----|-------|----------|-------|--------|
| MFG-001 | Schema boms.ts + bom_lines.ts | 🔴 P0 | ⏱️ 30min | ⬜ |
| MFG-002 | Schema work_centers.ts | 🔴 P0 | ⏱️ 20min | ⬜ |
| MFG-003 | Schema routings.ts | 🔴 P0 | ⏱️ 20min | ⬜ |
| MFG-004 | Schema manufacturing_orders.ts | 🔴 P0 | ⏱️ 30min | ⬜ |
| MFG-005 | Schema mo_operations.ts | 🔴 P0 | ⏱️ 20min | ⬜ |
| MFG-006 | Schema quality_checks.ts | 🔴 P0 | ⏱️ 20min | ⬜ |
| MFG-007 | Migrations | 🔴 P0 | ⏱️ 10min | ⬜ |
| MFG-008 | BOMService | 🔴 P0 | ⏱️ 2h | ⬜ |
| MFG-009 | ManufacturingOrderService | 🔴 P0 | ⏱️ 3h | ⬜ |
| MFG-010 | MRPService (calcul besoins) | 🔴 P0 | ⏱️ 4h | ⬜ |
| MFG-011 | QualityService | 🔴 P0 | ⏱️ 1h30 | ⬜ |
| MFG-012 | Toutes routes manufacturing | 🔴 P0 | ⏱️ 3h | ⬜ |
| MFG-013 | Frontend: BOMPage | 🔴 P0 | ⏱️ 3h | ⬜ |
| MFG-014 | Frontend: ManufacturingOrdersPage | 🔴 P0 | ⏱️ 3h | ⬜ |
| MFG-015 | Frontend: MRPPage | 🔴 P0 | ⏱️ 3h | ⬜ |
| MFG-016 | Frontend: QualityPage | 🔴 P0 | ⏱️ 2h | ⬜ |
| MFG-017 | Tests & commit | 🔴 P0 | ⏱️ 4h | ⬜ |

---

## MODULE 10: E-COMMERCE (Semaines 38-42)

| ID | Tâche | Priorité | Temps | Status |
|----|-------|----------|-------|--------|
| ECO-001 | Schema ecommerce_settings.ts | 🔴 P0 | ⏱️ 20min | ⬜ |
| ECO-002 | Schema product_categories.ts | 🔴 P0 | ⏱️ 20min | ⬜ |
| ECO-003 | Schema product_variants.ts | 🔴 P0 | ⏱️ 25min | ⬜ |
| ECO-004 | Schema carts.ts + cart_items.ts | 🔴 P0 | ⏱️ 25min | ⬜ |
| ECO-005 | Schema orders.ts + order_items.ts | 🔴 P0 | ⏱️ 30min | ⬜ |
| ECO-006 | Schema coupons.ts | 🔴 P0 | ⏱️ 20min | ⬜ |
| ECO-007 | Schema pos_sessions.ts + pos_transactions.ts | 🔴 P0 | ⏱️ 25min | ⬜ |
| ECO-008 | Migrations | 🔴 P0 | ⏱️ 10min | ⬜ |
| ECO-009 | CatalogService | 🔴 P0 | ⏱️ 2h | ⬜ |
| ECO-010 | CartService | 🔴 P0 | ⏱️ 2h | ⬜ |
| ECO-011 | OrderService | 🔴 P0 | ⏱️ 3h | ⬜ |
| ECO-012 | PaymentService (Stripe) | 🔴 P0 | ⏱️ 4h | ⬜ |
| ECO-013 | POSService | 🔴 P0 | ⏱️ 2h | ⬜ |
| ECO-014 | CouponService | 🔴 P0 | ⏱️ 1h30 | ⬜ |
| ECO-015 | Toutes routes e-commerce | 🔴 P0 | ⏱️ 3h | ⬜ |
| ECO-016 | Frontend: CatalogPage (public) | 🔴 P0 | ⏱️ 3h | ⬜ |
| ECO-017 | Frontend: CartPage | 🔴 P0 | ⏱️ 2h | ⬜ |
| ECO-018 | Frontend: CheckoutPage | 🔴 P0 | ⏱️ 3h | ⬜ |
| ECO-019 | Frontend: OrdersAdminPage | 🔴 P0 | ⏱️ 2h | ⬜ |
| ECO-020 | Frontend: POSPage | 🔴 P0 | ⏱️ 4h | ⬜ |
| ECO-021 | Tests & commit | 🔴 P0 | ⏱️ 4h | ⬜ |

---

## MODULE 11: ANALYTICS (Semaines 43-46)

| ID | Tâche | Priorité | Temps | Status |
|----|-------|----------|-------|--------|
| ANA-001 | Schema dashboards.ts | 🔴 P0 | ⏱️ 20min | ⬜ |
| ANA-002 | Schema dashboard_widgets.ts | 🔴 P0 | ⏱️ 20min | ⬜ |
| ANA-003 | Schema saved_reports.ts | 🔴 P0 | ⏱️ 20min | ⬜ |
| ANA-004 | Schema kpi_definitions.ts + kpi_values.ts | 🔴 P0 | ⏱️ 25min | ⬜ |
| ANA-005 | Schema alerts.ts + alert_history.ts | 🔴 P0 | ⏱️ 20min | ⬜ |
| ANA-006 | Migrations | 🔴 P0 | ⏱️ 10min | ⬜ |
| ANA-007 | DashboardService | 🔴 P0 | ⏱️ 2h | ⬜ |
| ANA-008 | KPIService | 🔴 P0 | ⏱️ 3h | ⬜ |
| ANA-009 | ReportService (advanced) | 🔴 P0 | ⏱️ 3h | ⬜ |
| ANA-010 | AlertService | 🔴 P0 | ⏱️ 2h | ⬜ |
| ANA-011 | Toutes routes analytics | 🔴 P0 | ⏱️ 2h | ⬜ |
| ANA-012 | Frontend: DashboardBuilderPage | 🔴 P0 | ⏱️ 4h | ⬜ |
| ANA-013 | Frontend: Widgets (charts, KPIs) | 🔴 P0 | ⏱️ 4h | ⬜ |
| ANA-014 | Frontend: ReportsPage | 🔴 P0 | ⏱️ 2h | ⬜ |
| ANA-015 | Frontend: AlertsPage | 🔴 P0 | ⏱️ 2h | ⬜ |
| ANA-016 | Tests & commit | 🔴 P0 | ⏱️ 4h | ⬜ |

---

## MODULE 12: ADVANCED AI (Semaines 47-51)

| ID | Tâche | Priorité | Temps | Status |
|----|-------|----------|-------|--------|
| AAI-001 | Schema ml_models.ts | 🔴 P0 | ⏱️ 25min | ⬜ |
| AAI-002 | Schema predictions.ts | 🔴 P0 | ⏱️ 20min | ⬜ |
| AAI-003 | Schema anomalies.ts | 🔴 P0 | ⏱️ 20min | ⬜ |
| AAI-004 | Schema automation_rules.ts + executions | 🔴 P0 | ⏱️ 25min | ⬜ |
| AAI-005 | Schema recommendations.ts | 🔴 P0 | ⏱️ 20min | ⬜ |
| AAI-006 | Schema nlq_queries.ts | 🔴 P0 | ⏱️ 15min | ⬜ |
| AAI-007 | Migrations | 🔴 P0 | ⏱️ 10min | ⬜ |
| AAI-008 | ForecastService (prévisions ventes) | 🔴 P0 | ⏱️ 4h | ⬜ |
| AAI-009 | AnomalyDetectionService | 🔴 P0 | ⏱️ 3h | ⬜ |
| AAI-010 | AutomationEngine | 🔴 P0 | ⏱️ 4h | ⬜ |
| AAI-011 | NLQService (Natural Language Queries) | 🔴 P0 | ⏱️ 4h | ⬜ |
| AAI-012 | RecommendationService | 🔴 P0 | ⏱️ 3h | ⬜ |
| AAI-013 | Toutes routes advanced-ai | 🔴 P0 | ⏱️ 2h | ⬜ |
| AAI-014 | Frontend: PredictionsPage | 🔴 P0 | ⏱️ 2h | ⬜ |
| AAI-015 | Frontend: AnomaliesPage | 🔴 P0 | ⏱️ 2h | ⬜ |
| AAI-016 | Frontend: AutomationsPage | 🔴 P0 | ⏱️ 3h | ⬜ |
| AAI-017 | Frontend: NLQInterface | 🔴 P0 | ⏱️ 2h | ⬜ |
| AAI-018 | Tests E2E complets tous modules | 🔴 P0 | ⏱️ 8h | ⬜ |
| AAI-019 | Documentation finale | 🔴 P0 | ⏱️ 4h | ⬜ |
| AAI-020 | Performance optimization | 🔴 P0 | ⏱️ 4h | ⬜ |
| AAI-021 | Git tag: "v1.0.0-release" | 🔴 P0 | ⏱️ 5min | ⬜ |

---

# RÉCAPITULATIF

## Statistiques Globales

| Phase | Modules | Tâches | Semaines |
|-------|---------|--------|----------|
| Phase 1 (MVP) | 4 | ~175 | 16 |
| Phase 2 (Core) | 4 | ~100 | 16 |
| Phase 3 (Advanced) | 4 | ~85 | 19 |
| **TOTAL** | **12** | **~360** | **51** |

## Prochaine Action

**DÉMARRER MAINTENANT** avec:
1. Tâche AUTH-001: Créer compte Cloudflare
2. Suivre les tâches dans l'ordre
3. Utiliser Claude Code pour implémenter
4. Commit régulièrement

---

**Status**: ✅ Tasks Complete  
**Usage**: Suivre les tâches séquentiellement avec Claude Code
