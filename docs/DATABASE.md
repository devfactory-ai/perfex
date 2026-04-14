# Schema de Base de Donnees - Perfex Bakery

> Documentation du schema de base de donnees pour Perfex Bakery ERP.

## Vue d'Ensemble

### Statistiques

| Metrique | Valeur |
|----------|--------|
| **Fichiers de schema** | 12 |
| **Tables bakery** | 43 |
| **Tables support** | ~30 (users, finance, inventory, hr, etc.) |
| **Moteur** | SQLite (Cloudflare D1) |
| **ORM** | Drizzle ORM |

### Conventions

- **Cle primaire**: `id` (UUID texte)
- **Multi-tenancy**: `organization_id` sur chaque table principale
- **Timestamps**: `created_at`, `updated_at` sur toutes les tables
- **Soft delete**: `deleted_at` quand applicable
- **References**: `references()` pour les cles etrangeres
- **Prefix bakery**: toutes les tables du module boulangerie commencent par `bakery_`

---

## 1. Authentification & Utilisateurs

**Fichier**: `packages/database/src/schema/users.ts`

### Tables (6)

#### `users`
Utilisateurs de la plateforme.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | TEXT | Cle primaire (UUID) |
| `email` | TEXT | Email unique |
| `password_hash` | TEXT | Mot de passe hashe (bcrypt) |
| `first_name` | TEXT | Prenom |
| `last_name` | TEXT | Nom |
| `is_active` | INTEGER | Statut actif (0/1) |
| `email_verified` | INTEGER | Email verifie (0/1) |
| `last_login_at` | INTEGER | Derniere connexion |
| `created_at` | INTEGER | Date de creation |
| `updated_at` | INTEGER | Date de modification |

#### `organizations`
Organisations (multi-tenancy).

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | TEXT | Cle primaire (UUID) |
| `name` | TEXT | Nom de l'organisation |
| `slug` | TEXT | Identifiant URL unique |
| `logo_url` | TEXT | URL du logo |
| `settings` | TEXT | Parametres JSON |
| `subscription_tier` | TEXT | Niveau d'abonnement |

#### `organization_members`
Relation utilisateurs-organisations.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | TEXT | Cle primaire |
| `organization_id` | TEXT | FK vers organizations |
| `user_id` | TEXT | FK vers users |
| `role` | TEXT | Role (owner, admin, member) |
| `joined_at` | INTEGER | Date d'adhesion |

#### `roles`
Roles RBAC.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | TEXT | Cle primaire |
| `organization_id` | TEXT | FK |
| `name` | TEXT | Nom du role |
| `permissions` | TEXT | Permissions JSON |
| `is_system` | INTEGER | Role systeme (non modifiable) |

#### `user_roles`
Association utilisateurs-roles.

#### `sessions`
Sessions utilisateurs (token hash, expiration, IP, user-agent).

---

## 2. Finance & Comptabilite

**Fichier**: `packages/database/src/schema/finance.ts`

### Tables (11)

| Table | Description |
|-------|-------------|
| `accounts` | Plan comptable (code, nom, type, solde) |
| `journals` | Journaux comptables (ventes, achats, banque, general) |
| `journal_entries` | Ecritures comptables (numero, date, statut) |
| `journal_entry_lines` | Lignes d'ecritures (debit/credit par compte) |
| `invoices` | Factures (numero, dates, statut, montants TTC/HT) |
| `invoice_lines` | Lignes de facture (description, quantite, prix, TVA) |
| `payments` | Paiements (montant, methode, statut) |
| `payment_allocations` | Allocation paiements aux factures |
| `bank_accounts` | Comptes bancaires (IBAN, BIC, solde) |
| `fiscal_years` | Exercices fiscaux (dates, statut open/closed) |
| `tax_rates` | Taux de TVA (nom, taux, defaut) |

---

## 3. Inventaire

**Fichier**: `packages/database/src/schema/inventory.ts`

### Tables

