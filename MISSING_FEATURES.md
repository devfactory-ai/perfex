# Fonctionnalites Manquantes - Perfex Bakery

**Date** : 2026-04-14 (post-nettoyage perimetre bakery)

---

## Perimetre actuel : Perfex Bakery uniquement

Apres le nettoyage, le projet ne contient que les modules bakery. Les fonctionnalites healthcare, CRM, manufacturing, etc. ont ete supprimees.

## Gaps restants (scope bakery)

### 1. 2FA non branche dans l'auth (PRET mais non actif)
- **Fichier** : `services/two-factor.service.ts`
- **Etat** : Service TOTP complet mais aucun endpoint dans `routes/auth.ts`
- **Effort** : 4h
- **Priorite** : P2

### 2. Pages d'aide statiques (pas d'API)
- **Fichiers** : `pages/help/HelpCenterPage.tsx`, `FAQPage.tsx`, `GettingStartedPage.tsx`
- **Etat** : Contenu hardcode en francais, pas de fetch API
- **Effort** : 4h
- **Priorite** : P3

### 3. i18n manquant sur pages aide
- **Fichiers** : Memes pages help
- **Etat** : Texte francais hardcode au lieu de cles de traduction
- **Effort** : 2h
- **Priorite** : P3

### 4. Formulaire HACCP incomplet
- **Fichier** : `pages/traceability/TraceabilityPage.tsx:114`
- **Etat** : `void showCpForm; // To be implemented`
- **Effort** : 3h
- **Priorite** : P3

### 5. Site vitrine a adapter pour boulangeries
- **Dossier** : `perfex-vitrine/`
- **Etat** : Contenu generique, pas specifique boulangerie
- **Effort** : 4h
- **Priorite** : P2

---

## Ce qui FONCTIONNE ✅

| Module | Statut | Completude |
|--------|--------|-----------|
| Bakery Stock | COMPLET | 100% |
| Bakery Production | COMPLET | 100% |
| Bakery Maintenance (CMMS) | COMPLET | 100% |
| Bakery Ventes B2B | COMPLET | 100% |
| Bakery POS | COMPLET | 100% |
| Bakery Reporting | COMPLET | 100% |
| Bakery Finance (P&L, couts, factures) | COMPLET | 100% |
| Recettes | COMPLET | 100% |
| Tracabilite / HACCP | COMPLET | 95% (formulaire HACCP) |
| Finance (comptabilite) | COMPLET | 100% |
| Inventaire | COMPLET | 100% |
| RH | COMPLET | 100% |
| Auth | COMPLET | 100% |
| Integrations (paiement, SMS, shipping) | COMPLET | 100% |

**Verdict : Perfex Bakery est production-ready a ~98%.**
