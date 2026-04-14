# Plan de Taches - Audit Perfex ERP

Base sur `AUDIT_REPORT.md` du 2026-04-14.
18 taches, 4 sprints, organisees par priorite et dependances.

---

## Sprint 1 : URGENCES (P0) - ~2h30

> Corriger les bloquants avant tout nouveau developpement.

### T01 - Renumeroter les migrations 0022 en conflit
- **Priorite** : P0 | **Effort** : 1h | **Type** : bug
- **Fichier** : `packages/database/migrations/`
- **Probleme** : 4 fichiers avec le prefixe `0022`. D1 applique par ordre alphabetique, risque de schemas incoherents.
- **Action** :
  1. Renommer `0022_add_performance_indexes.sql` -> garder en `0022`
  2. Renommer `0022_audit_trail.sql` -> `0023_audit_trail.sql`
  3. Renommer `0022_clinical_ai_patient_portal.sql` -> `0024_clinical_ai_patient_portal.sql`
  4. Renommer `0022_rpm_module.sql` -> `0025_rpm_module.sql`
  5. Decaler `0023_imaging_population_health.sql` -> `0026_imaging_population_health.sql`
  6. Decaler toutes les migrations suivantes (0024->0027, ..., 0031->0034)
  7. Mettre a jour le dossier `meta/` si necessaire
  8. Tester `pnpm db:migrate:local`
- **Bloque** : Toutes les taches DB

---

### T02 - Corriger `requireAnyPermission`
- **Priorite** : P0 | **Effort** : 30min | **Type** : bug
- **Fichier** : `apps/workers/api/src/middleware/permissions.ts:164-210`
- **Probleme** : Verifie `user.permissions` qui est toujours `[]`. Non-admins toujours refuses.
- **Action** :
  1. Remplacer le check `userPermissions.includes(permission)` (ligne 188)
  2. Utiliser `hasPermissionForRole(user.role, permission)` a la place
  3. Supprimer le check inutile `user.permissions || []`
  4. Ajouter un test unitaire pour ce middleware
- **Dependances** : Aucune

---

### T03 - Aligner Node/pnpm dans CI/CD
- **Priorite** : P0 | **Effort** : 15min | **Type** : bug
- **Fichiers** : `.github/workflows/ci.yml`, `.github/workflows/deploy.yml`
- **Probleme** : CI utilise Node 18 / pnpm 8, package.json requiert Node >=22 / pnpm >=10
- **Action** :
  1. Dans `ci.yml` : changer `NODE_VERSION: '18'` -> `'22'`, `PNPM_VERSION: '8'` -> `'10'`
  2. Dans `deploy.yml` : changer `node-version: '20'` -> `'22'`, pnpm `version: 8` -> `10`
  3. Verifier que le lockfile est compatible pnpm 10
- **Dependances** : Aucune

---

### T04 - Rendre optionnels les bindings VECTORIZE et JOBS
- **Priorite** : P0 | **Effort** : 30min | **Type** : bug
- **Fichier** : `apps/workers/api/src/types.ts:20-24`
- **Probleme** : `VECTORIZE` et `JOBS` declares comme required mais absents de `wrangler.toml`
- **Action** :
  1. Changer `VECTORIZE: VectorizeIndex` -> `VECTORIZE?: VectorizeIndex`
  2. Changer `JOBS: Queue` -> `JOBS?: Queue`
  3. Grep tous les usages de `c.env.VECTORIZE` et `c.env.JOBS` pour ajouter des optional checks
- **Dependances** : Aucune

---

## Sprint 2 : SECURITE & STABILITE (P1) - ~4h30

> Corriger les failles de securite et stabiliser la base.

### T05 - Supprimer les mots de passe des reponses seed
- **Priorite** : P1 | **Effort** : 15min | **Type** : bug
- **Fichier** : `apps/workers/api/src/routes/seed.ts:186-199, 653-664`
- **Action** :
  1. Supprimer les champs `password` des objets `accounts` dans les deux reponses
  2. Loguer les credentials uniquement dans la console serveur (`console.log`)
- **Dependances** : Aucune

---

### T06 - Supprimer le fallback de la seed key
- **Priorite** : P1 | **Effort** : 10min | **Type** : bug
- **Fichier** : `apps/workers/api/src/routes/seed.ts:50, 103`
- **Action** :
  1. Remplacer `c.env.SEED_SECRET_KEY || 'perfex-demo-2024'` par `c.env.SEED_SECRET_KEY`
  2. Si `!expectedKey`, retourner 500 "SEED_SECRET_KEY not configured"
