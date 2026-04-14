# AUDIT_REPORT.md - Perfex ERP AI-Native

**Date** : 2026-04-14
**Auditeur** : Claude (audit automatise)
**Scope** : Code source complet du monorepo

---

## 1. RESUME EXECUTIF

Perfex est un ERP ambitieux couvrant finance, CRM, sante, boulangerie, deploye sur Cloudflare. L'architecture est saine (monorepo, types partages, Drizzle ORM), mais le projet souffre de **dette technique significative** : couverture de tests quasi inexistante (2.5%), conflits de migrations, incoherences CI/CD, et plusieurs failles de securite a corriger.

**Verdict global** : Structure solide, execution a consolider avant production reelle.

---

## 2. PROBLEMES BLOQUANTS (P0 - Corriger immediatement)

### 2.1 Conflits de numeration des migrations

**Fichier** : `packages/database/migrations/`
**Ligne** : N/A
**Impact** : Les migrations 0022 ont 4 fichiers differents avec le meme prefixe :
- `0022_add_performance_indexes.sql`
- `0022_audit_trail.sql`
- `0022_clinical_ai_patient_portal.sql`
- `0022_rpm_module.sql`

D1 applique les migrations par ordre alphabetique du nom. Cela peut entrainer des erreurs d'application ou des schemas incoherents entre environnements.

**Fix** : Renumeroter les migrations pour avoir des numeros uniques sequentiels.

---

### 2.2 `requireAnyPermission` ne fonctionne pas

**Fichier** : `apps/workers/api/src/middleware/permissions.ts:164-210`
**Impact** : Le middleware verifie `user.permissions` qui est **toujours un tableau vide** (ligne 184 de `auth.ts` : `permissions: []`). Seul le check `user.role === 'admin'` fonctionne. Tous les non-admins sont refuses meme avec les bonnes permissions.

**Fix** : Utiliser `hasPermissionForRole(user.role, permission)` au lieu de `userPermissions.includes(permission)`, de maniere coherente avec `requirePermissions`.

---

### 2.3 Incoherence Node/pnpm entre CI et package.json

**Fichier** : `.github/workflows/ci.yml` et `package.json`
**Impact** : Le CI utilise Node 18 + pnpm 8 alors que `package.json` requiert Node >=22 + pnpm >=10. Le build CI risque de passer avec des comportements differents de la prod, ou de casser silencieusement.

**Fix** : Aligner les versions dans les workflows GitHub Actions sur `NODE_VERSION: '22'` et `PNPM_VERSION: '10'`.

---

### 2.4 Bindings Cloudflare non configures

**Fichier** : `apps/workers/api/src/types.ts:20-24` vs `apps/workers/api/wrangler.toml`
**Impact** : `Env` declare `VECTORIZE: VectorizeIndex` et `JOBS: Queue` mais ces bindings ne sont configures dans aucun environnement de `wrangler.toml`. Le Worker crashera a l'acces de ces bindings.

**Fix** : Soit ajouter les bindings dans `wrangler.toml`, soit rendre ces proprietes optionnelles (`VECTORIZE?: VectorizeIndex`).

---

## 3. PROBLEMES IMPORTANTS (P1 - Corriger rapidement)

### 3.1 Seed route expose les mots de passe

**Fichier** : `apps/workers/api/src/routes/seed.ts:186-199` et `653-664`
**Impact** : Les endpoints POST /seed/bakery retournent les mots de passe en clair dans la reponse JSON. Meme proteges par un `SEED_SECRET_KEY`, si quelqu'un intercepte la reponse, les credentials sont compromis.

**Fix** : Supprimer les champs `password` de la reponse, ou ne les afficher que dans les logs serveur.

---

### 3.2 Cle de seed par defaut hardcodee

**Fichier** : `apps/workers/api/src/routes/seed.ts:50` et `103`
**Impact** : `const expectedKey = c.env.SEED_SECRET_KEY || 'perfex-demo-2024'` -- si la variable d'environnement n'est pas configuree, n'importe qui peut seeder la base avec la cle par defaut.

**Fix** : Supprimer le fallback. Exiger que `SEED_SECRET_KEY` soit explicitement configure.

---

### 3.3 Console.log de debug en production

