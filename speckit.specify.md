# Spécifications Complètes - Perfex ERP AI-Native

> Spécifications techniques détaillées de tous les modules (12 modules)
> Version 1.0 - Novembre 2025

---

# TABLE DES MATIÈRES

## Phase 1 - MVP (Mois 1-4)
1. [Module Auth](#module-1-auth)
2. [Module Finance](#module-2-finance)
3. [Module CRM](#module-3-crm)
4. [Module AI Core](#module-4-ai-core)

## Phase 2 - Core (Mois 5-8)
5. [Module Purchases](#module-5-purchases)
6. [Module Inventory](#module-6-inventory)
7. [Module Projects](#module-7-projects)
8. [Module HR](#module-8-hr)

## Phase 3 - Advanced (Mois 9-12)
9. [Module Manufacturing](#module-9-manufacturing)
10. [Module E-commerce](#module-10-e-commerce)
11. [Module Analytics](#module-11-analytics)
12. [Module Advanced AI](#module-12-advanced-ai)

---

# MODULE 1: AUTH

## 1.1 Overview

**Nom**: Auth & Users  
**Priorité**: P0 (Critique)  
**Phase**: 1 - MVP  
**Estimation**: 2 semaines  
**Dépendances**: Aucune (module fondation)

**Description**: Système d'authentification complet avec gestion des utilisateurs, organisations multi-tenant, et contrôle d'accès basé sur les rôles (RBAC).

## 1.2 Fonctionnalités

### F1.1 Authentication
- Register avec email/password
- Login avec rate limiting
- JWT tokens (access 15min, refresh 7j)
- Logout (invalidation tokens)
- Password reset via email
- Email verification

### F1.2 User Management
- Profil utilisateur (CRUD)
- Avatar upload (R2)
- Préférences utilisateur
- Historique connexions
- Sessions actives

### F1.3 Organizations (Multi-tenant)
- Création organisation
- Invitation membres
- Rôles organisation (owner, admin, member)
- Paramètres organisation
- Billing info (placeholder)

### F1.4 RBAC (Role-Based Access Control)
- Rôles système: super_admin, admin, manager, user
- Rôles custom par organisation
- Permissions granulaires par module
- Middleware authorization

## 1.3 Database Schema

```sql
-- Users
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  email_verified INTEGER DEFAULT 0,
  active INTEGER DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  last_login_at INTEGER
);

-- Organizations
CREATE TABLE organizations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  settings TEXT, -- JSON
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Organization Members
CREATE TABLE organization_members (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  role TEXT NOT NULL DEFAULT 'member', -- owner, admin, member
  joined_at INTEGER NOT NULL,
  UNIQUE(organization_id, user_id)
);

-- Roles
CREATE TABLE roles (
  id TEXT PRIMARY KEY,
  organization_id TEXT REFERENCES organizations(id), -- NULL = system role
  name TEXT NOT NULL,
  permissions TEXT NOT NULL, -- JSON array
  created_at INTEGER NOT NULL
);

-- User Roles
CREATE TABLE user_roles (
  user_id TEXT NOT NULL REFERENCES users(id),
  role_id TEXT NOT NULL REFERENCES roles(id),
  organization_id TEXT REFERENCES organizations(id),
  PRIMARY KEY (user_id, role_id, organization_id)
);

-- Sessions (backup, main in KV)
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  refresh_token_hash TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);
```

## 1.4 API Endpoints

### Authentication
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | /auth/register | Inscription | No |
| POST | /auth/login | Connexion | No |
| POST | /auth/refresh | Refresh token | No |
| POST | /auth/logout | Déconnexion | Yes |
| POST | /auth/forgot-password | Demande reset | No |
| POST | /auth/reset-password | Reset password | No |
| POST | /auth/verify-email | Vérifier email | No |

### Users
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /users/me | Mon profil | Yes |
| PUT | /users/me | Update profil | Yes |
| POST | /users/me/avatar | Upload avatar | Yes |
| GET | /users/me/sessions | Mes sessions | Yes |
| DELETE | /users/me/sessions/:id | Révoquer session | Yes |

### Organizations
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | /organizations | Créer org | Yes |
| GET | /organizations | Mes orgs | Yes |
| GET | /organizations/:id | Détails org | Yes |
| PUT | /organizations/:id | Update org | Yes+Admin |
| DELETE | /organizations/:id | Supprimer org | Yes+Owner |
| POST | /organizations/:id/invite | Inviter membre | Yes+Admin |
| GET | /organizations/:id/members | Liste membres | Yes |
| PUT | /organizations/:id/members/:userId | Update rôle | Yes+Admin |
| DELETE | /organizations/:id/members/:userId | Retirer membre | Yes+Admin |

### Roles & Permissions
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /roles | Liste rôles | Yes+Admin |
| POST | /roles | Créer rôle | Yes+Admin |
| PUT | /roles/:id | Update rôle | Yes+Admin |
| DELETE | /roles/:id | Supprimer rôle | Yes+Admin |

## 1.5 Validators (Zod)

```typescript
// Register
const registerSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/).regex(/[^A-Za-z0-9]/),
  firstName: z.string().min(2).max(50),
  lastName: z.string().min(2).max(50),
  organizationName: z.string().min(2).max(100).optional()
});

// Login
const loginSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(1)
});

// Organization
const createOrganizationSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/).optional()
});

// Invite
const inviteMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(['admin', 'member'])
});
```

## 1.6 Services

```typescript
// AuthService
- register(data): AuthResponse
- login(email, password, ip): AuthResponse
- refresh(refreshToken): { accessToken }
- logout(refreshToken): void
- forgotPassword(email): void
- resetPassword(token, newPassword): void
- verifyEmail(token): void

// UserService
- getProfile(userId): User
- updateProfile(userId, data): User
- uploadAvatar(userId, file): string
- getSessions(userId): Session[]
- revokeSession(userId, sessionId): void

// OrganizationService
- create(userId, data): Organization
- getByUser(userId): Organization[]
- getById(orgId): Organization
- update(orgId, data): Organization
- delete(orgId): void
- inviteMember(orgId, email, role): Invitation
- getMembers(orgId): Member[]
- updateMemberRole(orgId, userId, role): void
- removeMember(orgId, userId): void

// RoleService
- getAll(orgId?): Role[]
- create(orgId, data): Role
- update(roleId, data): Role
- delete(roleId): void
- assignToUser(userId, roleId, orgId): void
- checkPermission(userId, permission, orgId): boolean
```

---

# MODULE 2: FINANCE

## 2.1 Overview

**Nom**: Finance & Accounting  
**Priorité**: P0 (Critique)  
**Phase**: 1 - MVP  
**Estimation**: 4 semaines  
**Dépendances**: Auth

**Description**: Module comptable complet avec plan comptable, journaux, facturation, paiements et reporting financier.

## 2.2 Fonctionnalités

### F2.1 Plan Comptable
- Comptes par classe (1-8)
- Hiérarchie comptes (parent/enfant)
- Templates plans comptables (FR, SYSCOHADA)
- Import/export plan comptable

### F2.2 Écritures Comptables
- Journaux (Achats, Ventes, Banque, OD)
- Écritures multi-lignes
- Lettrage automatique
- Validation/Clôture périodes
- Extourne écritures

### F2.3 Facturation
- Factures clients (vente)
- Avoirs
- Acomptes
- Numérotation automatique
- Templates factures
- PDF generation
- Envoi email

### F2.4 Paiements
- Enregistrement paiements
- Rapprochement bancaire
- Modes paiement multiples
- Échéancier
- Relances automatiques

### F2.5 Trésorerie
- Comptes bancaires
- Soldes en temps réel
- Prévisions trésorerie
- Virements internes

### F2.6 Reporting
- Grand livre
- Balance générale
- Bilan
- Compte de résultat
- TVA (CA3)
- Export Excel/PDF

## 2.3 Database Schema

```sql
-- Chart of Accounts
CREATE TABLE accounts (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- asset, liability, equity, revenue, expense
  parent_id TEXT REFERENCES accounts(id),
  is_active INTEGER DEFAULT 1,
  created_at INTEGER NOT NULL,
  UNIQUE(organization_id, code)
);

-- Journals
CREATE TABLE journals (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- purchase, sales, bank, misc
  UNIQUE(organization_id, code)
);

-- Journal Entries
CREATE TABLE journal_entries (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  journal_id TEXT NOT NULL REFERENCES journals(id),
  entry_number TEXT NOT NULL,
  entry_date INTEGER NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'draft', -- draft, posted, cancelled
  created_by TEXT REFERENCES users(id),
  posted_at INTEGER,
  created_at INTEGER NOT NULL,
  UNIQUE(organization_id, entry_number)
);

-- Journal Entry Lines
CREATE TABLE journal_entry_lines (
  id TEXT PRIMARY KEY,
  entry_id TEXT NOT NULL REFERENCES journal_entries(id),
  account_id TEXT NOT NULL REFERENCES accounts(id),
  debit REAL DEFAULT 0,
  credit REAL DEFAULT 0,
  label TEXT,
  partner_id TEXT REFERENCES contacts(id),
  reconciled INTEGER DEFAULT 0,
  reconcile_id TEXT
);

-- Invoices
CREATE TABLE invoices (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  type TEXT NOT NULL, -- invoice, credit_note
  number TEXT NOT NULL,
  contact_id TEXT NOT NULL REFERENCES contacts(id),
  invoice_date INTEGER NOT NULL,
  due_date INTEGER NOT NULL,
  status TEXT DEFAULT 'draft', -- draft, sent, paid, cancelled
  subtotal REAL NOT NULL,
  tax_amount REAL DEFAULT 0,
  total REAL NOT NULL,
  amount_paid REAL DEFAULT 0,
  currency TEXT DEFAULT 'EUR',
  notes TEXT,
  terms TEXT,
  pdf_url TEXT,
  journal_entry_id TEXT REFERENCES journal_entries(id),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(organization_id, number)
);

-- Invoice Lines
CREATE TABLE invoice_lines (
  id TEXT PRIMARY KEY,
  invoice_id TEXT NOT NULL REFERENCES invoices(id),
  description TEXT NOT NULL,
  quantity REAL NOT NULL,
  unit_price REAL NOT NULL,
  tax_rate REAL DEFAULT 0,
  tax_amount REAL DEFAULT 0,
  total REAL NOT NULL,
  account_id TEXT REFERENCES accounts(id),
  product_id TEXT REFERENCES products(id),
  sort_order INTEGER DEFAULT 0
);

-- Payments
CREATE TABLE payments (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  type TEXT NOT NULL, -- incoming, outgoing
  amount REAL NOT NULL,
  payment_date INTEGER NOT NULL,
  payment_method TEXT NOT NULL, -- cash, check, transfer, card
  reference TEXT,
  contact_id TEXT REFERENCES contacts(id),
  bank_account_id TEXT REFERENCES bank_accounts(id),
  journal_entry_id TEXT REFERENCES journal_entries(id),
  created_at INTEGER NOT NULL
);

-- Payment Allocations (links payment to invoices)
CREATE TABLE payment_allocations (
  id TEXT PRIMARY KEY,
  payment_id TEXT NOT NULL REFERENCES payments(id),
  invoice_id TEXT NOT NULL REFERENCES invoices(id),
  amount REAL NOT NULL
);

-- Bank Accounts
CREATE TABLE bank_accounts (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  name TEXT NOT NULL,
  bank_name TEXT,
  account_number TEXT,
  iban TEXT,
  bic TEXT,
  currency TEXT DEFAULT 'EUR',
  balance REAL DEFAULT 0,
  account_id TEXT REFERENCES accounts(id), -- linked GL account
  is_default INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL
);

-- Fiscal Years
CREATE TABLE fiscal_years (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  name TEXT NOT NULL,
  start_date INTEGER NOT NULL,
  end_date INTEGER NOT NULL,
  status TEXT DEFAULT 'open', -- open, closed
  created_at INTEGER NOT NULL
);

-- Tax Rates
CREATE TABLE tax_rates (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  name TEXT NOT NULL,
  rate REAL NOT NULL,
  type TEXT DEFAULT 'vat', -- vat, sales_tax, withholding
  account_id TEXT REFERENCES accounts(id),
  is_default INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL
);
```

## 2.4 API Endpoints

### Accounts
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /accounts | Liste comptes |
| POST | /accounts | Créer compte |
| GET | /accounts/:id | Détails compte |
| PUT | /accounts/:id | Update compte |
| DELETE | /accounts/:id | Supprimer |
| POST | /accounts/import | Import plan |
| GET | /accounts/export | Export plan |

### Journal Entries
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /journal-entries | Liste écritures |
| POST | /journal-entries | Créer écriture |
| GET | /journal-entries/:id | Détails |
| PUT | /journal-entries/:id | Update |
| POST | /journal-entries/:id/post | Valider |
| POST | /journal-entries/:id/cancel | Annuler |
| POST | /journal-entries/:id/reverse | Extourner |

### Invoices
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /invoices | Liste factures |
| POST | /invoices | Créer facture |
| GET | /invoices/:id | Détails |
| PUT | /invoices/:id | Update |
| DELETE | /invoices/:id | Supprimer (draft) |
| POST | /invoices/:id/send | Envoyer |
| POST | /invoices/:id/pdf | Générer PDF |
| POST | /invoices/:id/duplicate | Dupliquer |
| GET | /invoices/:id/payments | Paiements liés |

### Payments
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /payments | Liste paiements |
| POST | /payments | Créer paiement |
| GET | /payments/:id | Détails |
| POST | /payments/:id/allocate | Affecter à facture |

### Bank Accounts
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /bank-accounts | Liste |
| POST | /bank-accounts | Créer |
| GET | /bank-accounts/:id | Détails |
| PUT | /bank-accounts/:id | Update |
| GET | /bank-accounts/:id/transactions | Transactions |
| POST | /bank-accounts/:id/reconcile | Rapprocher |

### Reports
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /reports/general-ledger | Grand livre |
| GET | /reports/trial-balance | Balance |
| GET | /reports/balance-sheet | Bilan |
| GET | /reports/income-statement | P&L |
| GET | /reports/vat | Déclaration TVA |
| GET | /reports/aged-receivables | Balance âgée clients |
| GET | /reports/aged-payables | Balance âgée fournisseurs |

## 2.5 Business Rules

1. **Équilibre écritures**: Somme débits = Somme crédits
2. **Numérotation séquentielle**: Factures sans trou
3. **Clôture période**: Pas de modification après clôture
4. **TVA**: Calcul automatique selon taux
5. **Lettrage**: Automatique sur référence
6. **Relances**: J+15, J+30, J+45, J+60

---

# MODULE 3: CRM

## 3.1 Overview

**Nom**: CRM & Sales  
**Priorité**: P0 (Critique)  
**Phase**: 1 - MVP  
**Estimation**: 3 semaines  
**Dépendances**: Auth, Finance

**Description**: Gestion commerciale complète avec contacts, opportunités, pipeline de vente, devis et suivi client.

## 3.2 Fonctionnalités

### F3.1 Contacts
- Contacts (personnes)
- Sociétés (entreprises)
- Relations contact/société
- Tags et catégories
- Import/export CSV
- Déduplication

### F3.2 Pipeline Commercial
- Étapes personnalisables
- Opportunités (deals)
- Scoring leads
- Affectation commerciaux
- Prévisions ventes

### F3.3 Devis
- Création devis
- Versions devis
- Signature électronique
- Conversion en facture
- Templates devis

### F3.4 Activités
- Tâches
- Appels
- Emails
- Réunions
- Notes
- Rappels

### F3.5 Reporting Commercial
- Pipeline par étape
- Conversion rates
- Temps moyen cycle vente
- Performance commerciaux
- Forecast

## 3.3 Database Schema

```sql
-- Companies
CREATE TABLE companies (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  name TEXT NOT NULL,
  legal_name TEXT,
  registration_number TEXT, -- SIRET, etc
  vat_number TEXT,
  industry TEXT,
  website TEXT,
  phone TEXT,
  email TEXT,
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  postal_code TEXT,
  country TEXT,
  logo_url TEXT,
  notes TEXT,
  tags TEXT, -- JSON array
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Contacts
CREATE TABLE contacts (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  company_id TEXT REFERENCES companies(id),
  type TEXT DEFAULT 'contact', -- contact, lead
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  mobile TEXT,
  job_title TEXT,
  department TEXT,
  address_line1 TEXT,
  city TEXT,
  postal_code TEXT,
  country TEXT,
  source TEXT, -- website, referral, ads, etc
  status TEXT DEFAULT 'active', -- active, inactive, archived
  score INTEGER DEFAULT 0, -- lead score
  owner_id TEXT REFERENCES users(id),
  tags TEXT, -- JSON array
  custom_fields TEXT, -- JSON
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Pipeline Stages
CREATE TABLE pipeline_stages (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  name TEXT NOT NULL,
  probability INTEGER DEFAULT 0, -- 0-100%
  sort_order INTEGER NOT NULL,
  color TEXT,
  is_won INTEGER DEFAULT 0,
  is_lost INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL
);

-- Opportunities (Deals)
CREATE TABLE opportunities (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  name TEXT NOT NULL,
  company_id TEXT REFERENCES companies(id),
  contact_id TEXT REFERENCES contacts(id),
  stage_id TEXT NOT NULL REFERENCES pipeline_stages(id),
  amount REAL,
  currency TEXT DEFAULT 'EUR',
  probability INTEGER,
  expected_close_date INTEGER,
  actual_close_date INTEGER,
  source TEXT,
  owner_id TEXT REFERENCES users(id),
  description TEXT,
  won_reason TEXT,
  lost_reason TEXT,
  tags TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Quotes
CREATE TABLE quotes (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  number TEXT NOT NULL,
  opportunity_id TEXT REFERENCES opportunities(id),
  contact_id TEXT NOT NULL REFERENCES contacts(id),
  company_id TEXT REFERENCES companies(id),
  version INTEGER DEFAULT 1,
  status TEXT DEFAULT 'draft', -- draft, sent, accepted, rejected, expired
  valid_until INTEGER,
  subtotal REAL NOT NULL,
  discount_amount REAL DEFAULT 0,
  tax_amount REAL DEFAULT 0,
  total REAL NOT NULL,
  currency TEXT DEFAULT 'EUR',
  terms TEXT,
  notes TEXT,
  pdf_url TEXT,
  signed_at INTEGER,
  signature_url TEXT,
  invoice_id TEXT REFERENCES invoices(id),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(organization_id, number)
);

-- Quote Lines
CREATE TABLE quote_lines (
  id TEXT PRIMARY KEY,
  quote_id TEXT NOT NULL REFERENCES quotes(id),
  product_id TEXT REFERENCES products(id),
  description TEXT NOT NULL,
  quantity REAL NOT NULL,
  unit_price REAL NOT NULL,
  discount_percent REAL DEFAULT 0,
  tax_rate REAL DEFAULT 0,
  total REAL NOT NULL,
  sort_order INTEGER DEFAULT 0
);

-- Activities
CREATE TABLE activities (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  type TEXT NOT NULL, -- call, email, meeting, task, note
  subject TEXT NOT NULL,
  description TEXT,
  contact_id TEXT REFERENCES contacts(id),
  company_id TEXT REFERENCES companies(id),
  opportunity_id TEXT REFERENCES opportunities(id),
  owner_id TEXT REFERENCES users(id),
  due_date INTEGER,
  completed_at INTEGER,
  duration_minutes INTEGER,
  outcome TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Products/Services Catalog
CREATE TABLE products (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  sku TEXT,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT DEFAULT 'product', -- product, service
  unit_price REAL NOT NULL,
  cost_price REAL,
  tax_rate_id TEXT REFERENCES tax_rates(id),
  category TEXT,
  is_active INTEGER DEFAULT 1,
  created_at INTEGER NOT NULL,
  UNIQUE(organization_id, sku)
);
```

## 3.4 API Endpoints

### Contacts
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /contacts | Liste (pagination, filtres) |
| POST | /contacts | Créer |
| GET | /contacts/:id | Détails |
| PUT | /contacts/:id | Update |
| DELETE | /contacts/:id | Archiver |
| POST | /contacts/import | Import CSV |
| GET | /contacts/export | Export CSV |
| POST | /contacts/:id/convert | Lead → Contact |
| GET | /contacts/:id/activities | Historique activités |
| GET | /contacts/:id/opportunities | Opportunités liées |

### Companies
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /companies | Liste |
| POST | /companies | Créer |
| GET | /companies/:id | Détails |
| PUT | /companies/:id | Update |
| GET | /companies/:id/contacts | Contacts liés |

### Opportunities
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /opportunities | Liste (kanban data) |
| POST | /opportunities | Créer |
| GET | /opportunities/:id | Détails |
| PUT | /opportunities/:id | Update |
| DELETE | /opportunities/:id | Supprimer |
| PUT | /opportunities/:id/stage | Changer étape |
| POST | /opportunities/:id/won | Marquer gagné |
| POST | /opportunities/:id/lost | Marquer perdu |

### Quotes
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /quotes | Liste |
| POST | /quotes | Créer |
| GET | /quotes/:id | Détails |
| PUT | /quotes/:id | Update |
| POST | /quotes/:id/send | Envoyer |
| POST | /quotes/:id/pdf | Générer PDF |
| POST | /quotes/:id/duplicate | Nouvelle version |
| POST | /quotes/:id/convert | Convertir en facture |
| POST | /quotes/:id/accept | Accepter |
| POST | /quotes/:id/reject | Rejeter |

### Activities
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /activities | Liste |
| POST | /activities | Créer |
| PUT | /activities/:id | Update |
| POST | /activities/:id/complete | Marquer terminé |
| GET | /activities/upcoming | À venir |

### Products
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /products | Liste catalogue |
| POST | /products | Créer |
| PUT | /products/:id | Update |
| DELETE | /products/:id | Désactiver |

---

# MODULE 4: AI CORE

## 4.1 Overview

**Nom**: AI Core  
**Priorité**: P0 (Critique)  
**Phase**: 1 - MVP  
**Estimation**: 4 semaines  
**Dépendances**: Auth, Finance, CRM

**Description**: Cœur AI du système avec chat conversationnel, agents spécialisés, RAG et orchestration multi-agent.

## 4.2 Fonctionnalités

### F4.1 Chat Interface
- Chat multi-turn
- Streaming responses
- Attachments (images, PDF)
- Historique conversations
- Contexte par module

### F4.2 AI Agents
- Orchestrator Agent (routing)
- Finance Agent
- Sales Agent
- HR Agent
- Support Agent
- Custom Agents

### F4.3 RAG Pipeline
- Document ingestion
- Chunking intelligent
- Embeddings (BGE)
- Vector search (Vectorize)
- Context injection

### F4.4 Tools & Actions
- Database queries
- API calls
- Calculations
- Document generation
- Email drafting

### F4.5 Knowledge Base
- Documents upload
- Web scraping
- FAQ management
- Auto-indexing

## 4.3 Database Schema

```sql
-- Conversations
CREATE TABLE conversations (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  title TEXT,
  context TEXT, -- JSON: module, entity_id, etc
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Messages
CREATE TABLE messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES conversations(id),
  role TEXT NOT NULL, -- user, assistant, system, tool
  content TEXT NOT NULL,
  tool_calls TEXT, -- JSON
  tool_results TEXT, -- JSON
  tokens_used INTEGER,
  model TEXT,
  created_at INTEGER NOT NULL
);

-- Documents (for RAG)
CREATE TABLE documents (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- pdf, docx, txt, url
  source_url TEXT,
  storage_url TEXT, -- R2 URL
  size_bytes INTEGER,
  status TEXT DEFAULT 'pending', -- pending, processing, indexed, error
  chunk_count INTEGER DEFAULT 0,
  metadata TEXT, -- JSON
  created_at INTEGER NOT NULL,
  indexed_at INTEGER
);

-- Document Chunks (for vector search)
CREATE TABLE document_chunks (
  id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL REFERENCES documents(id),
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  token_count INTEGER,
  metadata TEXT, -- JSON: page, section, etc
  created_at INTEGER NOT NULL
);
-- Note: Embeddings stored in Vectorize, linked by chunk_id

-- Agent Configs
CREATE TABLE agent_configs (
  id TEXT PRIMARY KEY,
  organization_id TEXT REFERENCES organizations(id), -- NULL = system
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- orchestrator, domain, task, helper
  system_prompt TEXT NOT NULL,
  model TEXT DEFAULT 'llama-3.1-8b',
  temperature REAL DEFAULT 0.7,
  tools TEXT, -- JSON array of tool names
  is_active INTEGER DEFAULT 1,
  created_at INTEGER NOT NULL
);

-- Tool Definitions
CREATE TABLE tools (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  parameters TEXT NOT NULL, -- JSON Schema
  handler TEXT NOT NULL, -- function name
  requires_confirmation INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL
);

-- Agent Executions (for debugging/analytics)
CREATE TABLE agent_executions (
  id TEXT PRIMARY KEY,
  conversation_id TEXT REFERENCES conversations(id),
  agent_id TEXT REFERENCES agent_configs(id),
  input TEXT NOT NULL,
  output TEXT,
  tool_calls TEXT, -- JSON
  tokens_input INTEGER,
  tokens_output INTEGER,
  duration_ms INTEGER,
  status TEXT, -- success, error
  error TEXT,
  created_at INTEGER NOT NULL
);
```

## 4.4 API Endpoints

### Chat
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /chat | Send message (streaming) |
| GET | /chat/conversations | Liste conversations |
| GET | /chat/conversations/:id | Historique |
| DELETE | /chat/conversations/:id | Supprimer |
| POST | /chat/conversations/:id/title | Rename |

### Documents
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /documents | Liste documents |
| POST | /documents | Upload document |
| POST | /documents/url | Indexer URL |
| DELETE | /documents/:id | Supprimer |
| POST | /documents/:id/reindex | Réindexer |
| GET | /documents/:id/chunks | Voir chunks |

### Search
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /search | Recherche sémantique |
| POST | /search/hybrid | Recherche hybride |

### Agents (Admin)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /agents | Liste agents |
| POST | /agents | Créer agent |
| PUT | /agents/:id | Update |
| DELETE | /agents/:id | Supprimer |
| POST | /agents/:id/test | Tester agent |

## 4.5 Agent Architecture

```typescript
// Orchestrator decides which agent to use
const orchestrator = {
  name: 'orchestrator',
  systemPrompt: `You are the main orchestrator for Perfex ERP.
    Analyze user requests and route to the appropriate specialist agent.
    Available agents: finance, sales, hr, support.
    If uncertain, ask clarifying questions.`,
  tools: ['route_to_agent', 'search_knowledge', 'get_context']
};

// Domain agents handle specific areas
const financeAgent = {
  name: 'finance',
  systemPrompt: `You are a finance expert for Perfex ERP.
    You can help with invoices, payments, reports, and accounting.
    Always verify data before making changes.`,
  tools: ['get_invoices', 'create_invoice', 'get_balance', 'generate_report']
};
```

---

# MODULE 5: PURCHASES

## 5.1 Overview

**Nom**: Purchases & Procurement  
**Priorité**: P1  
**Phase**: 2 - Core  
**Estimation**: 3 semaines  
**Dépendances**: Auth, Finance, CRM (contacts)

## 5.2 Fonctionnalités

- Fournisseurs (suppliers)
- Demandes d'achat (PR)
- Bons de commande (PO)
- Réception marchandises
- Factures fournisseurs
- Gestion contrats
- Catalogue fournisseurs
- Approbation workflow

## 5.3 Database Schema (Tables clés)

```sql
-- Suppliers (extends contacts)
CREATE TABLE suppliers (
  id TEXT PRIMARY KEY,
  contact_id TEXT NOT NULL REFERENCES contacts(id),
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  supplier_code TEXT,
  payment_terms INTEGER DEFAULT 30,
  currency TEXT DEFAULT 'EUR',
  tax_id TEXT,
  bank_details TEXT, -- JSON
  rating INTEGER, -- 1-5
  notes TEXT,
  is_active INTEGER DEFAULT 1,
  created_at INTEGER NOT NULL
);

-- Purchase Requisitions
CREATE TABLE purchase_requisitions (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  number TEXT NOT NULL,
  requester_id TEXT NOT NULL REFERENCES users(id),
  status TEXT DEFAULT 'draft', -- draft, pending_approval, approved, rejected, ordered
  required_date INTEGER,
  notes TEXT,
  total REAL,
  approved_by TEXT REFERENCES users(id),
  approved_at INTEGER,
  created_at INTEGER NOT NULL
);

-- Purchase Orders
CREATE TABLE purchase_orders (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  number TEXT NOT NULL,
  supplier_id TEXT NOT NULL REFERENCES suppliers(id),
  requisition_id TEXT REFERENCES purchase_requisitions(id),
  status TEXT DEFAULT 'draft', -- draft, sent, confirmed, received, cancelled
  order_date INTEGER NOT NULL,
  expected_date INTEGER,
  subtotal REAL NOT NULL,
  tax_amount REAL DEFAULT 0,
  total REAL NOT NULL,
  currency TEXT DEFAULT 'EUR',
  shipping_address TEXT,
  notes TEXT,
  created_at INTEGER NOT NULL
);

-- Purchase Order Lines
CREATE TABLE purchase_order_lines (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES purchase_orders(id),
  product_id TEXT REFERENCES products(id),
  description TEXT NOT NULL,
  quantity REAL NOT NULL,
  unit_price REAL NOT NULL,
  tax_rate REAL DEFAULT 0,
  total REAL NOT NULL,
  received_quantity REAL DEFAULT 0
);

-- Goods Receipts
CREATE TABLE goods_receipts (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  number TEXT NOT NULL,
  purchase_order_id TEXT NOT NULL REFERENCES purchase_orders(id),
  receipt_date INTEGER NOT NULL,
  status TEXT DEFAULT 'draft', -- draft, confirmed
  notes TEXT,
  created_at INTEGER NOT NULL
);

-- Supplier Invoices
CREATE TABLE supplier_invoices (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  supplier_id TEXT NOT NULL REFERENCES suppliers(id),
  purchase_order_id TEXT REFERENCES purchase_orders(id),
  number TEXT NOT NULL, -- supplier's invoice number
  internal_number TEXT, -- our reference
  invoice_date INTEGER NOT NULL,
  due_date INTEGER NOT NULL,
  status TEXT DEFAULT 'draft', -- draft, pending, approved, paid
  subtotal REAL NOT NULL,
  tax_amount REAL DEFAULT 0,
  total REAL NOT NULL,
  amount_paid REAL DEFAULT 0,
  journal_entry_id TEXT REFERENCES journal_entries(id),
  created_at INTEGER NOT NULL
);
```

---

# MODULE 6: INVENTORY

## 6.1 Overview

**Nom**: Inventory & Warehouse  
**Priorité**: P1  
**Phase**: 2 - Core  
**Estimation**: 4 semaines  
**Dépendances**: Auth, Products, Purchases

## 6.2 Fonctionnalités

- Multi-entrepôts
- Emplacements (bins/locations)
- Stock en temps réel
- Mouvements stock
- Réservations
- Inventaires physiques
- Lots et séries
- FIFO/LIFO/FEFO
- Réapprovisionnement auto
- Alertes stock min/max

## 6.3 Database Schema (Tables clés)

```sql
-- Warehouses
CREATE TABLE warehouses (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  address TEXT,
  is_default INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at INTEGER NOT NULL
);

-- Locations (bins within warehouse)
CREATE TABLE locations (
  id TEXT PRIMARY KEY,
  warehouse_id TEXT NOT NULL REFERENCES warehouses(id),
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  type TEXT DEFAULT 'storage', -- storage, receiving, shipping, production
  is_active INTEGER DEFAULT 1
);

-- Stock Levels
CREATE TABLE stock_levels (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id),
  warehouse_id TEXT NOT NULL REFERENCES warehouses(id),
  location_id TEXT REFERENCES locations(id),
  quantity REAL NOT NULL DEFAULT 0,
  reserved_quantity REAL DEFAULT 0,
  available_quantity REAL GENERATED ALWAYS AS (quantity - reserved_quantity) VIRTUAL,
  min_quantity REAL,
  max_quantity REAL,
  reorder_point REAL,
  reorder_quantity REAL,
  last_counted_at INTEGER,
  updated_at INTEGER NOT NULL,
  UNIQUE(product_id, warehouse_id, location_id)
);

-- Stock Movements
CREATE TABLE stock_movements (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  product_id TEXT NOT NULL REFERENCES products(id),
  type TEXT NOT NULL, -- in, out, transfer, adjustment
  quantity REAL NOT NULL,
  from_warehouse_id TEXT REFERENCES warehouses(id),
  from_location_id TEXT REFERENCES locations(id),
  to_warehouse_id TEXT REFERENCES warehouses(id),
  to_location_id TEXT REFERENCES locations(id),
  reference_type TEXT, -- purchase_order, sales_order, adjustment, transfer
  reference_id TEXT,
  lot_number TEXT,
  serial_number TEXT,
  unit_cost REAL,
  notes TEXT,
  created_by TEXT REFERENCES users(id),
  created_at INTEGER NOT NULL
);

-- Inventory Counts
CREATE TABLE inventory_counts (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  warehouse_id TEXT NOT NULL REFERENCES warehouses(id),
  status TEXT DEFAULT 'draft', -- draft, in_progress, completed, cancelled
  count_date INTEGER NOT NULL,
  notes TEXT,
  created_by TEXT REFERENCES users(id),
  completed_at INTEGER,
  created_at INTEGER NOT NULL
);

-- Inventory Count Lines
CREATE TABLE inventory_count_lines (
  id TEXT PRIMARY KEY,
  count_id TEXT NOT NULL REFERENCES inventory_counts(id),
  product_id TEXT NOT NULL REFERENCES products(id),
  location_id TEXT REFERENCES locations(id),
  expected_quantity REAL NOT NULL,
  counted_quantity REAL,
  variance REAL GENERATED ALWAYS AS (counted_quantity - expected_quantity) VIRTUAL,
  notes TEXT
);

-- Lot/Batch Tracking
CREATE TABLE lots (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id),
  lot_number TEXT NOT NULL,
  expiry_date INTEGER,
  manufacturing_date INTEGER,
  supplier_lot TEXT,
  notes TEXT,
  created_at INTEGER NOT NULL,
  UNIQUE(product_id, lot_number)
);

-- Serial Numbers
CREATE TABLE serial_numbers (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id),
  serial_number TEXT NOT NULL,
  lot_id TEXT REFERENCES lots(id),
  status TEXT DEFAULT 'available', -- available, reserved, sold, returned
  warehouse_id TEXT REFERENCES warehouses(id),
  notes TEXT,
  created_at INTEGER NOT NULL,
  UNIQUE(product_id, serial_number)
);
```

---

# MODULE 7: PROJECTS

## 7.1 Overview

**Nom**: Projects & Services  
**Priorité**: P1  
**Phase**: 2 - Core  
**Estimation**: 3 semaines  
**Dépendances**: Auth, CRM, HR

## 7.2 Fonctionnalités

- Projets (CRUD)
- Tâches et sous-tâches
- Kanban board
- Gantt chart (data)
- Timesheet
- Budget projet
- Équipe projet
- Documents projet
- Jalons (milestones)
- Facturation projet

## 7.3 Database Schema (Tables clés)

```sql
-- Projects
CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  name TEXT NOT NULL,
  code TEXT,
  description TEXT,
  client_id TEXT REFERENCES companies(id),
  contact_id TEXT REFERENCES contacts(id),
  manager_id TEXT REFERENCES users(id),
  status TEXT DEFAULT 'planning', -- planning, active, on_hold, completed, cancelled
  priority TEXT DEFAULT 'medium', -- low, medium, high, urgent
  start_date INTEGER,
  end_date INTEGER,
  actual_start INTEGER,
  actual_end INTEGER,
  budget REAL,
  currency TEXT DEFAULT 'EUR',
  billing_type TEXT, -- fixed, hourly, milestone
  hourly_rate REAL,
  is_billable INTEGER DEFAULT 1,
  progress INTEGER DEFAULT 0, -- 0-100
  color TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Project Tasks
CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id),
  parent_id TEXT REFERENCES tasks(id), -- subtasks
  name TEXT NOT NULL,
  description TEXT,
  assignee_id TEXT REFERENCES users(id),
  status TEXT DEFAULT 'todo', -- todo, in_progress, review, done
  priority TEXT DEFAULT 'medium',
  start_date INTEGER,
  due_date INTEGER,
  estimated_hours REAL,
  actual_hours REAL DEFAULT 0,
  progress INTEGER DEFAULT 0,
  sort_order INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Task Dependencies
CREATE TABLE task_dependencies (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL REFERENCES tasks(id),
  depends_on_id TEXT NOT NULL REFERENCES tasks(id),
  type TEXT DEFAULT 'finish_to_start' -- finish_to_start, start_to_start, etc
);

-- Milestones
CREATE TABLE milestones (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id),
  name TEXT NOT NULL,
  due_date INTEGER NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, completed
  completed_at INTEGER,
  invoice_id TEXT REFERENCES invoices(id),
  amount REAL, -- billable amount
  created_at INTEGER NOT NULL
);

-- Time Entries
CREATE TABLE time_entries (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  project_id TEXT REFERENCES projects(id),
  task_id TEXT REFERENCES tasks(id),
  date INTEGER NOT NULL,
  hours REAL NOT NULL,
  description TEXT,
  is_billable INTEGER DEFAULT 1,
  is_billed INTEGER DEFAULT 0,
  invoice_id TEXT REFERENCES invoices(id),
  hourly_rate REAL,
  created_at INTEGER NOT NULL
);

-- Project Team
CREATE TABLE project_members (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  role TEXT DEFAULT 'member', -- manager, member, viewer
  hourly_rate REAL,
  joined_at INTEGER NOT NULL,
  UNIQUE(project_id, user_id)
);

-- Project Documents
CREATE TABLE project_documents (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id),
  name TEXT NOT NULL,
  file_url TEXT NOT NULL, -- R2
  file_type TEXT,
  file_size INTEGER,
  uploaded_by TEXT REFERENCES users(id),
  created_at INTEGER NOT NULL
);
```

---

# MODULE 8: HR

## 8.1 Overview

**Nom**: HR & Payroll  
**Priorité**: P1  
**Phase**: 2 - Core  
**Estimation**: 4 semaines  
**Dépendances**: Auth, Finance

## 8.2 Fonctionnalités

- Employés (fiches)
- Contrats de travail
- Départements et postes
- Absences et congés
- Paie (bulletins)
- Notes de frais
- Recrutement basique
- Évaluations
- Documents RH
- Organigramme

## 8.3 Database Schema (Tables clés)

```sql
-- Departments
CREATE TABLE departments (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  name TEXT NOT NULL,
  parent_id TEXT REFERENCES departments(id),
  manager_id TEXT REFERENCES employees(id),
  created_at INTEGER NOT NULL
);

-- Job Positions
CREATE TABLE job_positions (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  title TEXT NOT NULL,
  department_id TEXT REFERENCES departments(id),
  description TEXT,
  requirements TEXT,
  is_active INTEGER DEFAULT 1,
  created_at INTEGER NOT NULL
);

-- Employees
CREATE TABLE employees (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  user_id TEXT REFERENCES users(id), -- link to user account
  employee_number TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  mobile TEXT,
  date_of_birth INTEGER,
  gender TEXT,
  nationality TEXT,
  address TEXT,
  city TEXT,
  postal_code TEXT,
  country TEXT,
  department_id TEXT REFERENCES departments(id),
  position_id TEXT REFERENCES job_positions(id),
  manager_id TEXT REFERENCES employees(id),
  hire_date INTEGER NOT NULL,
  termination_date INTEGER,
  employment_type TEXT, -- full_time, part_time, contractor, intern
  status TEXT DEFAULT 'active', -- active, on_leave, terminated
  photo_url TEXT,
  emergency_contact TEXT, -- JSON
  bank_details TEXT, -- JSON (encrypted)
  social_security_number TEXT, -- encrypted
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(organization_id, employee_number)
);

-- Employment Contracts
CREATE TABLE contracts (
  id TEXT PRIMARY KEY,
  employee_id TEXT NOT NULL REFERENCES employees(id),
  type TEXT NOT NULL, -- cdi, cdd, interim, stage
  start_date INTEGER NOT NULL,
  end_date INTEGER,
  salary REAL NOT NULL,
  salary_type TEXT DEFAULT 'monthly', -- hourly, monthly, annual
  currency TEXT DEFAULT 'EUR',
  hours_per_week REAL DEFAULT 35,
  trial_period_end INTEGER,
  benefits TEXT, -- JSON
  document_url TEXT,
  status TEXT DEFAULT 'active', -- draft, active, ended
  created_at INTEGER NOT NULL
);

-- Leave Types
CREATE TABLE leave_types (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  days_per_year REAL,
  is_paid INTEGER DEFAULT 1,
  requires_approval INTEGER DEFAULT 1,
  color TEXT,
  created_at INTEGER NOT NULL
);

-- Leave Requests
CREATE TABLE leave_requests (
  id TEXT PRIMARY KEY,
  employee_id TEXT NOT NULL REFERENCES employees(id),
  leave_type_id TEXT NOT NULL REFERENCES leave_types(id),
  start_date INTEGER NOT NULL,
  end_date INTEGER NOT NULL,
  days REAL NOT NULL,
  reason TEXT,
  status TEXT DEFAULT 'pending', -- pending, approved, rejected, cancelled
  approved_by TEXT REFERENCES users(id),
  approved_at INTEGER,
  rejection_reason TEXT,
  created_at INTEGER NOT NULL
);

-- Leave Balances
CREATE TABLE leave_balances (
  id TEXT PRIMARY KEY,
  employee_id TEXT NOT NULL REFERENCES employees(id),
  leave_type_id TEXT NOT NULL REFERENCES leave_types(id),
  year INTEGER NOT NULL,
  allocated REAL NOT NULL,
  used REAL DEFAULT 0,
  remaining REAL GENERATED ALWAYS AS (allocated - used) VIRTUAL,
  UNIQUE(employee_id, leave_type_id, year)
);

-- Payslips
CREATE TABLE payslips (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  employee_id TEXT NOT NULL REFERENCES employees(id),
  period_start INTEGER NOT NULL,
  period_end INTEGER NOT NULL,
  gross_salary REAL NOT NULL,
  deductions TEXT NOT NULL, -- JSON array
  total_deductions REAL NOT NULL,
  net_salary REAL NOT NULL,
  status TEXT DEFAULT 'draft', -- draft, approved, paid
  payment_date INTEGER,
  payment_method TEXT,
  pdf_url TEXT,
  journal_entry_id TEXT REFERENCES journal_entries(id),
  created_at INTEGER NOT NULL,
  UNIQUE(employee_id, period_start)
);

-- Expense Reports
CREATE TABLE expense_reports (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  employee_id TEXT NOT NULL REFERENCES employees(id),
  number TEXT NOT NULL,
  status TEXT DEFAULT 'draft', -- draft, submitted, approved, rejected, paid
  total REAL NOT NULL,
  currency TEXT DEFAULT 'EUR',
  submitted_at INTEGER,
  approved_by TEXT REFERENCES users(id),
  approved_at INTEGER,
  paid_at INTEGER,
  created_at INTEGER NOT NULL
);

-- Expense Lines
CREATE TABLE expense_lines (
  id TEXT PRIMARY KEY,
  report_id TEXT NOT NULL REFERENCES expense_reports(id),
  date INTEGER NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  amount REAL NOT NULL,
  receipt_url TEXT,
  project_id TEXT REFERENCES projects(id)
);
```

---

# MODULE 9: MANUFACTURING

## 9.1 Overview

**Nom**: Manufacturing & Production  
**Priorité**: P2  
**Phase**: 3 - Advanced  
**Estimation**: 5 semaines  
**Dépendances**: Inventory, Purchases, Projects

## 9.2 Fonctionnalités

- Nomenclatures (BOM)
- Ordres de fabrication (MO)
- Gammes opératoires
- Postes de travail
- MRP (calcul besoins)
- Planification production
- Contrôle qualité
- Traçabilité production
- Coûts de revient

## 9.3 Database Schema (Tables clés)

```sql
-- Bill of Materials
CREATE TABLE boms (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  product_id TEXT NOT NULL REFERENCES products(id),
  name TEXT NOT NULL,
  version TEXT DEFAULT '1.0',
  status TEXT DEFAULT 'draft', -- draft, active, obsolete
  quantity REAL DEFAULT 1, -- produced quantity
  notes TEXT,
  created_at INTEGER NOT NULL
);

-- BOM Lines (components)
CREATE TABLE bom_lines (
  id TEXT PRIMARY KEY,
  bom_id TEXT NOT NULL REFERENCES boms(id),
  component_id TEXT NOT NULL REFERENCES products(id),
  quantity REAL NOT NULL,
  unit TEXT,
  scrap_rate REAL DEFAULT 0,
  notes TEXT
);

-- Work Centers
CREATE TABLE work_centers (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  type TEXT, -- machine, assembly, manual
  capacity REAL, -- units per hour
  cost_per_hour REAL,
  is_active INTEGER DEFAULT 1,
  created_at INTEGER NOT NULL
);

-- Routings (operations)
CREATE TABLE routings (
  id TEXT PRIMARY KEY,
  bom_id TEXT NOT NULL REFERENCES boms(id),
  sequence INTEGER NOT NULL,
  name TEXT NOT NULL,
  work_center_id TEXT REFERENCES work_centers(id),
  setup_time REAL DEFAULT 0, -- minutes
  run_time REAL NOT NULL, -- minutes per unit
  description TEXT
);

-- Manufacturing Orders
CREATE TABLE manufacturing_orders (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  number TEXT NOT NULL,
  product_id TEXT NOT NULL REFERENCES products(id),
  bom_id TEXT NOT NULL REFERENCES boms(id),
  quantity REAL NOT NULL,
  quantity_produced REAL DEFAULT 0,
  status TEXT DEFAULT 'draft', -- draft, confirmed, in_progress, done, cancelled
  priority TEXT DEFAULT 'normal',
  planned_start INTEGER,
  planned_end INTEGER,
  actual_start INTEGER,
  actual_end INTEGER,
  warehouse_id TEXT REFERENCES warehouses(id),
  notes TEXT,
  created_at INTEGER NOT NULL
);

-- MO Operations (work orders)
CREATE TABLE mo_operations (
  id TEXT PRIMARY KEY,
  mo_id TEXT NOT NULL REFERENCES manufacturing_orders(id),
  routing_id TEXT REFERENCES routings(id),
  sequence INTEGER NOT NULL,
  name TEXT NOT NULL,
  work_center_id TEXT REFERENCES work_centers(id),
  status TEXT DEFAULT 'pending', -- pending, in_progress, done
  planned_hours REAL,
  actual_hours REAL DEFAULT 0,
  started_at INTEGER,
  finished_at INTEGER
);

-- Quality Checks
CREATE TABLE quality_checks (
  id TEXT PRIMARY KEY,
  mo_id TEXT NOT NULL REFERENCES manufacturing_orders(id),
  operation_id TEXT REFERENCES mo_operations(id),
  type TEXT NOT NULL, -- visual, measurement, test
  name TEXT NOT NULL,
  criteria TEXT,
  result TEXT, -- pass, fail, warning
  measured_value TEXT,
  checked_by TEXT REFERENCES users(id),
  checked_at INTEGER,
  notes TEXT
);
```

---

# MODULE 10: E-COMMERCE

## 10.1 Overview

**Nom**: E-commerce & POS  
**Priorité**: P2  
**Phase**: 3 - Advanced  
**Estimation**: 5 semaines  
**Dépendances**: Products, Inventory, Finance, CRM

## 10.2 Fonctionnalités

- Boutique en ligne
- Catalogue produits
- Panier & checkout
- Paiements (Stripe)
- Gestion commandes
- Livraison & tracking
- POS (Point of Sale)
- Promotions & coupons
- Multi-devises
- Avis clients

## 10.3 Database Schema (Tables clés)

```sql
-- E-commerce Settings
CREATE TABLE ecommerce_settings (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  store_name TEXT NOT NULL,
  store_url TEXT,
  currency TEXT DEFAULT 'EUR',
  tax_included INTEGER DEFAULT 1,
  shipping_methods TEXT, -- JSON
  payment_methods TEXT, -- JSON
  stripe_account_id TEXT,
  created_at INTEGER NOT NULL
);

-- Product Categories
CREATE TABLE product_categories (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  parent_id TEXT REFERENCES product_categories(id),
  description TEXT,
  image_url TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  UNIQUE(organization_id, slug)
);

-- Product Variants
CREATE TABLE product_variants (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id),
  sku TEXT NOT NULL,
  name TEXT, -- e.g., "Red, Large"
  price REAL NOT NULL,
  compare_at_price REAL, -- original price for sales
  cost REAL,
  weight REAL,
  dimensions TEXT, -- JSON
  options TEXT, -- JSON: {color: 'red', size: 'L'}
  image_url TEXT,
  is_active INTEGER DEFAULT 1,
  created_at INTEGER NOT NULL
);

-- Product Images
CREATE TABLE product_images (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id),
  url TEXT NOT NULL,
  alt_text TEXT,
  sort_order INTEGER DEFAULT 0
);

-- Shopping Carts
CREATE TABLE carts (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  customer_id TEXT REFERENCES contacts(id),
  session_id TEXT, -- for anonymous carts
  currency TEXT DEFAULT 'EUR',
  subtotal REAL DEFAULT 0,
  tax_amount REAL DEFAULT 0,
  shipping_amount REAL DEFAULT 0,
  discount_amount REAL DEFAULT 0,
  total REAL DEFAULT 0,
  coupon_code TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  expires_at INTEGER
);

-- Cart Items
CREATE TABLE cart_items (
  id TEXT PRIMARY KEY,
  cart_id TEXT NOT NULL REFERENCES carts(id),
  product_id TEXT NOT NULL REFERENCES products(id),
  variant_id TEXT REFERENCES product_variants(id),
  quantity INTEGER NOT NULL,
  unit_price REAL NOT NULL,
  total REAL NOT NULL,
  created_at INTEGER NOT NULL
);

-- Orders
CREATE TABLE orders (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  number TEXT NOT NULL,
  customer_id TEXT REFERENCES contacts(id),
  email TEXT NOT NULL,
  phone TEXT,
  status TEXT DEFAULT 'pending', -- pending, confirmed, processing, shipped, delivered, cancelled, refunded
  payment_status TEXT DEFAULT 'pending', -- pending, paid, failed, refunded
  fulfillment_status TEXT DEFAULT 'unfulfilled', -- unfulfilled, partial, fulfilled
  subtotal REAL NOT NULL,
  tax_amount REAL DEFAULT 0,
  shipping_amount REAL DEFAULT 0,
  discount_amount REAL DEFAULT 0,
  total REAL NOT NULL,
  currency TEXT DEFAULT 'EUR',
  shipping_address TEXT, -- JSON
  billing_address TEXT, -- JSON
  shipping_method TEXT,
  tracking_number TEXT,
  notes TEXT,
  customer_notes TEXT,
  coupon_code TEXT,
  stripe_payment_intent TEXT,
  invoice_id TEXT REFERENCES invoices(id),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(organization_id, number)
);

-- Order Items
CREATE TABLE order_items (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id),
  product_id TEXT NOT NULL REFERENCES products(id),
  variant_id TEXT REFERENCES product_variants(id),
  name TEXT NOT NULL,
  sku TEXT,
  quantity INTEGER NOT NULL,
  unit_price REAL NOT NULL,
  tax_rate REAL DEFAULT 0,
  total REAL NOT NULL,
  fulfilled_quantity INTEGER DEFAULT 0
);

-- Coupons
CREATE TABLE coupons (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  code TEXT NOT NULL,
  type TEXT NOT NULL, -- percentage, fixed_amount, free_shipping
  value REAL NOT NULL,
  min_order_amount REAL,
  max_uses INTEGER,
  uses_count INTEGER DEFAULT 0,
  per_customer_limit INTEGER,
  start_date INTEGER,
  end_date INTEGER,
  is_active INTEGER DEFAULT 1,
  created_at INTEGER NOT NULL,
  UNIQUE(organization_id, code)
);

-- POS Sessions
CREATE TABLE pos_sessions (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  register_name TEXT,
  opening_balance REAL NOT NULL,
  closing_balance REAL,
  status TEXT DEFAULT 'open', -- open, closed
  opened_at INTEGER NOT NULL,
  closed_at INTEGER
);

-- POS Transactions
CREATE TABLE pos_transactions (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES pos_sessions(id),
  order_id TEXT REFERENCES orders(id),
  type TEXT NOT NULL, -- sale, refund, cash_in, cash_out
  amount REAL NOT NULL,
  payment_method TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
```

---

# MODULE 11: ANALYTICS

## 11.1 Overview

**Nom**: Analytics & BI  
**Priorité**: P2  
**Phase**: 3 - Advanced  
**Estimation**: 4 semaines  
**Dépendances**: Tous modules

## 11.2 Fonctionnalités

- Dashboards personnalisés
- KPIs temps réel
- Rapports automatiques
- Visualisations (charts)
- Export données
- Alertes seuils
- Comparaisons périodes
- Drill-down

## 11.3 Database Schema (Tables clés)

```sql
-- Dashboards
CREATE TABLE dashboards (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  name TEXT NOT NULL,
  description TEXT,
  is_default INTEGER DEFAULT 0,
  layout TEXT, -- JSON: widget positions
  filters TEXT, -- JSON: default filters
  owner_id TEXT REFERENCES users(id),
  is_public INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Dashboard Widgets
CREATE TABLE dashboard_widgets (
  id TEXT PRIMARY KEY,
  dashboard_id TEXT NOT NULL REFERENCES dashboards(id),
  type TEXT NOT NULL, -- kpi, chart, table, gauge
  title TEXT NOT NULL,
  config TEXT NOT NULL, -- JSON: query, visualization config
  position TEXT NOT NULL, -- JSON: x, y, width, height
  refresh_interval INTEGER, -- seconds
  created_at INTEGER NOT NULL
);

-- Saved Reports
CREATE TABLE saved_reports (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  name TEXT NOT NULL,
  module TEXT NOT NULL, -- finance, crm, inventory, etc
  type TEXT NOT NULL, -- predefined type or custom
  config TEXT NOT NULL, -- JSON: filters, columns, grouping
  schedule TEXT, -- JSON: cron expression, recipients
  last_run_at INTEGER,
  owner_id TEXT REFERENCES users(id),
  is_public INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL
);

-- Report Exports
CREATE TABLE report_exports (
  id TEXT PRIMARY KEY,
  report_id TEXT REFERENCES saved_reports(id),
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  format TEXT NOT NULL, -- pdf, excel, csv
  file_url TEXT NOT NULL, -- R2
  generated_by TEXT REFERENCES users(id),
  created_at INTEGER NOT NULL,
  expires_at INTEGER
);

-- KPI Definitions
CREATE TABLE kpi_definitions (
  id TEXT PRIMARY KEY,
  organization_id TEXT REFERENCES organizations(id), -- NULL = system
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  description TEXT,
  category TEXT, -- finance, sales, operations, hr
  formula TEXT NOT NULL, -- calculation logic
  unit TEXT, -- currency, percentage, number
  target_value REAL,
  warning_threshold REAL,
  critical_threshold REAL,
  is_active INTEGER DEFAULT 1,
  created_at INTEGER NOT NULL
);

-- KPI Values (cached)
CREATE TABLE kpi_values (
  id TEXT PRIMARY KEY,
  kpi_id TEXT NOT NULL REFERENCES kpi_definitions(id),
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  period_type TEXT NOT NULL, -- daily, weekly, monthly, yearly
  period_start INTEGER NOT NULL,
  value REAL NOT NULL,
  previous_value REAL,
  change_percent REAL,
  calculated_at INTEGER NOT NULL,
  UNIQUE(kpi_id, organization_id, period_type, period_start)
);

-- Alerts
CREATE TABLE alerts (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  kpi_id TEXT REFERENCES kpi_definitions(id),
  name TEXT NOT NULL,
  condition TEXT NOT NULL, -- JSON: operator, threshold
  severity TEXT DEFAULT 'warning', -- info, warning, critical
  recipients TEXT, -- JSON: user_ids, emails
  is_active INTEGER DEFAULT 1,
  last_triggered_at INTEGER,
  created_at INTEGER NOT NULL
);

-- Alert History
CREATE TABLE alert_history (
  id TEXT PRIMARY KEY,
  alert_id TEXT NOT NULL REFERENCES alerts(id),
  triggered_at INTEGER NOT NULL,
  value REAL NOT NULL,
  message TEXT,
  acknowledged_by TEXT REFERENCES users(id),
  acknowledged_at INTEGER
);
```

---

# MODULE 12: ADVANCED AI

## 12.1 Overview

**Nom**: Advanced AI & Automation  
**Priorité**: P2  
**Phase**: 3 - Advanced  
**Estimation**: 5 semaines  
**Dépendances**: AI Core, Analytics, Tous modules

## 12.2 Fonctionnalités

- Prédictions ventes
- Détection anomalies
- Optimisation prix
- Prévision trésorerie
- Automatisations workflows
- Recommandations intelligentes
- Natural Language Queries
- Auto-catégorisation

## 12.3 Database Schema (Tables clés)

```sql
-- ML Models
CREATE TABLE ml_models (
  id TEXT PRIMARY KEY,
  organization_id TEXT REFERENCES organizations(id),
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- forecast, classification, anomaly, recommendation
  target TEXT NOT NULL, -- what it predicts
  features TEXT NOT NULL, -- JSON: input features
  model_config TEXT, -- JSON: hyperparameters
  status TEXT DEFAULT 'training', -- training, ready, failed, deprecated
  accuracy REAL,
  last_trained_at INTEGER,
  training_data_count INTEGER,
  created_at INTEGER NOT NULL
);

-- Predictions
CREATE TABLE predictions (
  id TEXT PRIMARY KEY,
  model_id TEXT NOT NULL REFERENCES ml_models(id),
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  prediction_date INTEGER NOT NULL,
  target_date INTEGER NOT NULL,
  predicted_value REAL NOT NULL,
  confidence REAL,
  actual_value REAL, -- filled later for accuracy tracking
  context TEXT, -- JSON: related entity info
  created_at INTEGER NOT NULL
);

-- Anomalies
CREATE TABLE anomalies (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  type TEXT NOT NULL, -- expense, revenue, inventory, pattern
  severity TEXT DEFAULT 'medium', -- low, medium, high, critical
  entity_type TEXT, -- invoice, transaction, order
  entity_id TEXT,
  description TEXT NOT NULL,
  expected_value REAL,
  actual_value REAL,
  deviation_percent REAL,
  status TEXT DEFAULT 'new', -- new, investigating, resolved, false_positive
  resolved_by TEXT REFERENCES users(id),
  resolved_at INTEGER,
  detected_at INTEGER NOT NULL
);

-- Automation Rules
CREATE TABLE automation_rules (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  name TEXT NOT NULL,
  description TEXT,
  trigger_type TEXT NOT NULL, -- event, schedule, condition
  trigger_config TEXT NOT NULL, -- JSON
  conditions TEXT, -- JSON: additional conditions
  actions TEXT NOT NULL, -- JSON: array of actions
  is_active INTEGER DEFAULT 1,
  last_triggered_at INTEGER,
  trigger_count INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL
);

-- Automation Executions
CREATE TABLE automation_executions (
  id TEXT PRIMARY KEY,
  rule_id TEXT NOT NULL REFERENCES automation_rules(id),
  trigger_data TEXT, -- JSON: what triggered it
  actions_executed TEXT, -- JSON: results
  status TEXT NOT NULL, -- success, partial, failed
  error_message TEXT,
  duration_ms INTEGER,
  executed_at INTEGER NOT NULL
);

-- Recommendations
CREATE TABLE recommendations (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  type TEXT NOT NULL, -- product, action, optimization
  target_entity TEXT, -- customer, product, process
  target_id TEXT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  expected_impact TEXT, -- JSON: metrics improvement
  confidence REAL,
  status TEXT DEFAULT 'pending', -- pending, accepted, rejected, expired
  accepted_by TEXT REFERENCES users(id),
  accepted_at INTEGER,
  expires_at INTEGER,
  created_at INTEGER NOT NULL
);

-- NLQ (Natural Language Queries)
CREATE TABLE nlq_queries (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  query TEXT NOT NULL,
  interpreted_as TEXT, -- JSON: parsed intent
  generated_sql TEXT,
  results_summary TEXT,
  execution_time_ms INTEGER,
  was_helpful INTEGER, -- user feedback
  created_at INTEGER NOT NULL
);
```

---

# RÉSUMÉ DES MODULES

| # | Module | Tables | Endpoints | Estimation |
|---|--------|--------|-----------|------------|
| 1 | Auth | 6 | ~25 | 2 sem |
| 2 | Finance | 12 | ~40 | 4 sem |
| 3 | CRM | 8 | ~35 | 3 sem |
| 4 | AI Core | 7 | ~15 | 4 sem |
| 5 | Purchases | 6 | ~25 | 3 sem |
| 6 | Inventory | 8 | ~30 | 4 sem |
| 7 | Projects | 7 | ~30 | 3 sem |
| 8 | HR | 10 | ~35 | 4 sem |
| 9 | Manufacturing | 7 | ~25 | 5 sem |
| 10 | E-commerce | 12 | ~40 | 5 sem |
| 11 | Analytics | 7 | ~20 | 4 sem |
| 12 | Advanced AI | 6 | ~15 | 5 sem |
| **TOTAL** | | **~96** | **~335** | **~46 sem** |

---

**Status**: ✅ Specifications Complete  
**Next**: speckit.plan