- **Dependances** : Aucune

---

### T07 - Supprimer les console.log de debug
- **Priorite** : P1 | **Effort** : 10min | **Type** : bug
- **Fichiers** : `apps/web/src/hooks/useAuth.ts:23-29`, `apps/web/src/components/ProtectedRoute.tsx`
- **Action** :
  1. Supprimer les 4 lignes `console.log('[useAuth]...')` dans useAuth.ts
  2. Chercher d'autres console.log dans ProtectedRoute.tsx
  3. Grep global pour `console.log` dans `apps/web/src/` et nettoyer
- **Dependances** : Aucune

---

### T08 - Rendre CSRF et rate-limit fail-closed en production
- **Priorite** : P1 | **Effort** : 30min | **Type** : bug
- **Fichiers** : `apps/workers/api/src/middleware/csrf.ts:139-142`, `apps/workers/api/src/utils/rate-limit.ts:140-144`
- **Probleme** : Sans KV, ces protections sont silencieusement desactivees.
- **Action** :
  1. Dans les deux fichiers, verifier `c.env.ENVIRONMENT`
  2. Si `production` et pas de KV : retourner 503 au lieu de `next()`
  3. Si `development` : garder le comportement actuel (log warning + next)
- **Dependances** : Aucune

---

### T09 - Creer des classes d'erreur structurees
- **Priorite** : P1 | **Effort** : 2h | **Type** : feature
- **Fichier** : `apps/workers/api/src/utils/errors.ts` (existe deja), `apps/workers/api/src/index.ts:426-458`
- **Probleme** : Error handler global fait du pattern matching sur les messages d'erreur (fragile).
- **Action** :
  1. Verifier/completer les classes dans `errors.ts` : `NotFoundError`, `ValidationError`, `ForbiddenError`, `ConflictError`
  2. Chaque classe a un `statusCode` et `errorCode` integres
  3. Modifier le handler global pour faire `instanceof` au lieu de string matching
  4. Migrer les `throw new Error(...)` principaux vers les classes custom
- **Dependances** : Aucune
- **Bloque** : T18 (tests)

---

### T10 - Corriger le proxy singleton DB
- **Priorite** : P1 | **Effort** : 1h | **Type** : bug
- **Fichier** : `apps/workers/api/src/db.ts:33-40`
- **Probleme** : Le proxy `drizzleDb` exporte pourrait referencer une ancienne instance D1.
- **Action** :
  1. Supprimer l'export `drizzleDb`
  2. Grep tous les fichiers qui importent `drizzleDb`
  3. Les migrer vers `getDb()` ou `initializeDb()` direct
  4. Verifier qu'aucun service ne stocke une reference DB entre requetes
- **Dependances** : Aucune

---

## Sprint 3 : DETTE TECHNIQUE (P2) - ~15h

> Nettoyer le code et preparer la montee en charge.

### T11 - Atteindre 30% de couverture de tests sur les modules critiques
- **Priorite** : P2 | **Effort** : 20h+ (divisible en sous-taches) | **Type** : task
- **Sous-taches** :
  1. Tests auth routes (`routes/auth.ts`) - login, register, refresh, logout
  2. Tests permissions middleware (`requirePermissions`, `requireAnyPermission`)
  3. Tests seed route (env check, key validation)
  4. Tests CSRF middleware
  5. Tests rate-limit middleware
  6. Tests invoice service
  7. Tests organization routes
- **Dependances** : T02, T09

---

### T12 - Fusionner/nettoyer les pipelines CI/CD
- **Priorite** : P2 | **Effort** : 1h | **Type** : task
- **Fichiers** : `.github/workflows/ci.yml`, `.github/workflows/deploy.yml`
- **Action** :
  1. Decider : un seul workflow ou separation CI / CD
  2. Eliminer les doublons (lint, type-check, test faits 2 fois)
  3. Uniformiser les versions Node/pnpm (fait en T03)
  4. Retirer `continue-on-error: true` sur les tests (sinon ils ne bloquent jamais)
- **Dependances** : T03

---

