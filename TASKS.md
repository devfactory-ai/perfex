# Plan de Taches - Perfex Bakery

Mis a jour le 2026-04-14 apres nettoyage du perimetre.

## Taches completees ✅

### Sprint 1 (P0) — COMPLET
- [x] T01 - Renumeroter migrations 0022
- [x] T02 - Corriger requireAnyPermission
- [x] T03 - Aligner Node/pnpm CI/CD (22/10)
- [x] T04 - Rendre VECTORIZE/JOBS optionnels

### Sprint 2 (P1) — COMPLET
- [x] T05 - Supprimer passwords des reponses seed
- [x] T06 - Supprimer fallback seed key
- [x] T07 - Supprimer console.log debug
- [x] T08 - CSRF/rate-limit fail-closed en prod
- [x] T09 - Classes d'erreur AppError
- [x] T10 - Supprimer proxy DB singleton

### Sprint 3 (P2) — COMPLET
- [x] T11 - Tests (10 nouveaux fichiers, ~350 tests)
- [x] T12 - CI/CD cleanup
- [x] T13 - Pagination serveur (4 routes)
- [x] T14 - alert() -> sonner (40 fichiers)
- [x] T15 - Modules par roles
- [x] T16 - Seed routes deduplication
- [x] T17 - App-*.tsx supprimes
- [x] T18 - as any elimines

### Integration Finance-Bakery — COMPLET
- [x] Calcul auto cout de revient (recettes x PUMP)
- [x] Bon de livraison -> facture auto
- [x] POS -> ecritures comptables (journal)
- [x] Dashboard financier P&L

### Nettoyage perimetre — COMPLET
- [x] Suppression code healthcare (dialyse, cardio, ophtalmo, etc.)
- [x] Suppression CRM, manufacturing, projects, AI, audit, workflows
- [x] Suppression schemas, packages (ai-core, dialyse-sdk), types, validators
- [x] Nettoyage index.ts, routes, navigation

---

## Taches restantes

### Ameliorations futures (backlog)

| # | Tache | Effort | Priorite |
|---|-------|--------|----------|
| 1 | Adapter perfex-vitrine pour boulangeries | 4h | P2 |
| 2 | Brancher 2FA dans le flow d'auth | 4h | P2 |
| 3 | Pages aide via API (pas hardcode) | 4h | P3 |
| 4 | i18n pages aide (HelpCenter, FAQ) | 2h | P3 |
| 5 | Formulaire HACCP dans tracabilite | 3h | P3 |
| 6 | Tests integration finance-bakery | 4h | P2 |