| Table | Description |
|-------|-------------|
| `items` | Articles d'inventaire (nom, SKU, categorie, prix) |
| `warehouses` | Entrepots/emplacements de stockage |
| `stock_levels` | Niveaux de stock par article et entrepot |
| `stock_movements` | Mouvements de stock (entrees, sorties, transferts) |
| `stock_adjustments` | Ajustements d'inventaire |

---

## 4. Ressources Humaines

**Fichier**: `packages/database/src/schema/hr.ts`

### Tables

| Table | Description |
|-------|-------------|
| `departments` | Departements de l'organisation |
| `employees` | Employes (infos personnelles, contrat, salaire) |
| `leave_requests` | Demandes de conges (type, dates, statut) |
| `attendance` | Suivi de presence (pointage entree/sortie) |
| `leave_balances` | Soldes de conges par employe |

---

## 5. Module Boulangerie (43 tables)

**Fichier**: `packages/database/src/schema/bakery.ts`

Le coeur du systeme. Toutes les tables sont prefixees `bakery_`.

### 5.1 Stock & Approvisionnement (7 tables)

| Table | Description |
|-------|-------------|
| `bakery_articles` | Matieres premieres (reference, categorie, PUMP, seuils stock) |
| `bakery_stock_movements` | Mouvements de stock (entrees, sorties, ajustements, lots) |
| `bakery_inventories` | Sessions d'inventaire (type, date, statut) |
| `bakery_inventory_lines` | Lignes d'inventaire (stock theorique vs reel) |
| `bakery_stock_alerts` | Alertes stock minimum/critique |
| `bakery_supplier_orders` | Commandes fournisseurs |
| `bakery_supplier_order_lines` | Lignes de commande fournisseur |

### 5.2 Production (10 tables)

| Table | Description |
|-------|-------------|
| `bakery_products` | Produits finis (nom, categorie, prix, poids) |
| `bakery_product_recipes` | Liaison produit-recette |
| `bakery_recipe_compositions` | Composition des recettes (ingredients, quantites) |
| `bakery_proofing_chambers` | Chambres de pousse (capacite, temperature, humidite) |
| `bakery_proofing_carts` | Chariots en pousse (chambre, entree/sortie) |
| `bakery_cart_lines` | Lignes de chariot (produit, quantite, poids pate) |
| `bakery_ovens` | Fours (type, capacite, temperature max) |
| `bakery_oven_passages` | Passages au four (temperature, duree, chariot) |
| `bakery_quality_controls` | Controles qualite post-cuisson |
| `bakery_production_defects` | Defauts de production (type, quantite, cause) |

### 5.3 Suivi Production (2 tables)

| Table | Description |
|-------|-------------|
| `bakery_production_comparisons` | Comparaison theorique vs reel |
| `bakery_meter_readings` | Releves compteurs (gaz, electricite, eau) |
| `bakery_daily_consumptions` | Consommations energetiques journalieres |

### 5.4 Maintenance (8 tables)

| Table | Description |
|-------|-------------|
| `bakery_equipment` | Equipements (marque, modele, N/S, garantie, valeur) |
| `bakery_interventions` | Interventions (preventive, corrective, revision) |
| `bakery_maintenance_plans` | Plans maintenance preventive (periodicite, checklist) |
| `bakery_maintenance_alerts` | Alertes maintenance a venir |
| `bakery_spare_parts` | Pieces detachees (stock, seuil minimum) |
| `bakery_spare_part_movements` | Mouvements de pieces detachees |
| `bakery_intervention_parts` | Pieces utilisees par intervention |
| `bakery_maintenance_indicators` | Indicateurs MTBF/MTTR/disponibilite |

### 5.5 Ventes B2B (5 tables)

| Table | Description |
|-------|-------------|
| `bakery_b2b_clients` | Clients B2B (nom, type, contact, conditions paiement) |
| `bakery_client_pricing` | Tarifs personnalises par client |
| `bakery_delivery_orders` | Commandes de livraison (statut, date, montant) |
| `bakery_delivery_order_lines` | Lignes de commande (produit, quantite, prix) |
| `bakery_delivery_notes` | Bons de livraison (signature, photo) |

