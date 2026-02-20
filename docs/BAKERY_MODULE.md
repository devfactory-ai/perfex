# Module Boulangerie - Perfex ERP

## Vue d'ensemble

Le module Boulangerie de Perfex ERP est une solution complète de gestion pour les boulangeries-pâtisseries. Il couvre l'ensemble de la chaîne de valeur : de la gestion des matières premières à la vente, en passant par la production et la maintenance.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        PERFEX BAKERY ERP                            │
├─────────────────────────────────────────────────────────────────────┤
│  Frontend (React 18 + TypeScript)                                   │
│  ├── Dashboard Boulangerie                                          │
│  ├── Gestion Stock                                                  │
│  ├── Production                                                     │
│  ├── Ventes B2B                                                     │
│  ├── Maintenance                                                    │
│  └── Rapports                                                       │
├─────────────────────────────────────────────────────────────────────┤
│  Backend (Hono.js + Cloudflare Workers)                             │
│  ├── API REST                                                       │
│  ├── Authentification JWT                                           │
│  └── Services métier                                                │
├─────────────────────────────────────────────────────────────────────┤
│  Base de données (Cloudflare D1 - SQLite)                           │
│  └── Schéma bakery_*                                                │
└─────────────────────────────────────────────────────────────────────┘
```

## Comptes de Démo

| Rôle | Email | Mot de passe | Accès Modules |
|------|-------|--------------|---------------|
| **Gérant** | demo@perfex.io | Demo@2024! | Tous les modules |
| **Boulanger** | boulanger@perfex.io | Baker@2024! | Dashboard, Stock, Production, Recettes, Traçabilité |
| **Vendeur** | vente@perfex.io | Sales@2024! | Dashboard, Ventes, POS, Stock (lecture) |
| **Livreur** | livraison@perfex.io | Delivery@2024! | Dashboard, Livraisons |

---

## Module 1 : Gestion des Stocks

### 1.1 Catalogue des Articles

**Page** : `/bakery/articles`

**Fonctionnalités** :
- Liste complète des matières premières (farines, levures, additifs, emballages)
- Catégorisation par type : farine, semoule, levure, additifs, emballages, autre
- Gestion des seuils : stock minimum, stock optimal
- Calcul automatique du PUMP (Prix Unitaire Moyen Pondéré)

**Cas d'usage** :

| Cas d'usage | Description | Acteur |
|-------------|-------------|--------|
| Consulter stock | Voir le stock actuel d'une matière première | Boulanger, Gérant |
| Créer article | Ajouter une nouvelle matière première au catalogue | Gérant |
| Modifier article | Mettre à jour prix, seuils, fournisseur | Gérant |
| Filtrer par catégorie | Afficher uniquement les farines, levures, etc. | Tous |
| Rechercher | Trouver un article par nom ou référence | Tous |

**Structure de données** :

```typescript
interface Article {
  id: string;
  reference: string;        // Ex: "FAR-T55"
  name: string;             // Ex: "Farine de blé T55"
  category: 'farine' | 'semoule' | 'levure' | 'additifs' | 'emballages' | 'autre';
  unitOfMeasure: 'kg' | 'L' | 'unite';
  averagePurchasePrice: number;  // PUMP
  currentStock: number;
  minimumStock: number;
  optimalStock: number;
  mainSupplierId: string;
  isActive: boolean;
}
```

### 1.2 Mouvements de Stock

**Page** : `/bakery/stock`

**Fonctionnalités** :
- Enregistrement des entrées (réception marchandises)
- Enregistrement des sorties (consommation production)
- Ajustements d'inventaire
- Traçabilité avec numéros de lots

**Cas d'usage** :

| Cas d'usage | Description | Acteur |
|-------------|-------------|--------|
| Saisir réception | Enregistrer une livraison fournisseur avec quantités et lots | Boulanger |
| Sortie production | Déduire les matières utilisées pour une production | Boulanger |
| Ajustement inventaire | Corriger un écart suite à un comptage | Gérant |
| Consulter historique | Voir tous les mouvements d'un article | Gérant |
| Valider mouvement | Approuver un mouvement saisi | Gérant |

### 1.3 Inventaires

**Page** : `/bakery/stock/inventories`

**Types d'inventaires** :
- **Quotidien** : Comptage rapide des produits critiques
- **Mensuel** : Inventaire complet
- **Annuel** : Inventaire comptable
- **Exceptionnel** : Suite à un incident

**Workflow** :

```
[Planifié] → [En cours] → [Terminé] → [Validé]
     ↓           ↓           ↓
   Créer     Compter      Valider
  session    articles     écarts
