# Schema de Base de Donnees Perfex ERP

> Documentation complete du schema de base de donnees avec 88 tables reparties en 21 modules.

## Table des Matieres

1. [Vue d'Ensemble](#vue-densemble)
2. [Authentification & Utilisateurs](#1-authentification--utilisateurs)
3. [Finance & Comptabilite](#2-finance--comptabilite)
4. [CRM](#3-crm)
5. [Projets](#4-projets)
6. [Inventaire](#5-inventaire)
7. [Ressources Humaines](#6-ressources-humaines)
8. [Achats (Procurement)](#7-achats-procurement)
9. [Ventes](#8-ventes)
10. [Production (Manufacturing)](#9-production-manufacturing)
11. [Actifs](#10-actifs)
12. [Notifications & Audit](#11-notifications--audit)
13. [Documents](#12-documents)
14. [Workflows](#13-workflows)
15. [Intelligence Artificielle](#14-intelligence-artificielle)
16. [Smart Audit System](#15-smart-audit-system)
17. [Modules](#16-modules)
18. [Recettes](#17-recettes)
19. [Tracabilite & HACCP](#18-tracabilite--haccp)
20. [Paie](#19-paie)
21. [Integrations](#20-integrations)

---

## Vue d'Ensemble

### Statistiques

| Metrique | Valeur |
|----------|--------|
| **Nombre total de tables** | 88 |
| **Fichiers de schema** | 21 |
| **Migrations SQL** | 17 |
| **Moteur de base de donnees** | SQLite (Cloudflare D1) |
| **ORM** | Drizzle ORM |

### Conventions

- **Cle primaire**: `id` (UUID ou texte)
- **Multi-tenancy**: `organization_id` sur chaque table principale
- **Timestamps**: `created_at`, `updated_at` sur toutes les tables
- **Soft delete**: `deleted_at` quand applicable
- **References**: Utilisation de `references()` pour les cles etrangeres

### Diagramme Relationnel Simplifie

```
┌─────────────────┐     ┌─────────────────┐
│   organizations │────<│      users      │
└────────┬────────┘     └─────────────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐
│Finance│ │  CRM  │ │  HR   │ │  ...  │
└───────┘ └───────┘ └───────┘ └───────┘
```

---

## 1. Authentification & Utilisateurs

**Fichier**: `packages/database/src/schema/users.ts`

### Tables

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
| `last_login_at` | INTEGER | Derniere connexion (timestamp) |
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
| `created_at` | INTEGER | Date de creation |

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
| `organization_id` | TEXT | FK vers organizations |
| `name` | TEXT | Nom du role |
| `permissions` | TEXT | Permissions JSON |
| `is_system` | INTEGER | Role systeme (non modifiable) |

#### `user_roles`
Association utilisateurs-roles.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | TEXT | Cle primaire |
| `user_id` | TEXT | FK vers users |
| `role_id` | TEXT | FK vers roles |
| `organization_id` | TEXT | FK vers organizations |

#### `sessions`
Sessions utilisateurs.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | TEXT | Cle primaire |
| `user_id` | TEXT | FK vers users |
| `token_hash` | TEXT | Hash du refresh token |
| `expires_at` | INTEGER | Expiration |
| `ip_address` | TEXT | Adresse IP |
| `user_agent` | TEXT | User-Agent |

---

## 2. Finance & Comptabilite

**Fichier**: `packages/database/src/schema/finance.ts`

### Tables (11)

#### `accounts`
Plan comptable.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | TEXT | Cle primaire |
| `organization_id` | TEXT | FK |
| `code` | TEXT | Code comptable (ex: 101000) |
| `name` | TEXT | Libelle du compte |
| `type` | TEXT | asset, liability, equity, revenue, expense |
| `parent_id` | TEXT | Compte parent (hierarchie) |
| `is_active` | INTEGER | Compte actif |
| `balance` | REAL | Solde actuel |

#### `journals`
Journaux comptables.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | TEXT | Cle primaire |
| `organization_id` | TEXT | FK |
| `code` | TEXT | Code journal (VT, AC, BQ...) |
| `name` | TEXT | Nom du journal |
| `type` | TEXT | sales, purchases, bank, general |

#### `journal_entries`
Ecritures comptables.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | TEXT | Cle primaire |
| `organization_id` | TEXT | FK |
| `journal_id` | TEXT | FK vers journals |
| `entry_number` | TEXT | Numero d'ecriture |
| `entry_date` | TEXT | Date de l'ecriture |
| `description` | TEXT | Libelle |
| `status` | TEXT | draft, posted, cancelled |
| `total_debit` | REAL | Total debit |
| `total_credit` | REAL | Total credit |

#### `journal_entry_lines`
Lignes d'ecritures.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | TEXT | Cle primaire |
| `journal_entry_id` | TEXT | FK vers journal_entries |
| `account_id` | TEXT | FK vers accounts |
| `debit` | REAL | Montant debit |
| `credit` | REAL | Montant credit |
| `description` | TEXT | Libelle ligne |

#### `invoices`
Factures clients.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | TEXT | Cle primaire |
| `organization_id` | TEXT | FK |
| `invoice_number` | TEXT | Numero de facture |
| `company_id` | TEXT | FK vers companies (client) |
| `contact_id` | TEXT | FK vers contacts |
| `issue_date` | TEXT | Date d'emission |
| `due_date` | TEXT | Date d'echeance |
| `status` | TEXT | draft, sent, paid, overdue, cancelled |
| `subtotal` | REAL | Sous-total HT |
| `tax_amount` | REAL | Montant TVA |
| `total` | REAL | Total TTC |
| `amount_paid` | REAL | Montant paye |
| `currency` | TEXT | Devise (EUR, USD, TND) |

#### `invoice_lines`
Lignes de facture.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | TEXT | Cle primaire |
| `invoice_id` | TEXT | FK vers invoices |
| `description` | TEXT | Description |
| `quantity` | REAL | Quantite |
| `unit_price` | REAL | Prix unitaire |
| `tax_rate` | REAL | Taux de TVA |
| `amount` | REAL | Montant ligne |

#### `payments`
Paiements.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | TEXT | Cle primaire |
| `organization_id` | TEXT | FK |
| `payment_number` | TEXT | Numero de paiement |
| `payment_date` | TEXT | Date |
| `amount` | REAL | Montant |
| `payment_method` | TEXT | cash, check, transfer, card |
| `bank_account_id` | TEXT | FK vers bank_accounts |
| `status` | TEXT | pending, completed, cancelled |

#### `payment_allocations`
Allocation des paiements aux factures.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | TEXT | Cle primaire |
| `payment_id` | TEXT | FK vers payments |
| `invoice_id` | TEXT | FK vers invoices |
| `amount` | REAL | Montant alloue |

#### `bank_accounts`
Comptes bancaires.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | TEXT | Cle primaire |
| `organization_id` | TEXT | FK |
| `name` | TEXT | Nom du compte |
| `bank_name` | TEXT | Nom de la banque |
| `account_number` | TEXT | Numero de compte |
| `iban` | TEXT | IBAN |
| `bic` | TEXT | BIC/SWIFT |
| `currency` | TEXT | Devise |
| `balance` | REAL | Solde |
| `account_id` | TEXT | FK vers accounts (comptabilite) |

#### `fiscal_years`
Exercices fiscaux.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | TEXT | Cle primaire |
| `organization_id` | TEXT | FK |
| `name` | TEXT | Nom (ex: 2024) |
| `start_date` | TEXT | Date debut |
| `end_date` | TEXT | Date fin |
| `status` | TEXT | open, closed |

#### `tax_rates`
Taux de TVA.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | TEXT | Cle primaire |
| `organization_id` | TEXT | FK |
| `name` | TEXT | Nom (TVA 20%, TVA 7%...) |
| `rate` | REAL | Taux (0.20, 0.07...) |
| `is_default` | INTEGER | Taux par defaut |

---

## 3. CRM

**Fichier**: `packages/database/src/schema/crm.ts`

### Tables (7)

#### `companies`
Entreprises (clients/prospects).

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | TEXT | Cle primaire |
| `organization_id` | TEXT | FK |
| `name` | TEXT | Raison sociale |
| `type` | TEXT | prospect, client, partner |
| `industry` | TEXT | Secteur d'activite |
| `website` | TEXT | Site web |
| `phone` | TEXT | Telephone |
| `email` | TEXT | Email |
| `address` | TEXT | Adresse |
| `city` | TEXT | Ville |
| `country` | TEXT | Pays |
| `tax_id` | TEXT | Numero TVA |
| `notes` | TEXT | Notes |

#### `contacts`
Contacts.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | TEXT | Cle primaire |
| `organization_id` | TEXT | FK |
| `company_id` | TEXT | FK vers companies |
| `first_name` | TEXT | Prenom |
| `last_name` | TEXT | Nom |
| `email` | TEXT | Email |
| `phone` | TEXT | Telephone |
| `position` | TEXT | Poste |
| `is_primary` | INTEGER | Contact principal |

#### `pipeline_stages`
Etapes du pipeline commercial.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | TEXT | Cle primaire |
| `organization_id` | TEXT | FK |
| `name` | TEXT | Nom de l'etape |
| `order` | INTEGER | Ordre d'affichage |
| `probability` | INTEGER | Probabilite de gain (%) |
| `color` | TEXT | Couleur |

#### `opportunities`
Opportunites commerciales.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | TEXT | Cle primaire |
| `organization_id` | TEXT | FK |
| `name` | TEXT | Nom de l'opportunite |
| `company_id` | TEXT | FK vers companies |
| `contact_id` | TEXT | FK vers contacts |
| `stage_id` | TEXT | FK vers pipeline_stages |
| `amount` | REAL | Montant estime |
| `probability` | INTEGER | Probabilite (%) |
| `expected_close_date` | TEXT | Date de cloture prevue |
| `status` | TEXT | open, won, lost |
| `assigned_to` | TEXT | FK vers users |

#### `activities`
Activites CRM (appels, reunions, emails).

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | TEXT | Cle primaire |
| `organization_id` | TEXT | FK |
| `type` | TEXT | call, meeting, email, task |
| `subject` | TEXT | Sujet |
| `description` | TEXT | Description |
| `company_id` | TEXT | FK vers companies |
| `contact_id` | TEXT | FK vers contacts |
| `opportunity_id` | TEXT | FK vers opportunities |
| `due_date` | TEXT | Date |
| `completed_at` | INTEGER | Date completion |
| `assigned_to` | TEXT | FK vers users |

#### `products`
Catalogue produits.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | TEXT | Cle primaire |
| `organization_id` | TEXT | FK |
| `name` | TEXT | Nom |
| `sku` | TEXT | Reference |
| `description` | TEXT | Description |
| `unit_price` | REAL | Prix unitaire |
| `cost` | REAL | Cout |
| `is_active` | INTEGER | Actif |

#### `opportunity_products`
Produits lies aux opportunites.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | TEXT | Cle primaire |
| `opportunity_id` | TEXT | FK vers opportunities |
| `product_id` | TEXT | FK vers products |
| `quantity` | REAL | Quantite |
| `unit_price` | REAL | Prix unitaire |
| `discount` | REAL | Remise |

---

## 4. Projets

**Fichier**: `packages/database/src/schema/projects.ts`

### Tables (5)

#### `projects`
Projets.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | TEXT | Cle primaire |
| `organization_id` | TEXT | FK |
| `name` | TEXT | Nom du projet |
| `description` | TEXT | Description |
| `company_id` | TEXT | FK vers companies (client) |
| `status` | TEXT | planning, active, on_hold, completed, cancelled |
| `start_date` | TEXT | Date debut |
| `end_date` | TEXT | Date fin prevue |
| `budget` | REAL | Budget |
| `manager_id` | TEXT | FK vers users (chef de projet) |

#### `project_tasks`
Taches de projet.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | TEXT | Cle primaire |
| `project_id` | TEXT | FK vers projects |
| `name` | TEXT | Nom de la tache |
| `description` | TEXT | Description |
| `status` | TEXT | todo, in_progress, review, done |
| `priority` | TEXT | low, medium, high, urgent |
| `assigned_to` | TEXT | FK vers users |
| `due_date` | TEXT | Date echeance |
| `estimated_hours` | REAL | Heures estimees |
| `actual_hours` | REAL | Heures reelles |
| `parent_id` | TEXT | Tache parente (sous-taches) |

#### `project_milestones`
Jalons de projet.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | TEXT | Cle primaire |
| `project_id` | TEXT | FK vers projects |
| `name` | TEXT | Nom du jalon |
| `due_date` | TEXT | Date echeance |
| `completed_at` | INTEGER | Date completion |

#### `time_entries`
Saisie de temps.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | TEXT | Cle primaire |
| `project_id` | TEXT | FK vers projects |
| `task_id` | TEXT | FK vers project_tasks |
| `user_id` | TEXT | FK vers users |
| `date` | TEXT | Date |
| `hours` | REAL | Heures |
| `description` | TEXT | Description |
| `billable` | INTEGER | Facturable (0/1) |

#### `project_members`
Membres du projet.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | TEXT | Cle primaire |
| `project_id` | TEXT | FK vers projects |
| `user_id` | TEXT | FK vers users |
| `role` | TEXT | Role dans le projet |
| `hourly_rate` | REAL | Taux horaire |

---

## 5. Inventaire

**Fichier**: `packages/database/src/schema/inventory.ts`

### Tables (6)

#### `inventory_items`
Articles en stock.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | TEXT | Cle primaire |
| `organization_id` | TEXT | FK |
| `sku` | TEXT | Reference |
| `name` | TEXT | Nom |
| `description` | TEXT | Description |
| `category` | TEXT | Categorie |
| `unit` | TEXT | Unite (pcs, kg, m...) |
| `cost` | REAL | Cout unitaire |
| `price` | REAL | Prix de vente |
| `min_stock` | REAL | Stock minimum |
| `max_stock` | REAL | Stock maximum |
| `reorder_point` | REAL | Point de reapprovisionnement |

#### `warehouses`
Entrepots.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | TEXT | Cle primaire |
| `organization_id` | TEXT | FK |
| `name` | TEXT | Nom |
| `code` | TEXT | Code |
| `address` | TEXT | Adresse |
| `is_default` | INTEGER | Entrepot par defaut |

#### `stock_levels`
Niveaux de stock par entrepot.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | TEXT | Cle primaire |
| `item_id` | TEXT | FK vers inventory_items |
| `warehouse_id` | TEXT | FK vers warehouses |
| `quantity` | REAL | Quantite en stock |
| `reserved_quantity` | REAL | Quantite reservee |

#### `stock_movements`
Mouvements de stock.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | TEXT | Cle primaire |
| `organization_id` | TEXT | FK |
| `item_id` | TEXT | FK vers inventory_items |
| `warehouse_id` | TEXT | FK vers warehouses |
| `type` | TEXT | in, out, transfer, adjustment |
| `quantity` | REAL | Quantite |
| `reference_type` | TEXT | Type de reference (PO, SO...) |
| `reference_id` | TEXT | ID de reference |
| `notes` | TEXT | Notes |

#### `stock_adjustments`
Ajustements de stock.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | TEXT | Cle primaire |
| `organization_id` | TEXT | FK |
| `warehouse_id` | TEXT | FK vers warehouses |
| `adjustment_number` | TEXT | Numero |
| `reason` | TEXT | Raison (inventaire, casse...) |
| `status` | TEXT | draft, approved, cancelled |
| `adjusted_by` | TEXT | FK vers users |

#### `stock_adjustment_lines`
Lignes d'ajustement.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | TEXT | Cle primaire |
| `adjustment_id` | TEXT | FK vers stock_adjustments |
| `item_id` | TEXT | FK vers inventory_items |
| `expected_quantity` | REAL | Quantite attendue |
| `actual_quantity` | REAL | Quantite reelle |
| `difference` | REAL | Ecart |

---

## 6. Ressources Humaines

**Fichier**: `packages/database/src/schema/hr.ts`

### Tables (5)

#### `departments`
Departements.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | TEXT | Cle primaire |
| `organization_id` | TEXT | FK |
| `name` | TEXT | Nom |
| `code` | TEXT | Code |
| `manager_id` | TEXT | FK vers employees |
| `parent_id` | TEXT | Departement parent |

#### `employees`
Employes.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | TEXT | Cle primaire |
| `organization_id` | TEXT | FK |
| `user_id` | TEXT | FK vers users (optionnel) |
| `employee_number` | TEXT | Matricule |
| `first_name` | TEXT | Prenom |
| `last_name` | TEXT | Nom |
| `email` | TEXT | Email |
| `phone` | TEXT | Telephone |
| `department_id` | TEXT | FK vers departments |
| `position` | TEXT | Poste |
| `hire_date` | TEXT | Date d'embauche |
| `contract_type` | TEXT | CDI, CDD, Stage... |
| `salary` | REAL | Salaire |
| `manager_id` | TEXT | FK vers employees (N+1) |
| `status` | TEXT | active, on_leave, terminated |

#### `leave_requests`
Demandes de conges.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | TEXT | Cle primaire |
| `organization_id` | TEXT | FK |
| `employee_id` | TEXT | FK vers employees |
| `leave_type` | TEXT | annual, sick, unpaid, maternity... |
| `start_date` | TEXT | Date debut |
| `end_date` | TEXT | Date fin |
| `days` | REAL | Nombre de jours |
| `reason` | TEXT | Motif |
| `status` | TEXT | pending, approved, rejected |
| `approved_by` | TEXT | FK vers users |

#### `attendance_records`
Pointages.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | TEXT | Cle primaire |
| `employee_id` | TEXT | FK vers employees |
| `date` | TEXT | Date |
| `check_in` | TEXT | Heure d'arrivee |
| `check_out` | TEXT | Heure de depart |
| `break_duration` | INTEGER | Duree pause (minutes) |
| `total_hours` | REAL | Heures travaillees |
| `status` | TEXT | present, absent, late, half_day |

#### `leave_balances`
Soldes de conges.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | TEXT | Cle primaire |
| `employee_id` | TEXT | FK vers employees |
| `leave_type` | TEXT | Type de conge |
| `year` | INTEGER | Annee |
| `entitled` | REAL | Droit acquis |
| `used` | REAL | Conges pris |
| `balance` | REAL | Solde |

---

## 7. Achats (Procurement)

**Fichier**: `packages/database/src/schema/procurement.ts`

### Tables (7)

#### `suppliers`
Fournisseurs.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | TEXT | Cle primaire |
| `organization_id` | TEXT | FK |
| `name` | TEXT | Raison sociale |
| `code` | TEXT | Code fournisseur |
| `email` | TEXT | Email |
| `phone` | TEXT | Telephone |
| `address` | TEXT | Adresse |
| `tax_id` | TEXT | Numero TVA |
| `payment_terms` | INTEGER | Delai de paiement (jours) |
| `is_active` | INTEGER | Actif |

#### `purchase_requisitions`
Demandes d'achat.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | TEXT | Cle primaire |
| `organization_id` | TEXT | FK |
| `requisition_number` | TEXT | Numero |
| `requested_by` | TEXT | FK vers users |
| `department_id` | TEXT | FK vers departments |
| `required_date` | TEXT | Date besoin |
| `status` | TEXT | draft, pending, approved, rejected |
| `notes` | TEXT | Notes |

#### `purchase_requisition_lines`
Lignes de demande d'achat.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | TEXT | Cle primaire |
| `requisition_id` | TEXT | FK vers purchase_requisitions |
| `item_id` | TEXT | FK vers inventory_items |
| `quantity` | REAL | Quantite demandee |
| `estimated_price` | REAL | Prix estime |

#### `purchase_orders`
Bons de commande.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | TEXT | Cle primaire |
| `organization_id` | TEXT | FK |
| `po_number` | TEXT | Numero BC |
| `supplier_id` | TEXT | FK vers suppliers |
| `order_date` | TEXT | Date commande |
| `expected_date` | TEXT | Date livraison prevue |
| `status` | TEXT | draft, sent, confirmed, received, cancelled |
| `subtotal` | REAL | Sous-total HT |
| `tax_amount` | REAL | TVA |
| `total` | REAL | Total TTC |

#### `purchase_order_lines`
Lignes de BC.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | TEXT | Cle primaire |
| `purchase_order_id` | TEXT | FK vers purchase_orders |
| `item_id` | TEXT | FK vers inventory_items |
| `quantity` | REAL | Quantite |
| `unit_price` | REAL | Prix unitaire |
| `received_quantity` | REAL | Quantite recue |

#### `goods_received_notes`
Bons de reception.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | TEXT | Cle primaire |
| `organization_id` | TEXT | FK |
| `grn_number` | TEXT | Numero BL |
| `purchase_order_id` | TEXT | FK vers purchase_orders |
| `received_date` | TEXT | Date reception |
| `warehouse_id` | TEXT | FK vers warehouses |
| `status` | TEXT | draft, confirmed |

#### `goods_received_lines`
Lignes de bon de reception.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | TEXT | Cle primaire |
| `grn_id` | TEXT | FK vers goods_received_notes |
| `po_line_id` | TEXT | FK vers purchase_order_lines |
| `quantity_received` | REAL | Quantite recue |
| `quantity_rejected` | REAL | Quantite refusee |

---

## 8. Ventes

**Fichier**: `packages/database/src/schema/sales.ts`

### Tables (4)

#### `quotes`
Devis.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | TEXT | Cle primaire |
| `organization_id` | TEXT | FK |
| `quote_number` | TEXT | Numero devis |
| `company_id` | TEXT | FK vers companies |
| `contact_id` | TEXT | FK vers contacts |
| `issue_date` | TEXT | Date emission |
| `valid_until` | TEXT | Date validite |
| `status` | TEXT | draft, sent, accepted, rejected, expired |
| `subtotal` | REAL | Sous-total HT |
| `tax_amount` | REAL | TVA |
| `total` | REAL | Total TTC |

#### `sales_orders`
Commandes clients.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | TEXT | Cle primaire |
| `organization_id` | TEXT | FK |
| `order_number` | TEXT | Numero commande |
| `company_id` | TEXT | FK vers companies |
| `contact_id` | TEXT | FK vers contacts |
| `quote_id` | TEXT | FK vers quotes (optionnel) |
| `order_date` | TEXT | Date commande |
| `delivery_date` | TEXT | Date livraison prevue |
| `status` | TEXT | draft, confirmed, processing, shipped, delivered, cancelled |
| `subtotal` | REAL | Sous-total HT |
| `tax_amount` | REAL | TVA |
| `total` | REAL | Total TTC |

#### `sales_order_lines`
Lignes de commande.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | TEXT | Cle primaire |
| `sales_order_id` | TEXT | FK vers sales_orders |
| `item_id` | TEXT | FK vers inventory_items |
| `description` | TEXT | Description |
| `quantity` | REAL | Quantite |
| `unit_price` | REAL | Prix unitaire |
| `discount` | REAL | Remise |
| `tax_rate` | REAL | Taux TVA |

#### `delivery_notes`
Bons de livraison.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | TEXT | Cle primaire |
| `organization_id` | TEXT | FK |
| `delivery_number` | TEXT | Numero BL |
| `sales_order_id` | TEXT | FK vers sales_orders |
| `delivery_date` | TEXT | Date livraison |
| `status` | TEXT | pending, shipped, delivered |
| `carrier` | TEXT | Transporteur |
| `tracking_number` | TEXT | Numero suivi |

---

## 9. Production (Manufacturing)

**Fichier**: `packages/database/src/schema/manufacturing.ts`

### Tables (7)

#### `bill_of_materials`
Nomenclatures (BOM).

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | TEXT | Cle primaire |
| `organization_id` | TEXT | FK |
| `product_id` | TEXT | FK vers inventory_items (produit fini) |
| `name` | TEXT | Nom de la nomenclature |
| `version` | TEXT | Version |
| `status` | TEXT | draft, active, obsolete |
| `standard_quantity` | REAL | Quantite standard |

#### `bom_lines`
Lignes de nomenclature.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | TEXT | Cle primaire |
| `bom_id` | TEXT | FK vers bill_of_materials |
| `item_id` | TEXT | FK vers inventory_items (composant) |
| `quantity` | REAL | Quantite |
| `unit` | TEXT | Unite |
| `scrap_rate` | REAL | Taux de rebut (%) |

#### `routings`
Gammes de fabrication.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | TEXT | Cle primaire |
| `organization_id` | TEXT | FK |
| `product_id` | TEXT | FK vers inventory_items |
| `name` | TEXT | Nom |
| `version` | TEXT | Version |
| `status` | TEXT | draft, active, obsolete |

#### `routing_operations`
Operations de gamme.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | TEXT | Cle primaire |
| `routing_id` | TEXT | FK vers routings |
| `sequence` | INTEGER | Ordre |
| `name` | TEXT | Nom operation |
| `work_center` | TEXT | Poste de travail |
| `setup_time` | REAL | Temps de reglage (min) |
| `run_time` | REAL | Temps d'execution (min) |
| `description` | TEXT | Description |

#### `work_orders`
Ordres de fabrication.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | TEXT | Cle primaire |
| `organization_id` | TEXT | FK |
| `wo_number` | TEXT | Numero OF |
| `product_id` | TEXT | FK vers inventory_items |
| `bom_id` | TEXT | FK vers bill_of_materials |
| `routing_id` | TEXT | FK vers routings |
| `quantity` | REAL | Quantite a produire |
| `planned_start` | TEXT | Debut prevu |
| `planned_end` | TEXT | Fin prevue |
| `actual_start` | TEXT | Debut reel |
| `actual_end` | TEXT | Fin reelle |
| `status` | TEXT | draft, released, in_progress, completed, cancelled |
| `quantity_produced` | REAL | Quantite produite |
| `quantity_rejected` | REAL | Quantite rebutee |

#### `work_order_operations`
Operations d'OF.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | TEXT | Cle primaire |
| `work_order_id` | TEXT | FK vers work_orders |
| `routing_operation_id` | TEXT | FK vers routing_operations |
| `sequence` | INTEGER | Ordre |
| `status` | TEXT | pending, in_progress, completed |
| `started_at` | INTEGER | Debut |
| `completed_at` | INTEGER | Fin |
| `actual_time` | REAL | Temps reel (min) |

#### `material_consumption`
Consommations matieres.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | TEXT | Cle primaire |
| `work_order_id` | TEXT | FK vers work_orders |
| `item_id` | TEXT | FK vers inventory_items |
| `planned_quantity` | REAL | Quantite prevue |
| `actual_quantity` | REAL | Quantite consommee |
| `warehouse_id` | TEXT | FK vers warehouses |

---

## 10. Actifs

**Fichier**: `packages/database/src/schema/assets.ts`

### Tables (5)

#### `asset_categories`
Categories d'actifs.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | TEXT | Cle primaire |
| `organization_id` | TEXT | FK |
| `name` | TEXT | Nom |
| `depreciation_method` | TEXT | linear, declining |
| `useful_life` | INTEGER | Duree de vie (mois) |
| `depreciation_rate` | REAL | Taux d'amortissement |

#### `fixed_assets`
Immobilisations.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | TEXT | Cle primaire |
| `organization_id` | TEXT | FK |
| `asset_number` | TEXT | Numero immobilisation |
| `name` | TEXT | Designation |
| `category_id` | TEXT | FK vers asset_categories |
| `acquisition_date` | TEXT | Date acquisition |
| `acquisition_cost` | REAL | Valeur acquisition |
| `residual_value` | REAL | Valeur residuelle |
| `current_value` | REAL | Valeur nette comptable |
| `location` | TEXT | Emplacement |
| `serial_number` | TEXT | Numero de serie |
| `status` | TEXT | active, disposed, transferred |
| `disposal_date` | TEXT | Date de cession |
| `disposal_amount` | REAL | Montant de cession |

#### `asset_depreciations`
Amortissements.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | TEXT | Cle primaire |
| `asset_id` | TEXT | FK vers fixed_assets |
| `period` | TEXT | Periode (YYYY-MM) |
| `depreciation_amount` | REAL | Montant amorti |
| `accumulated_depreciation` | REAL | Amortissement cumule |
| `book_value` | REAL | Valeur nette |

#### `asset_maintenance`
Maintenances.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | TEXT | Cle primaire |
| `asset_id` | TEXT | FK vers fixed_assets |
| `maintenance_type` | TEXT | preventive, corrective |
| `scheduled_date` | TEXT | Date planifiee |
| `completed_date` | TEXT | Date realisee |
| `cost` | REAL | Cout |
| `description` | TEXT | Description |
| `performed_by` | TEXT | Realise par |
| `status` | TEXT | scheduled, completed, cancelled |

#### `asset_transfers`
Transferts d'actifs.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | TEXT | Cle primaire |
| `asset_id` | TEXT | FK vers fixed_assets |
| `from_location` | TEXT | Emplacement source |
| `to_location` | TEXT | Emplacement destination |
| `transfer_date` | TEXT | Date transfert |
| `reason` | TEXT | Motif |
| `transferred_by` | TEXT | FK vers users |

---

## 11. Notifications & Audit

**Fichier**: `packages/database/src/schema/notifications.ts`

### Tables (3)

#### `notifications`
Notifications utilisateur.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | TEXT | Cle primaire |
| `organization_id` | TEXT | FK |
| `user_id` | TEXT | FK vers users |
| `type` | TEXT | info, warning, error, success |
| `title` | TEXT | Titre |
| `message` | TEXT | Message |
| `link` | TEXT | Lien (optionnel) |
| `read_at` | INTEGER | Date de lecture |
| `created_at` | INTEGER | Date de creation |

#### `audit_logs`
Journal d'audit.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | TEXT | Cle primaire |
| `organization_id` | TEXT | FK |
| `user_id` | TEXT | FK vers users |
| `action` | TEXT | create, update, delete, login... |
| `entity_type` | TEXT | Type d'entite (invoice, payment...) |
| `entity_id` | TEXT | ID de l'entite |
| `old_values` | TEXT | Anciennes valeurs (JSON) |
| `new_values` | TEXT | Nouvelles valeurs (JSON) |
| `ip_address` | TEXT | Adresse IP |
| `user_agent` | TEXT | User-Agent |
| `created_at` | INTEGER | Date |

#### `system_settings`
Parametres systeme.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | TEXT | Cle primaire |
| `organization_id` | TEXT | FK |
| `key` | TEXT | Cle du parametre |
| `value` | TEXT | Valeur (JSON) |
| `updated_at` | INTEGER | Date modification |
| `updated_by` | TEXT | FK vers users |

---

## 12. Documents

**Fichier**: `packages/database/src/schema/documents.ts`

### Tables (9)

#### `document_categories`
Categories de documents.

#### `documents`
Documents.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | TEXT | Cle primaire |
| `organization_id` | TEXT | FK |
| `name` | TEXT | Nom |
| `category_id` | TEXT | FK vers document_categories |
| `file_path` | TEXT | Chemin du fichier |
| `file_size` | INTEGER | Taille (octets) |
| `mime_type` | TEXT | Type MIME |
| `version` | INTEGER | Version |
| `entity_type` | TEXT | Type d'entite lie |
| `entity_id` | TEXT | ID entite lie |
| `uploaded_by` | TEXT | FK vers users |

#### `document_versions`
Versions de documents.

#### `document_access_log`
Log d'acces aux documents.

#### `document_shares`
Partages de documents.

#### `email_templates`
Modeles d'email.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | TEXT | Cle primaire |
| `organization_id` | TEXT | FK |
| `name` | TEXT | Nom |
| `subject` | TEXT | Sujet |
| `body` | TEXT | Corps (HTML) |
| `variables` | TEXT | Variables disponibles (JSON) |

#### `email_queue`
File d'attente d'emails.

#### `reports`
Definitions de rapports.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | TEXT | Cle primaire |
| `organization_id` | TEXT | FK |
| `name` | TEXT | Nom |
| `type` | TEXT | Type de rapport |
| `config` | TEXT | Configuration (JSON) |
| `is_public` | INTEGER | Public |

#### `scheduled_reports`
Rapports planifies.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | TEXT | Cle primaire |
| `report_id` | TEXT | FK vers reports |
| `schedule` | TEXT | Cron expression |
| `recipients` | TEXT | Destinataires (JSON) |
| `next_run` | INTEGER | Prochaine execution |

---

## 13. Workflows

**Fichier**: `packages/database/src/schema/workflows.ts`

### Tables (11)

#### `workflows`
Definitions de workflows.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | TEXT | Cle primaire |
| `organization_id` | TEXT | FK |
| `name` | TEXT | Nom |
| `entity_type` | TEXT | Type d'entite declencheur |
| `trigger_event` | TEXT | Evenement declencheur |
| `is_active` | INTEGER | Actif |
| `config` | TEXT | Configuration (JSON) |

#### `workflow_steps`
Etapes de workflow.

#### `workflow_instances`
Instances de workflow.

#### `workflow_step_executions`
Executions d'etapes.

#### `approvals`
Demandes d'approbation.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | TEXT | Cle primaire |
| `organization_id` | TEXT | FK |
| `entity_type` | TEXT | Type d'entite |
| `entity_id` | TEXT | ID entite |
| `requester_id` | TEXT | FK vers users (demandeur) |
| `approver_id` | TEXT | FK vers users (approbateur) |
| `status` | TEXT | pending, approved, rejected |
| `comments` | TEXT | Commentaires |

#### `activity_feed`
Fil d'activite.

#### `comments`
Commentaires sur entites.

#### `webhooks`
Webhooks.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | TEXT | Cle primaire |
| `organization_id` | TEXT | FK |
| `name` | TEXT | Nom |
| `url` | TEXT | URL cible |
| `events` | TEXT | Evenements (JSON) |
| `secret` | TEXT | Secret de signature |
| `is_active` | INTEGER | Actif |

#### `webhook_logs`
Logs de webhooks.

#### `api_keys`
Cles API.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | TEXT | Cle primaire |
| `organization_id` | TEXT | FK |
| `name` | TEXT | Nom |
| `key_hash` | TEXT | Hash de la cle |
| `prefix` | TEXT | Prefixe visible |
| `permissions` | TEXT | Permissions (JSON) |
| `ip_whitelist` | TEXT | IPs autorisees (JSON) |
| `expires_at` | INTEGER | Expiration |
| `last_used_at` | INTEGER | Derniere utilisation |

#### `api_key_usage`
Utilisation des cles API.

#### `tags` & `entity_tags`
Systeme de tags.

---

## 14. Intelligence Artificielle

**Fichier**: `packages/database/src/schema/ai.ts`

### Tables (4)

#### `ai_embeddings`
Embeddings vectoriels.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | TEXT | Cle primaire |
| `organization_id` | TEXT | FK |
| `entity_type` | TEXT | Type d'entite |
| `entity_id` | TEXT | ID entite |
| `embedding` | TEXT | Vecteur (JSON) |
| `content` | TEXT | Contenu source |

#### `ai_conversations`
Conversations IA.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | TEXT | Cle primaire |
| `organization_id` | TEXT | FK |
| `user_id` | TEXT | FK vers users |
| `title` | TEXT | Titre |
| `messages` | TEXT | Messages (JSON) |
| `context` | TEXT | Contexte (JSON) |

#### `ai_insights`
Insights generes par IA.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | TEXT | Cle primaire |
| `organization_id` | TEXT | FK |
| `type` | TEXT | Type d'insight |
| `title` | TEXT | Titre |
| `content` | TEXT | Contenu |
| `confidence` | REAL | Confiance (0-1) |
| `entity_type` | TEXT | Type d'entite concernee |
| `entity_id` | TEXT | ID entite |

#### `ai_usage`
Utilisation IA (tokens, couts).

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | TEXT | Cle primaire |
| `organization_id` | TEXT | FK |
| `user_id` | TEXT | FK vers users |
| `model` | TEXT | Modele utilise |
| `input_tokens` | INTEGER | Tokens en entree |
| `output_tokens` | INTEGER | Tokens en sortie |
| `cost` | REAL | Cout estime |

---

## 15. Smart Audit System

**Fichier**: `packages/database/src/schema/audit.ts`

### Tables (12)

Tables dediees au systeme d'audit intelligent incluant:
- `audit_tasks` - Taches d'audit
- `audit_findings` - Constats d'audit
- `risk_assessments` - Evaluations des risques
- `risk_data_points` - Points de donnees de risque
- `compliance_knowledge_base` - Base de connaissances conformite
- `compliance_checks` - Controles de conformite
- `compliance_conversations` - Conversations conformite
- `commonality_studies` - Etudes de points communs
- `improvement_proposals` - Propositions d'amelioration
- `audit_schedules` - Planification des audits
- `audit_configuration` - Configuration audit

---

## 16. Modules

**Fichier**: `packages/database/src/schema/modules.ts`

### Tables (2)

#### `module_registry`
Registre des modules disponibles.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | TEXT | Cle primaire (finance, crm...) |
| `name` | TEXT | Nom affiche |
| `description` | TEXT | Description |
| `category` | TEXT | core, industry, advanced |
| `icon` | TEXT | Nom icone Lucide |
| `is_default` | INTEGER | Active par defaut |
| `sort_order` | INTEGER | Ordre affichage |
| `dependencies` | TEXT | Dependances (JSON) |

#### `organization_modules`
Modules actives par organisation.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | TEXT | Cle primaire |
| `organization_id` | TEXT | FK vers organizations |
| `module_id` | TEXT | FK vers module_registry |
| `enabled` | INTEGER | Active (0/1) |
| `settings` | TEXT | Parametres specifiques (JSON) |
| `enabled_at` | INTEGER | Date activation |
| `enabled_by` | TEXT | FK vers users |

---

## 17. Recettes

**Fichier**: `packages/database/src/schema/recipes.ts`

### Tables (7)

#### `recipe_categories`
Categories de recettes.

#### `recipes`
Recettes.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | TEXT | Cle primaire |
| `organization_id` | TEXT | FK |
| `name` | TEXT | Nom |
| `category_id` | TEXT | FK vers recipe_categories |
| `description` | TEXT | Description |
| `yield_quantity` | REAL | Quantite produite |
| `yield_unit` | TEXT | Unite |
| `prep_time` | INTEGER | Temps preparation (min) |
| `cook_time` | INTEGER | Temps cuisson (min) |
| `total_time` | INTEGER | Temps total (min) |
| `cost` | REAL | Cout de revient |
| `selling_price` | REAL | Prix de vente |
| `status` | TEXT | draft, active, archived |

#### `recipe_ingredients`
Ingredients de recette.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | TEXT | Cle primaire |
| `recipe_id` | TEXT | FK vers recipes |
| `item_id` | TEXT | FK vers inventory_items |
| `quantity` | REAL | Quantite |
| `unit` | TEXT | Unite |
| `notes` | TEXT | Notes |

#### `recipe_steps`
Etapes de recette.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | TEXT | Cle primaire |
| `recipe_id` | TEXT | FK vers recipes |
| `step_number` | INTEGER | Numero d'etape |
| `instruction` | TEXT | Instructions |
| `duration` | INTEGER | Duree (min) |
| `temperature` | REAL | Temperature |

#### `recipe_versions`
Versions de recettes.

#### `recipe_scaling`
Facteurs de mise a l'echelle.

#### `allergen_registry`
Registre des allergenes.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | TEXT | Cle primaire |
| `organization_id` | TEXT | FK |
| `name` | TEXT | Nom (gluten, lactose...) |
| `code` | TEXT | Code |
| `description` | TEXT | Description |

---

## 18. Tracabilite & HACCP

**Fichier**: `packages/database/src/schema/traceability.ts`

### Tables (9)

#### `lots`
Lots de production.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | TEXT | Cle primaire |
| `organization_id` | TEXT | FK |
| `lot_number` | TEXT | Numero de lot |
| `item_id` | TEXT | FK vers inventory_items |
| `quantity` | REAL | Quantite |
| `production_date` | TEXT | Date production |
| `expiry_date` | TEXT | Date peremption (DLC/DDM) |
| `status` | TEXT | available, reserved, consumed, expired |

#### `lot_movements`
Mouvements de lots.

#### `production_traceability`
Tracabilite de production.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | TEXT | Cle primaire |
| `work_order_id` | TEXT | FK vers work_orders |
| `output_lot_id` | TEXT | FK vers lots (lot produit) |
| `input_lots` | TEXT | Lots en entree (JSON) |
| `production_date` | TEXT | Date production |
| `operator_id` | TEXT | FK vers employees |

#### `production_input_lots`
Lots utilises en production.

#### `haccp_control_points`
Points de controle HACCP.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | TEXT | Cle primaire |
| `organization_id` | TEXT | FK |
| `name` | TEXT | Nom |
| `type` | TEXT | CCP, PRP, OPRP |
| `description` | TEXT | Description |
| `critical_limits` | TEXT | Limites critiques (JSON) |
| `monitoring_frequency` | TEXT | Frequence de controle |
| `corrective_actions` | TEXT | Actions correctives (JSON) |

#### `haccp_records`
Enregistrements HACCP.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | TEXT | Cle primaire |
| `control_point_id` | TEXT | FK vers haccp_control_points |
| `recorded_at` | INTEGER | Date/heure enregistrement |
| `recorded_by` | TEXT | FK vers employees |
| `values` | TEXT | Valeurs mesurees (JSON) |
| `is_compliant` | INTEGER | Conforme (0/1) |
| `deviation` | TEXT | Ecart constate |
| `corrective_action_taken` | TEXT | Action corrective |

#### `temperature_logs`
Releves de temperature.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | TEXT | Cle primaire |
| `organization_id` | TEXT | FK |
| `location` | TEXT | Emplacement (frigo, chambre froide...) |
| `temperature` | REAL | Temperature (C) |
| `recorded_at` | INTEGER | Date/heure |
| `recorded_by` | TEXT | FK vers employees |
| `is_alarm` | INTEGER | Alarme declenchee |

#### `product_recalls`
Rappels de produits.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | TEXT | Cle primaire |
| `organization_id` | TEXT | FK |
| `recall_number` | TEXT | Numero de rappel |
| `reason` | TEXT | Motif |
| `affected_lots` | TEXT | Lots concernes (JSON) |
| `status` | TEXT | initiated, in_progress, completed |
| `initiated_at` | INTEGER | Date initiation |
| `completed_at` | INTEGER | Date completion |

#### `cleaning_records`
Enregistrements de nettoyage.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | TEXT | Cle primaire |
| `organization_id` | TEXT | FK |
| `area` | TEXT | Zone nettoyee |
| `cleaned_at` | INTEGER | Date/heure |
| `cleaned_by` | TEXT | FK vers employees |
| `products_used` | TEXT | Produits utilises |
| `verified_by` | TEXT | FK vers employees |

---

## 19. Paie

**Fichier**: `packages/database/src/schema/payroll.ts`

### Tables (11)

#### `payroll_periods`
Periodes de paie.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | TEXT | Cle primaire |
| `organization_id` | TEXT | FK |
| `name` | TEXT | Nom (ex: Janvier 2024) |
| `start_date` | TEXT | Date debut |
| `end_date` | TEXT | Date fin |
| `payment_date` | TEXT | Date paiement |
| `status` | TEXT | draft, processing, paid, closed |

#### `salary_components`
Composants de salaire.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | TEXT | Cle primaire |
| `organization_id` | TEXT | FK |
| `name` | TEXT | Nom (Salaire base, Prime...) |
| `code` | TEXT | Code |
| `type` | TEXT | earning, deduction |
| `calculation_type` | TEXT | fixed, percentage, formula |
| `amount` | REAL | Montant/Pourcentage |
| `is_taxable` | INTEGER | Soumis a impot |
| `is_social_charge` | INTEGER | Soumis a charges sociales |

#### `employee_salaries`
Salaires par employe.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | TEXT | Cle primaire |
| `employee_id` | TEXT | FK vers employees |
| `base_salary` | REAL | Salaire de base |
| `currency` | TEXT | Devise |
| `effective_date` | TEXT | Date d'effet |

#### `employee_salary_components`
Composants de salaire par employe.

#### `payslips`
Bulletins de paie.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | TEXT | Cle primaire |
| `organization_id` | TEXT | FK |
| `employee_id` | TEXT | FK vers employees |
| `period_id` | TEXT | FK vers payroll_periods |
| `gross_salary` | REAL | Salaire brut |
| `net_salary` | REAL | Salaire net |
| `total_deductions` | REAL | Total retenues |
| `employer_charges` | REAL | Charges patronales |
| `status` | TEXT | draft, validated, paid |

#### `payslip_lines`
Lignes de bulletin de paie.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | TEXT | Cle primaire |
| `payslip_id` | TEXT | FK vers payslips |
| `component_id` | TEXT | FK vers salary_components |
| `description` | TEXT | Libelle |
| `base` | REAL | Base |
| `rate` | REAL | Taux |
| `employee_amount` | REAL | Part salariale |
| `employer_amount` | REAL | Part patronale |

#### `tax_tables`
Baremes fiscaux.

#### `social_contributions`
Cotisations sociales (CNSS, CNAM...).

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | TEXT | Cle primaire |
| `organization_id` | TEXT | FK |
| `name` | TEXT | Nom (CNSS, CNAM...) |
| `code` | TEXT | Code |
| `employee_rate` | REAL | Taux salarial |
| `employer_rate` | REAL | Taux patronal |
| `ceiling` | REAL | Plafond |

#### `overtime_rules`
Regles heures supplementaires.

#### `bonuses`
Primes.

#### `payroll_declarations`
Declarations sociales et fiscales.

---

## 20. Integrations

**Fichier**: `packages/database/src/schema/integrations.ts`

### Tables (7)

#### `integration_configs`
Configurations d'integration.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | TEXT | Cle primaire |
| `organization_id` | TEXT | FK |
| `provider` | TEXT | Fournisseur (flousi, konnect...) |
| `type` | TEXT | payment, sms, shipping, fiscal |
| `credentials` | TEXT | Identifiants (JSON chiffre) |
| `settings` | TEXT | Parametres (JSON) |
| `is_active` | INTEGER | Actif |
| `is_sandbox` | INTEGER | Mode test |

#### `integration_transactions`
Transactions d'integration.

#### `payment_transactions`
Transactions de paiement.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | TEXT | Cle primaire |
| `organization_id` | TEXT | FK |
| `provider` | TEXT | Fournisseur |
| `external_id` | TEXT | ID externe |
| `amount` | REAL | Montant |
| `currency` | TEXT | Devise |
| `status` | TEXT | pending, completed, failed, refunded |
| `payment_method` | TEXT | Methode |
| `invoice_id` | TEXT | FK vers invoices |

#### `sms_transactions`
Transactions SMS.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | TEXT | Cle primaire |
| `organization_id` | TEXT | FK |
| `provider` | TEXT | Fournisseur |
| `phone_number` | TEXT | Numero destination |
| `message` | TEXT | Message |
| `status` | TEXT | pending, sent, delivered, failed |

#### `shipping_transactions`
Transactions d'expedition.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | TEXT | Cle primaire |
| `organization_id` | TEXT | FK |
| `provider` | TEXT | Fournisseur |
| `tracking_number` | TEXT | Numero de suivi |
| `status` | TEXT | created, picked_up, in_transit, delivered |
| `delivery_note_id` | TEXT | FK vers delivery_notes |

#### `fiscal_declarations`
Declarations fiscales.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | TEXT | Cle primaire |
| `organization_id` | TEXT | FK |
| `type` | TEXT | tva, is, irpp |
| `period` | TEXT | Periode |
| `amount` | REAL | Montant |
| `status` | TEXT | draft, submitted, validated |
| `submitted_at` | INTEGER | Date soumission |

#### `integration_webhook_events`
Evenements webhook d'integration.

---

## Migrations

### Liste des Migrations

| # | Fichier | Description |
|---|---------|-------------|
| 0001 | 0001_create_users.sql | Tables utilisateurs et organisations |
| 0002 | 0002_create_finance.sql | Tables comptabilite |
| 0003 | 0003_create_crm.sql | Tables CRM |
| 0004 | 0004_create_projects.sql | Tables projets |
| 0005 | 0005_create_inventory.sql | Tables inventaire |
| 0006 | 0006_create_hr.sql | Tables RH |
| 0007 | 0007_create_procurement.sql | Tables achats |
| 0008 | 0008_create_sales.sql | Tables ventes |
| 0009 | 0009_create_manufacturing.sql | Tables production |
| 0010 | 0010_create_assets.sql | Tables actifs |
| 0011 | 0011_create_notifications.sql | Tables notifications/audit |
| 0012 | 0012_create_documents.sql | Tables documents |
| 0013 | 0013_create_workflows.sql | Tables workflows |
| 0014 | 0014_create_ai.sql | Tables IA |
| 0015 | 0015_create_audit_system.sql | Tables Smart Audit |
| 0016 | 0016_create_modules.sql | Tables modules |
| 0017 | 0017_create_industry.sql | Tables metier (recettes, HACCP, paie, integrations) |

### Appliquer les Migrations

```bash
# En local
wrangler d1 migrations apply perfex-db-dev --local

# En production
wrangler d1 migrations apply perfex-db-prod --remote --env production
```

---

## Index et Performance

### Index Recommandes

```sql
-- Index sur organization_id (multi-tenancy)
CREATE INDEX idx_invoices_org ON invoices(organization_id);
CREATE INDEX idx_companies_org ON companies(organization_id);
CREATE INDEX idx_employees_org ON employees(organization_id);

-- Index sur les cles etrangeres frequentes
CREATE INDEX idx_invoices_company ON invoices(company_id);
CREATE INDEX idx_invoice_lines_invoice ON invoice_lines(invoice_id);
CREATE INDEX idx_payments_invoice ON payment_allocations(invoice_id);

-- Index sur les dates
CREATE INDEX idx_invoices_date ON invoices(issue_date);
CREATE INDEX idx_journal_entries_date ON journal_entries(entry_date);

-- Index sur les statuts
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_work_orders_status ON work_orders(status);
```

---

**Derniere mise a jour**: Decembre 2024