### 5.6 Point de Vente (4 tables)

| Table | Description |
|-------|-------------|
| `bakery_points_of_sale` | Points de vente (boutique, marche, etc.) |
| `bakery_sales_sessions` | Sessions de vente (ouverture, cloture, encaisse) |
| `bakery_pos_stock` | Stock par point de vente |
| `bakery_team_handovers` | Passations d'equipe (comptage, ecarts) |

### 5.7 Rapports & Comptabilite (4 tables)

| Table | Description |
|-------|-------------|
| `bakery_report_configs` | Configuration des rapports automatiques |
| `bakery_generated_reports` | Rapports generes (production, ventes, bilan) |
| `bakery_accounting_exports` | Exports comptables (CSV, Excel, Sage, Ciel) |
| `bakery_daily_sales_summary` | Synthese ventes journalieres |

### 5.8 Audit (1 table)

| Table | Description |
|-------|-------------|
| `bakery_audit_logs` | Journal d'audit des actions utilisateur |

---

## 6. Recettes & Formulations

**Fichier**: `packages/database/src/schema/recipes.ts`

### Tables

| Table | Description |
|-------|-------------|
| `recipe_categories` | Categories de recettes (pains, viennoiseries, patisseries) |
| `recipes` | Recettes (nom, description, rendement, temps) |
| `recipe_ingredients` | Ingredients par recette (article, quantite, unite) |
| `recipe_steps` | Etapes de fabrication (ordre, description, duree) |
| `recipe_versions` | Historique des versions de recettes |
| `recipe_scaling` | Regles de mise a l'echelle |
| `recipe_allergens` | Allergenes par recette |

---

## 7. Tracabilite & HACCP

**Fichier**: `packages/database/src/schema/traceability.ts`

### Tables

| Table | Description |
|-------|-------------|
| `traceability_lots` | Lots de production (numero, date, origine) |
| `traceability_movements` | Mouvements de lots dans la chaine |
| `haccp_control_points` | Points de controle critiques (CCP) |
| `haccp_records` | Enregistrements HACCP (mesures, conformite) |
| `temperature_logs` | Journal des temperatures (chambres, fours, frigos) |
| `recall_events` | Evenements de rappel produit |
| `cleaning_schedules` | Plans de nettoyage et desinfection |

---

## 8. Modules, Notifications, Audit & Integrations

### Modules
**Fichier**: `packages/database/src/schema/modules.ts`

Configuration des modules actives par organisation.

### Notifications
**Fichier**: `packages/database/src/schema/notifications.ts`

Tables pour les notifications utilisateur (type, contenu, lu/non lu).

### Audit
**Fichier**: `packages/database/src/schema/audit.ts`

Trail d'audit global (action, entite, utilisateur, timestamp).

### Integrations
**Fichier**: `packages/database/src/schema/integrations.ts`

Configuration des integrations externes (paiement, SMS, shipping, comptabilite).

---

## Diagramme Relationnel

```
organizations (1) --- (*) organization_members (*) --- (1) users
      |
      +--- accounts, journals, invoices, payments, bank_accounts
      +--- items, warehouses, stock_levels
      +--- departments, employees, leave_requests
      +--- bakery_articles, bakery_products, bakery_equipment
      |       |
      |       +--- bakery_stock_movements
      |       +--- bakery_proofing_chambers --- bakery_proofing_carts --- bakery_cart_lines
      |       +--- bakery_ovens --- bakery_oven_passages --- bakery_quality_controls
      |       +--- bakery_interventions --- bakery_intervention_parts
      |       +--- bakery_b2b_clients --- bakery_delivery_orders --- bakery_delivery_order_lines
      |       +--- bakery_points_of_sale --- bakery_sales_sessions
      |
      +--- recipes --- recipe_ingredients, recipe_steps
      +--- traceability_lots --- haccp_records
      +--- notifications, audit_logs, modules
```