```

---

## Module 2 : Production

### 2.1 Dashboard Production

**Page** : `/bakery` ou `/bakery/production`

**Indicateurs affichés** :
- Production du jour (quantité et valeur)
- Taux de conformité
- Chariots en pousse
- Fours en activité
- Alertes qualité

### 2.2 Chambres de Pousse

**Page** : `/bakery/proofing`

**Fonctionnalités** :
- Suivi temps réel des chariots en pousse
- Monitoring température et humidité
- Alertes dépassement temps optimal
- Historique des cycles

**Cas d'usage** :

| Cas d'usage | Description | Acteur |
|-------------|-------------|--------|
| Entrée chariot | Enregistrer un chariot en chambre de pousse | Boulanger |
| Surveillance | Voir l'état des chambres en temps réel | Boulanger |
| Sortie chariot | Marquer un chariot prêt pour le four | Boulanger |
| Analyser cycles | Consulter les temps moyens par produit | Gérant |

### 2.3 Gestion des Fours

**Page** : `/bakery/ovens`

**Fonctionnalités** :
- Planning d'occupation des fours
- Timer de cuisson avec alertes
- Historique des passages
- Suivi température par cuisson

**Types de fours** :
- Rotatif (pour grandes séries)
- À sole (pour pains traditionnels)
- Ventilé (pour pâtisserie)

### 2.4 Contrôle Qualité

**Page** : `/bakery/quality`

**Critères de contrôle** :
- Aspect visuel (couleur, forme)
- Cuisson (pas brûlé, pas sous-cuit)
- Poids conforme
- Goût (échantillonnage)

**Types de défauts** :
- Brûlé
- Sous-cuit
- Déformé
- Cassé

---

## Module 3 : Ventes B2B

### 3.1 Gestion des Clients B2B

**Page** : `/bakery/sales`

**Types de clients** :
- Restaurants
- Hôtels
- Collectivités
- Grossistes
- Autres

**Informations client** :
- Coordonnées et adresse de livraison
- Contact principal
- Conditions de paiement
- Historique commandes

### 3.2 Commandes de Livraison

**Workflow commande** :

```
[Brouillon] → [Confirmée] → [Préparée] → [En livraison] → [Livrée] → [Facturée]
```

**Cas d'usage** :

| Cas d'usage | Description | Acteur |
|-------------|-------------|--------|
| Créer commande | Saisir une nouvelle commande client | Vendeur |
| Préparer commande | Valider la disponibilité et préparer | Boulanger |
| Affecter livreur | Assigner un livreur à une tournée | Gérant |
| Livrer | Enregistrer la livraison avec signature | Livreur |
| Facturer | Générer la facture après livraison | Vendeur |

### 3.3 Bons de Livraison

**Contenu** :
- Numéro BL
- Date et heure de livraison
- Liste des produits (commandés vs livrés)
- Signature électronique client
- Photo de livraison (optionnel)

---

## Module 4 : Maintenance

### 4.1 Inventaire Équipements

**Page** : `/bakery/maintenance`

**Types d'équipements** :
- Fours (rotatif, à sole, ventilé)
- Pétrins (spirale, à bras plongeants)
- Laminoirs
- Façonneuses
- Diviseurs
- Chambres froides

**Informations équipement** :
- Marque, modèle, numéro de série
- Date d'achat et mise en service
- Valeur d'achat
- Garantie (durée et date fin)
- Documentation (manuel PDF)

### 4.2 Interventions

**Types d'interventions** :
- **Préventive** : Maintenance planifiée
- **Corrective** : Réparation suite à panne
- **Révision** : Inspection complète
- **Amélioration** : Upgrade équipement

**Workflow** :

```
[Planifiée] → [En cours] → [Terminée]
                  ↓
            [Pièces utilisées]
                  ↓
            [Coût calculé]