**Fichier** : `apps/web/src/hooks/useAuth.ts:23-29`, `apps/web/src/components/ProtectedRoute.tsx`
**Impact** : Multiples appels `console.log('[useAuth]...')` qui loguent l'etat d'authentification dans la console du navigateur. Fuite d'information en production.

**Fix** : Supprimer ces console.log ou les conditionner par `import.meta.env.DEV`.

---

### 3.4 CSRF et Rate-limit passent silencieusement sans KV

**Fichier** : `apps/workers/api/src/middleware/csrf.ts:139-142` et `apps/workers/api/src/utils/rate-limit.ts:140-144`
**Impact** : Si le KV namespace `CACHE` n'est pas disponible, le CSRF et le rate-limiting sont **silencieusement desactives**. En production, une mauvaise config pourrait supprimer ces protections sans alerte.

**Fix** : En production, considerer un `return c.json({ error: 'Service unavailable' }, 503)` au lieu de `return next()`.

---

### 3.5 Gestion d'erreurs par pattern matching de strings

**Fichier** : `apps/workers/api/src/index.ts:426-458`
**Impact** : Le handler global d'erreurs determine le status HTTP en cherchant des sous-chaines dans `err.message.toLowerCase()`. C'est fragile : un message "User not found" retourne 404, mais "Not foundational error" aussi. Pas de type d'erreur structure.

**Fix** : Creer des classes d'erreur custom (`NotFoundError`, `ValidationError`, etc.) avec un `statusCode` integre.

---

### 3.6 DB singleton problematique sur Workers

**Fichier** : `apps/workers/api/src/db.ts:7-16`
**Impact** : `dbInstance` est un singleton module-level. Sur Cloudflare Workers, les isolates peuvent etre reutilises entre requetes mais la DB binding change par requete. Le `initializeDb` est appele a chaque requete (correct), mais le proxy `drizzleDb` exporte en ligne 33 pourrait referencer une ancienne instance.

**Fix** : Ne pas exporter `drizzleDb` comme proxy singleton. Utiliser `getDb()` partout.

---

## 4. DETTE TECHNIQUE (P2 - Planifier)

### 4.1 Couverture de tests : 2.5%

**Impact** : 14 fichiers de tests pour 567 fichiers sources. Les modules critiques (auth routes, seed, payments, invoices, workflows) n'ont aucun test. Regression tres probable a chaque changement.

**Recommandation** : Prioriser les tests sur auth, seed, permissions, finance.

---

### 4.2 Code duplique dans seed routes

**Fichier** : `apps/workers/api/src/routes/seed.ts`
**Impact** : `POST /seed/bakery` et `POST /seed/bakery-full` dupliquent la creation d'org/users/memberships (~150 lignes identiques).

---

### 4.3 Deux pipelines CI/CD en doublon

**Fichier** : `.github/workflows/ci.yml` et `.github/workflows/deploy.yml`
**Impact** : Deux workflows separees avec des configs differentes (Node 18 vs 20, pnpm 8 vs 8). Confus et potentiellement contradictoire.

**Fix** : Fusionner en un seul workflow ou separer clairement (CI vs CD).

---

### 4.4 Fichiers App-*.tsx multiples

**Fichier** : `apps/web/src/App-auth-only.tsx`, `App-full.tsx`, `App-simple.tsx`, `App-test.tsx`
**Impact** : 4 variantes de l'App root en plus de `App.tsx`. Maintenance difficile, risque de divergence.

---

### 4.5 `as any` abondant dans auth service

**Fichier** : `apps/workers/api/src/services/auth.service.ts` (lignes 102, 133, 209, 287, 345, 381, etc.)
**Impact** : Nombreux casts `as any` sur les resultats de requetes Drizzle. Contourne le typage strict de TypeScript.

**Fix** : Definir les types de retour Drizzle correctement ou utiliser les inferred types.

---

### 4.6 Filtrage des modules par email hardcode

**Fichier** : `apps/web/src/hooks/useModules.ts`
**Impact** : Le filtrage des modules actifs utilise des adresses email hardcodees (demo@perfex.io, boulanger@perfex.io, etc.) au lieu du systeme de roles/permissions.