### T13 - Implementer la pagination serveur
- **Priorite** : P2 | **Effort** : 8h | **Type** : feature
- **Probleme** : Multiples pages font `.slice()` cote client sur l'ensemble des donnees.
- **Action** :
  1. Creer un helper API generique `paginatedQuery(db, table, filters, page, limit)`
  2. Ajouter `?page=1&limit=20` sur les routes principales (companies, contacts, invoices, patients)
  3. Modifier le frontend pour utiliser `usePaginatedApi()` existant
  4. Commencer par les pages les plus utilisees (Companies, Contacts, Invoices)
- **Dependances** : Aucune

---

### T14 - Standardiser la gestion d'erreurs frontend
- **Priorite** : P2 | **Effort** : 2h | **Type** : task
- **Probleme** : Mix `alert()`, `ToastContext`, `sonner` pour les erreurs.
- **Action** :
  1. Choisir un systeme unique (recommandation: sonner, deja installe)
  2. Supprimer le ToastContext custom si sonner est choisi
  3. Grep `alert(` dans `apps/web/src/` et remplacer par `toast.error()`
  4. Grep `useToast` et migrer vers sonner
- **Dependances** : Aucune

---

### T15 - Migrer le filtrage de modules vers les roles
- **Priorite** : P2 | **Effort** : 2h | **Type** : task
- **Fichier** : `apps/web/src/hooks/useModules.ts`
- **Probleme** : Emails hardcodes pour determiner les modules actifs.
- **Action** :
  1. Remplacer la logique par email par un filtrage base sur `user.role`
  2. Eventuellement ajouter un champ `enabledModules` dans la reponse `/auth/me`
  3. Supprimer les adresses email demo du code frontend
- **Dependances** : Aucune

---

### T16 - Deduplication des seed routes
- **Priorite** : P2 | **Effort** : 1h | **Type** : task
- **Fichier** : `apps/workers/api/src/routes/seed.ts`
- **Action** :
  1. Extraire la creation org/users/memberships dans une fonction `seedBaseOrganization()`
  2. `POST /seed/bakery` appelle `seedBaseOrganization()` seul
  3. `POST /seed/bakery-full` appelle `seedBaseOrganization()` + `seedBakeryData()`
- **Dependances** : T05, T06

---

### T17 - Nettoyer les fichiers App-*.tsx
- **Priorite** : P2 | **Effort** : 2h | **Type** : task
- **Fichiers** : `apps/web/src/App-auth-only.tsx`, `App-full.tsx`, `App-simple.tsx`, `App-test.tsx`
- **Action** :
  1. Determiner si ces fichiers sont utilises (grep pour imports)
  2. Supprimer ceux qui ne sont pas references
  3. Si utilises pour le dev, les deplacer dans `__tests__/` ou `__dev__/`
- **Dependances** : Aucune

---

### T18 - Eliminer les `as any` dans les services
- **Priorite** : P2 | **Effort** : 3h | **Type** : task
- **Fichier** : `apps/workers/api/src/services/auth.service.ts` (et autres)
- **Action** :
  1. Definir les types de retour Drizzle avec `InferSelectModel<typeof users>`
  2. Remplacer `.get() as any` par des types corrects
  3. Utiliser `satisfies` ou assertions typees
  4. Cibler d'abord `auth.service.ts` puis etendre aux autres services
- **Dependances** : Aucune

---

## Resume du plan

```
Sprint 1 (P0) : 4 taches, ~2h30
  T01 Migrations 0022      [1h]
  T02 requireAnyPermission  [30min]
  T03 CI/CD versions        [15min]
  T04 Bindings optionnels   [30min]

Sprint 2 (P1) : 6 taches, ~4h30
  T05 Passwords seed        [15min]
  T06 Seed key fallback     [10min]
  T07 Console.log           [10min]
  T08 CSRF/rate-limit       [30min]
  T09 Classes d'erreur      [2h]
  T10 DB singleton          [1h]

Sprint 3 (P2) : 8 taches, ~39h
  T11 Tests 30%             [20h+]
  T12 CI/CD cleanup         [1h]
  T13 Pagination serveur    [8h]
  T14 Erreurs frontend      [2h]
  T15 Modules par roles     [2h]
  T16 Seed deduplication    [1h]
  T17 App-*.tsx cleanup     [2h]
  T18 as any elimination    [3h]
```

## Graphe de dependances

```
T01 ──> (bloque toutes les taches DB futures)
T02 ──> T11 (tests permissions)
T03 ──> T12 (CI cleanup)
T05 ──> T16 (seed dedup)
T06 ──> T16 (seed dedup)
T09 ──> T11 (tests services), T18 (types)

Toutes les autres taches sont independantes.
```