```

### 4.3 Planning Maintenance Préventive

**Périodicité** :
- Hebdomadaire (nettoyage)
- Mensuel (vérifications)
- Trimestriel (révisions)
- Annuel (contrôles approfondis)

**Alertes** :
- J-7 : Rappel intervention à venir
- J-3 : Confirmation planification
- J-1 : Dernière alerte
- J+0 : Dépassement échéance

### 4.4 Pièces Détachées

**Gestion** :
- Stock de pièces critiques
- Alertes stock minimum
- Historique utilisation
- Lien avec interventions

---

## Module 5 : Rapports

### 5.1 Types de Rapports

**Page** : `/bakery/reports`

| Rapport | Fréquence | Contenu |
|---------|-----------|---------|
| Production quotidienne | Quotidien | Quantités produites, écarts, qualité |
| Ventes hebdomadaires | Hebdomadaire | CA par canal, top clients, top produits |
| Bilan mensuel | Mensuel | Synthèse complète, marges, indicateurs |
| Consommations énergétiques | Mensuel | Gaz, électricité, eau |
| Maintenance | Mensuel | Interventions, coûts, MTBF/MTTR |

### 5.2 Indicateurs Clés (KPIs)

**Production** :
- Taux de conformité : `produits_conformes / produits_fabriqués`
- Taux de perte : `(théorique - réel) / théorique`
- Rendement : `produits_finis / matières_consommées`

**Ventes** :
- CA total (livraisons + sur site)
- Panier moyen
- Taux de croissance vs période précédente

**Maintenance** :
- MTBF (Mean Time Between Failures)
- MTTR (Mean Time To Repair)
- Disponibilité équipements
- Coût maintenance / CA

---

## Intégrations

### 5.1 Notifications

**Email** :
- Alertes stock minimum
- Rapports automatiques
- Confirmations commandes

**WhatsApp (futur)** :
- Alertes critiques temps réel
- Notifications livreur
- Rappels maintenance urgente

### 5.2 Export Comptable

**Formats** :
- CSV standard
- Excel
- Format Sage
- Format Ciel

---

## Workflow Complet : Journée Type

### 1. Ouverture (05h00)

```
Boulanger arrive
    ↓
Consultation planning production
    ↓
Vérification stocks matières premières
    ↓
Lancement première production (pains)
```

### 2. Production Matinale (05h00 - 10h00)

```
Pétrissage pâtes
    ↓
Entrée chariots en pousse
    ↓
Suivi temps pousse (monitoring)
    ↓
Passage au four
    ↓
Contrôle qualité
    ↓
Transfert produits vers boutique
```

### 3. Livraisons B2B (06h00 - 09h00)

```
Livreur charge camion
    ↓
Tournée clients
    ↓
Livraison + signature
    ↓
Retour dépôt
    ↓
Saisie écarts éventuels
```

### 4. Vente Boutique (07h00 - 19h00)

```
Session matin ouverte
    ↓
Ventes comptoir
    ↓
Passation mi-journée (comptage)
    ↓
Session après-midi
    ↓
Fermeture + comptage final
```

### 5. Clôture (19h00)

```
Comptage stock fin de journée
    ↓
Génération rapport quotidien
    ↓
Planification production J+1
    ↓
Envoi rapport email direction
```

---

## Sécurité et Permissions

### Matrice des Permissions

| Module | Gérant | Boulanger | Vendeur | Livreur |
|--------|--------|-----------|---------|---------|
| Dashboard | ✅ Complet | ✅ Production | ✅ Ventes | ✅ Limité |
| Stock | ✅ CRUD | ✅ Lecture/Mouv | ✅ Lecture | ❌ |
| Production | ✅ CRUD | ✅ CRUD | ❌ | ❌ |
| Ventes | ✅ CRUD | ❌ | ✅ CRUD | ✅ Livraisons |
| Maintenance | ✅ CRUD | ✅ Lecture | ❌ | ❌ |
| Rapports | ✅ Tous | ✅ Production | ✅ Ventes | ❌ |
| Configuration | ✅ | ❌ | ❌ | ❌ |

---

## URLs de l'Application

### Staging

- **Application Web** : https://perfex-web-staging.pages.dev
- **API** : https://perfex-api-staging.yassine-techini.workers.dev

### Routes du Module Bakery

| Route | Description |
|-------|-------------|
| `/bakery` | Dashboard principal boulangerie |
| `/bakery/articles` | Gestion des articles/matières premières |
| `/bakery/stock` | Mouvements de stock |
| `/bakery/stock/inventories` | Sessions d'inventaire |
| `/bakery/production` | Suivi production |
| `/bakery/proofing` | Chambres de pousse |
| `/bakery/ovens` | Gestion des fours |
| `/bakery/quality` | Contrôle qualité |
| `/bakery/sales` | Ventes B2B |
| `/bakery/maintenance` | Gestion maintenance équipements |
| `/bakery/reports` | Rapports et analytics |

---

## Support et Contact

Pour toute question ou assistance :
- Documentation : Ce fichier
- Support technique : support@devfactory.ai