**Fix** : Migrer vers un filtrage base sur les roles JWT ou les permissions de l'organisation.

---

### 4.7 Pagination client-side sur grands datasets

**Fichier** : Multiples pages (ex: `apps/web/src/pages/crm/CompaniesPage.tsx:86-96`)
**Impact** : Les pages chargent toutes les donnees puis paginent cote client avec `.slice()`. Non viable avec des volumes reels.

**Fix** : Implementer la pagination cote serveur avec `limit`/`offset` sur les endpoints API.

---

### 4.8 Gestion d'erreurs inconsistante dans le frontend

**Fichier** : Multiples pages
**Impact** : Certaines pages utilisent `alert()` natif, d'autres le ToastContext, d'autres `sonner`. Pas de standard.

**Fix** : Standardiser sur un seul systeme de notifications (sonner ou ToastContext, pas les deux).

---

## 5. POINTS FORTS

### 5.1 Architecture bien structuree
- Monorepo propre avec separation claire (apps, packages)
- Types partages via `@perfex/shared` evitant la duplication
- Validateurs Zod partages front/back

### 5.2 Securite correctement pensee
- JWT avec token revocation via KV
- Bcrypt cost 12 pour le hashing
- CSRF avec Synchronizer Token Pattern et comparaison constant-time
- Rate-limiting multi-niveau (auth, API, sensitive)
- Hashing des tokens avant stockage KV (reset password, passwordless)
- CORS strict avec validation par pattern

### 5.3 Infrastructure Cloudflare coherente
- 3 environnements (dev, staging, prod) avec D1, KV, AI
- Cron triggers pour taches planifiees
- Health check enrichi avec tests de connectivite

### 5.4 Schema de base de donnees riche
- 31 schemas Drizzle couvrant tous les modules
- 35 migrations bien sequencees (sauf conflit 0022)
- Indexes de performance dedies (migration 0021-0022)

### 5.5 Multi-application
- Support de variantes de build (bakery, health) via env variable
- Architecture multi-tenant par organisation

---

## 6. MATRICE DE RISQUES

| # | Probleme | Severite | Effort | Priorite |
|---|----------|----------|--------|----------|
| 2.1 | Conflits migration 0022 | CRITIQUE | 1h | P0 |
| 2.2 | requireAnyPermission casse | CRITIQUE | 30min | P0 |
| 2.3 | Node/pnpm CI mismatch | HAUTE | 15min | P0 |
| 2.4 | Bindings non configures | HAUTE | 30min | P0 |
| 3.1 | Passwords dans seed response | HAUTE | 15min | P1 |
| 3.2 | Seed key hardcodee | HAUTE | 10min | P1 |
| 3.3 | Console.log debug prod | MOYENNE | 10min | P1 |
| 3.4 | CSRF/rate-limit silencieux | HAUTE | 30min | P1 |
| 3.5 | Error handling fragile | MOYENNE | 2h | P1 |
| 3.6 | DB singleton Workers | MOYENNE | 1h | P1 |
| 4.1 | Tests 2.5% | HAUTE | 20h+ | P2 |
| 4.2 | Duplication seed | BASSE | 1h | P2 |
| 4.3 | CI/CD doublon | MOYENNE | 1h | P2 |
| 4.4 | App-*.tsx multiples | BASSE | 2h | P2 |
| 4.5 | `as any` casts | BASSE | 3h | P2 |
| 4.6 | Modules filtres par email | MOYENNE | 2h | P2 |
| 4.7 | Pagination client-side | HAUTE | 8h | P2 |
| 4.8 | Error handling frontend inconsistant | MOYENNE | 2h | P2 |

---

## 7. RECOMMANDATIONS PRIORITAIRES

1. **Immediate** : Corriger la numerotation des migrations 0022, fixer `requireAnyPermission`, aligner CI Node/pnpm
2. **Court terme** : Supprimer les passwords des reponses seed, retirer les console.log, rendre CSRF/rate-limit fail-closed en prod
3. **Moyen terme** : Atteindre 30%+ de couverture de tests sur les modules critiques, creer des classes d'erreur structurees
4. **Long terme** : Fusionner les pipelines CI/CD, nettoyer les variantes App-*.tsx, eliminer les `as any`
