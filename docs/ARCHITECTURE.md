# Architecture Technique Perfex ERP

> Documentation technique detaillee de l'architecture du systeme.

## Table des Matieres

1. [Vue d'Ensemble](#vue-densemble)
2. [Stack Technologique](#stack-technologique)
3. [Architecture Monorepo](#architecture-monorepo)
4. [Backend (API)](#backend-api)
5. [Frontend (Web)](#frontend-web)
6. [Base de Donnees](#base-de-donnees)
7. [Authentification & Securite](#authentification--securite)
8. [Patterns et Conventions](#patterns-et-conventions)
9. [Performance](#performance)
10. [Scalabilite](#scalabilite)

---

## Vue d'Ensemble

### Diagramme d'Architecture

```
                    ┌─────────────────────────────────────────────────────────┐
                    │                   Cloudflare Edge                        │
                    │              (300+ locations worldwide)                  │
                    └─────────────────────────┬───────────────────────────────┘
                                              │
                           ┌──────────────────┼──────────────────┐
                           │                  │                  │
                    ┌──────▼──────┐    ┌──────▼──────┐    ┌──────▼──────┐
                    │  CDN/Pages  │    │   Workers   │    │   Workers   │
                    │  (Static)   │    │   (API)     │    │   (Cron)    │
                    │   React     │    │   Hono.js   │    │  Scheduled  │
                    └─────────────┘    └──────┬──────┘    └─────────────┘
                                              │
                    ┌─────────────────────────┼─────────────────────────┐
                    │                         │                         │
             ┌──────▼──────┐          ┌───────▼───────┐         ┌───────▼───────┐
             │     D1      │          │      KV       │         │      R2       │
             │  (SQLite)   │          │   (Session)   │         │   (Storage)   │
             │  Database   │          │    Cache      │         │    Files      │
             └─────────────┘          └───────────────┘         └───────────────┘
```

### Flux de Requetes

```
Client (Browser/Mobile)
         │
         ▼
┌─────────────────┐
│  Cloudflare CDN │ ◄── Static assets (JS, CSS, images)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  React SPA      │ ◄── Single Page Application
│  (perfex-web)   │
└────────┬────────┘
         │ API Calls (REST)
         ▼
┌─────────────────┐
│  Cloudflare     │
│  Workers        │
│  (perfex-api)   │
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌───────┐ ┌───────┐
│  D1   │ │  KV   │
│  DB   │ │ Cache │
└───────┘ └───────┘
```

---

## Stack Technologique

### Frontend

| Technologie | Version | Utilisation |
|------------|---------|-------------|
| React | 18.3 | UI Framework |
| TypeScript | 5.7 | Typage statique |
| Vite | 6.0 | Build tool |
| TanStack Query | 5.x | Server state management |
| Zustand | 5.x | Client state management |
| React Hook Form | 7.x | Forms |
| Zod | 3.x | Validation |
| TailwindCSS | 3.4 | Styling |
| React Router | 7.x | Routing |
| Axios | 1.x | HTTP Client |
| Lucide React | - | Icons |

### Backend

| Technologie | Version | Utilisation |
|------------|---------|-------------|
| Cloudflare Workers | - | Runtime serverless |
| Hono.js | 4.6 | Web framework |
| Drizzle ORM | 0.37 | Database ORM |
| Cloudflare D1 | - | SQLite Database |
| Cloudflare KV | - | Key-Value Store |
| bcryptjs | 2.4 | Password hashing |
| jsonwebtoken | 9.0 | JWT tokens |
| Zod | 3.x | Validation |

### Infrastructure

| Service | Utilisation |
|---------|-------------|
| Cloudflare Workers | Compute (API) |
| Cloudflare Pages | Frontend hosting |
| Cloudflare D1 | SQLite Database |
| Cloudflare KV | Sessions & Cache |
| Cloudflare R2 | File storage (optionnel) |
| Cloudflare AI | LLM integration |

### Outils de Developpement

| Outil | Utilisation |
|-------|-------------|
| pnpm | Package manager |
| Turborepo | Monorepo orchestration |
| ESLint | Linting |
| Prettier | Code formatting |
| Vitest | Unit testing |
| Wrangler | Cloudflare CLI |

---

## Architecture Monorepo

### Structure des Packages

```
perfex/
├── apps/
│   ├── web/                          # Frontend React
│   │   ├── src/
│   │   │   ├── components/           # Composants reutilisables
│   │   │   │   ├── layouts/          # Layouts (DashboardLayout)
│   │   │   │   ├── forms/            # Composants de formulaires
│   │   │   │   └── ui/               # Composants UI de base
│   │   │   ├── pages/                # Pages par module
│   │   │   │   ├── auth/             # Login, Register
│   │   │   │   ├── finance/          # Comptabilite
│   │   │   │   ├── crm/              # CRM
│   │   │   │   ├── hr/               # RH
│   │   │   │   ├── inventory/        # Inventaire
│   │   │   │   ├── manufacturing/    # Production
│   │   │   │   ├── projects/         # Projets
│   │   │   │   ├── procurement/      # Achats
│   │   │   │   ├── sales/            # Ventes
│   │   │   │   ├── assets/           # Actifs
│   │   │   │   ├── workflows/        # Workflows
│   │   │   │   ├── ai/               # Intelligence Artificielle
│   │   │   │   ├── audit/            # Smart Audit
│   │   │   │   ├── recipes/          # Recettes
│   │   │   │   ├── payroll/          # Paie
│   │   │   │   ├── settings/         # Parametres
│   │   │   │   └── help/             # Aide
│   │   │   ├── hooks/                # Custom React hooks
│   │   │   ├── lib/                  # Utilitaires
│   │   │   │   ├── api.ts            # Client API Axios
│   │   │   │   └── utils.ts          # Fonctions utilitaires
│   │   │   ├── stores/               # Zustand stores
│   │   │   ├── contexts/             # React Contexts
│   │   │   │   ├── LanguageContext   # i18n
│   │   │   │   └── ThemeContext      # Theming
│   │   │   ├── config/               # Configuration
│   │   │   │   └── industryPresets   # Presets par industrie
│   │   │   ├── App.tsx               # Root component
│   │   │   └── main.tsx              # Entry point
│   │   ├── public/                   # Static assets
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   ├── tailwind.config.js
│   │   └── package.json
│   │
│   └── workers/
│       └── api/                      # Backend API
│           ├── src/
│           │   ├── index.ts          # Entry point Hono
│           │   ├── routes/           # Route handlers (33 fichiers)
│           │   │   ├── auth.ts       # Authentification
│           │   │   ├── accounts.ts   # Plan comptable
│           │   │   ├── invoices.ts   # Factures
│           │   │   ├── companies.ts  # Entreprises
│           │   │   └── ...           # Autres routes
│           │   ├── services/         # Business logic (29 fichiers)
│           │   │   ├── auth.service.ts
│           │   │   ├── invoice.service.ts
│           │   │   └── ...
│           │   ├── middleware/       # Middleware
│           │   │   ├── auth.ts       # JWT verification
│           │   │   ├── rbac.ts       # Role-based access
│           │   │   └── cors.ts       # CORS handling
│           │   ├── db.ts             # Database connection
│           │   ├── types.ts          # TypeScript types
│           │   └── utils/            # Utilitaires
│           ├── wrangler.toml         # Cloudflare config
│           └── package.json
│
├── packages/
│   ├── database/                     # Schema & Migrations
│   │   ├── src/
│   │   │   └── schema/               # Drizzle schemas (21 fichiers)
│   │   │       ├── index.ts          # Export all schemas
│   │   │       ├── users.ts          # Users, Organizations
│   │   │       ├── finance.ts        # Accounting
│   │   │       └── ...               # Autres schemas
│   │   ├── migrations/               # SQL migrations (17 fichiers)
│   │   ├── drizzle.config.ts
│   │   └── package.json
│   │
│   ├── shared/                       # Types & Validators partages
│   │   ├── src/
│   │   │   ├── types/                # TypeScript interfaces
│   │   │   │   ├── auth.ts
│   │   │   │   ├── finance.ts
│   │   │   │   └── ...
│   │   │   └── validators/           # Zod schemas
│   │   │       ├── auth.ts
│   │   │       ├── finance.ts
│   │   │       └── ...
│   │   └── package.json
│   │
│   ├── ai-core/                      # AI Integration
│   │   ├── client.ts                 # LLM client
│   │   ├── prompts.ts                # System prompts
│   │   └── types.ts
│   │
│   └── integrations/                 # External integrations
│       └── src/
│           └── providers/            # Payment, SMS, etc.
│
├── docs/                             # Documentation
│   ├── DEPLOYMENT.md
│   ├── DATABASE.md
│   └── ARCHITECTURE.md
│
├── pnpm-workspace.yaml               # Monorepo config
├── turbo.json                        # Turborepo config
├── package.json                      # Root package
└── README.md
```

### Configuration pnpm Workspaces

```yaml
# pnpm-workspace.yaml
packages:
  - 'apps/*'
  - 'apps/workers/*'
  - 'packages/*'
```

### Configuration Turborepo

```json
// turbo.json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {},
    "type-check": {
      "dependsOn": ["^build"]
    }
  }
}
```

---

## Backend (API)

### Structure de l'API Hono.js

```typescript
// apps/workers/api/src/index.ts
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { authMiddleware } from './middleware/auth';
import { rbacMiddleware } from './middleware/rbac';

// Import routes
import { authRoutes } from './routes/auth';
import { accountRoutes } from './routes/accounts';
import { invoiceRoutes } from './routes/invoices';
// ... autres routes

const app = new Hono<{ Bindings: Env }>();

// Global middleware
app.use('*', cors({
  origin: (origin) => origin,
  credentials: true,
}));

// Health check
app.get('/', (c) => c.json({ status: 'ok' }));
app.get('/api/v1/health', (c) => c.json({ status: 'healthy' }));

// Public routes
app.route('/api/v1/auth', authRoutes);

// Protected routes
app.use('/api/v1/*', authMiddleware);
app.route('/api/v1/accounts', accountRoutes);
app.route('/api/v1/invoices', invoiceRoutes);
// ... autres routes

// Error handler
app.onError((err, c) => {
  console.error('Error:', err);
  return c.json({ error: 'Internal Server Error' }, 500);
});

export default app;
```

### Pattern Service

```typescript
// apps/workers/api/src/services/invoice.service.ts
import { eq, and, desc } from 'drizzle-orm';
import { invoices, invoiceLines } from '@perfex/database';

export class InvoiceService {
  constructor(private db: D1Database) {}

  async findAll(organizationId: string, options?: {
    status?: string;
    limit?: number;
    offset?: number;
  }) {
    const conditions = [eq(invoices.organizationId, organizationId)];

    if (options?.status) {
      conditions.push(eq(invoices.status, options.status));
    }

    return this.db
      .select()
      .from(invoices)
      .where(and(...conditions))
      .orderBy(desc(invoices.createdAt))
      .limit(options?.limit || 50)
      .offset(options?.offset || 0);
  }

  async findById(organizationId: string, id: string) {
    const [invoice] = await this.db
      .select()
      .from(invoices)
      .where(and(
        eq(invoices.organizationId, organizationId),
        eq(invoices.id, id)
      ))
      .limit(1);

    if (!invoice) return null;

    const lines = await this.db
      .select()
      .from(invoiceLines)
      .where(eq(invoiceLines.invoiceId, id));

    return { ...invoice, lines };
  }

  async create(organizationId: string, data: CreateInvoiceDto) {
    const id = crypto.randomUUID();
    const invoiceNumber = await this.generateInvoiceNumber(organizationId);

    await this.db.insert(invoices).values({
      id,
      organizationId,
      invoiceNumber,
      ...data,
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return this.findById(organizationId, id);
  }

  async update(organizationId: string, id: string, data: UpdateInvoiceDto) {
    await this.db
      .update(invoices)
      .set({ ...data, updatedAt: new Date() })
      .where(and(
        eq(invoices.organizationId, organizationId),
        eq(invoices.id, id)
      ));

    return this.findById(organizationId, id);
  }

  async delete(organizationId: string, id: string) {
    await this.db
      .delete(invoices)
      .where(and(
        eq(invoices.organizationId, organizationId),
        eq(invoices.id, id)
      ));
  }

  private async generateInvoiceNumber(organizationId: string): Promise<string> {
    const year = new Date().getFullYear();
    const [result] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(invoices)
      .where(eq(invoices.organizationId, organizationId));

    const sequence = (result?.count || 0) + 1;
    return `INV-${year}-${String(sequence).padStart(5, '0')}`;
  }
}
```

### Pattern Route Handler

```typescript
// apps/workers/api/src/routes/invoices.ts
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { createInvoiceSchema, updateInvoiceSchema } from '@perfex/shared';
import { InvoiceService } from '../services/invoice.service';
import { requirePermission } from '../middleware/rbac';

export const invoiceRoutes = new Hono<{ Bindings: Env }>();

// GET /api/v1/invoices
invoiceRoutes.get('/', requirePermission('invoices:read'), async (c) => {
  const organizationId = c.get('organizationId');
  const { status, limit, offset } = c.req.query();

  const service = new InvoiceService(c.env.DB);
  const invoices = await service.findAll(organizationId, {
    status,
    limit: limit ? parseInt(limit) : undefined,
    offset: offset ? parseInt(offset) : undefined,
  });

  return c.json(invoices);
});

// GET /api/v1/invoices/:id
invoiceRoutes.get('/:id', requirePermission('invoices:read'), async (c) => {
  const organizationId = c.get('organizationId');
  const id = c.req.param('id');

  const service = new InvoiceService(c.env.DB);
  const invoice = await service.findById(organizationId, id);

  if (!invoice) {
    return c.json({ error: 'Invoice not found' }, 404);
  }

  return c.json(invoice);
});

// POST /api/v1/invoices
invoiceRoutes.post(
  '/',
  requirePermission('invoices:create'),
  zValidator('json', createInvoiceSchema),
  async (c) => {
    const organizationId = c.get('organizationId');
    const data = c.req.valid('json');

    const service = new InvoiceService(c.env.DB);
    const invoice = await service.create(organizationId, data);

    return c.json(invoice, 201);
  }
);

// PUT /api/v1/invoices/:id
invoiceRoutes.put(
  '/:id',
  requirePermission('invoices:update'),
  zValidator('json', updateInvoiceSchema),
  async (c) => {
    const organizationId = c.get('organizationId');
    const id = c.req.param('id');
    const data = c.req.valid('json');

    const service = new InvoiceService(c.env.DB);
    const invoice = await service.update(organizationId, id, data);

    return c.json(invoice);
  }
);

// DELETE /api/v1/invoices/:id
invoiceRoutes.delete('/:id', requirePermission('invoices:delete'), async (c) => {
  const organizationId = c.get('organizationId');
  const id = c.req.param('id');

  const service = new InvoiceService(c.env.DB);
  await service.delete(organizationId, id);

  return c.json({ success: true });
});
```

### Middleware d'Authentification

```typescript
// apps/workers/api/src/middleware/auth.ts
import { Context, Next } from 'hono';
import * as jwt from 'jsonwebtoken';

export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization');

  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, c.env.JWT_ACCESS_SECRET) as {
      sub: string;
      email: string;
      type: string;
    };

    if (decoded.type !== 'access') {
      return c.json({ error: 'Invalid token type' }, 401);
    }

    // Set user context
    c.set('userId', decoded.sub);
    c.set('userEmail', decoded.email);

    // Get organization from header or user's default
    const organizationId = c.req.header('x-organization-id');
    c.set('organizationId', organizationId);

    await next();
  } catch (error) {
    return c.json({ error: 'Invalid token' }, 401);
  }
}
```

### Middleware RBAC

```typescript
// apps/workers/api/src/middleware/rbac.ts
import { Context, Next } from 'hono';

export function requirePermission(permission: string) {
  return async (c: Context, next: Next) => {
    const userId = c.get('userId');
    const organizationId = c.get('organizationId');

    // Get user roles and permissions from database
    const userPermissions = await getUserPermissions(c.env.DB, userId, organizationId);

    if (!userPermissions.includes(permission) && !userPermissions.includes('*')) {
      return c.json({ error: 'Forbidden' }, 403);
    }

    await next();
  };
}

async function getUserPermissions(
  db: D1Database,
  userId: string,
  organizationId: string
): Promise<string[]> {
  // Query user roles and aggregate permissions
  // Implementation depends on your RBAC model
  return ['*']; // Temporary: grant all permissions
}
```

---

## Frontend (Web)

### Structure des Pages

```typescript
// apps/web/src/pages/finance/InvoicesPage.tsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Filter } from 'lucide-react';
import { api } from '@/lib/api';
import { Invoice } from '@perfex/shared';
import { InvoiceModal } from '@/components/InvoiceModal';
import { Pagination } from '@/components/Pagination';
import { EmptyState } from '@/components/EmptyState';

export function InvoicesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [showModal, setShowModal] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);

  const queryClient = useQueryClient();

  // Fetch invoices
  const { data, isLoading, error } = useQuery({
    queryKey: ['invoices', page, search, statusFilter],
    queryFn: () => api.get('/invoices', {
      params: { page, search, status: statusFilter }
    }).then(res => res.data),
  });

  // Create/Update mutation
  const mutation = useMutation({
    mutationFn: (invoice: Partial<Invoice>) => {
      if (editingInvoice) {
        return api.put(`/invoices/${editingInvoice.id}`, invoice);
      }
      return api.post('/invoices', invoice);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      setShowModal(false);
      setEditingInvoice(null);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/invoices/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading invoices</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Factures</h1>
        <button
          onClick={() => setShowModal(true)}
          className="btn btn-primary"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle facture
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="select"
        >
          <option value="">Tous les statuts</option>
          <option value="draft">Brouillon</option>
          <option value="sent">Envoyee</option>
          <option value="paid">Payee</option>
          <option value="overdue">En retard</option>
        </select>
      </div>

      {/* Table */}
      {data?.invoices.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Aucune facture"
          description="Commencez par creer votre premiere facture"
          action={{
            label: 'Creer une facture',
            onClick: () => setShowModal(true),
          }}
        />
      ) : (
        <>
          <table className="table">
            <thead>
              <tr>
                <th>Numero</th>
                <th>Client</th>
                <th>Date</th>
                <th>Montant</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data?.invoices.map((invoice: Invoice) => (
                <tr key={invoice.id}>
                  <td>{invoice.invoiceNumber}</td>
                  <td>{invoice.company?.name}</td>
                  <td>{new Date(invoice.issueDate).toLocaleDateString()}</td>
                  <td>{invoice.total.toFixed(2)} {invoice.currency}</td>
                  <td>
                    <StatusBadge status={invoice.status} />
                  </td>
                  <td>
                    <button onClick={() => {
                      setEditingInvoice(invoice);
                      setShowModal(true);
                    }}>
                      Modifier
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <Pagination
            currentPage={page}
            totalPages={data?.totalPages || 1}
            onPageChange={setPage}
          />
        </>
      )}

      {/* Modal */}
      {showModal && (
        <InvoiceModal
          invoice={editingInvoice}
          onClose={() => {
            setShowModal(false);
            setEditingInvoice(null);
          }}
          onSubmit={(data) => mutation.mutate(data)}
          isLoading={mutation.isPending}
        />
      )}
    </div>
  );
}
```

### Configuration API Client

```typescript
// apps/web/src/lib/api.ts
import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  const organizationId = localStorage.getItem('organizationId');
  if (organizationId) {
    config.headers['x-organization-id'] = organizationId;
  }

  return config;
});

// Response interceptor - Handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const response = await axios.post(`${import.meta.env.VITE_API_URL}/auth/refresh`, {
          refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data;
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', newRefreshToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
```

### State Management avec Zustand

```typescript
// apps/web/src/stores/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '@/lib/api';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      login: async (email: string, password: string) => {
        const response = await api.post('/auth/login', { email, password });
        const { user, accessToken, refreshToken } = response.data;

        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);

        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
        });
      },

      logout: () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');

        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        });
      },

      setUser: (user: User) => set({ user }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user }),
    }
  )
);
```

---

## Base de Donnees

### Drizzle ORM Schema

```typescript
// packages/database/src/schema/finance.ts
import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { organizations } from './users';

export const accounts = sqliteTable('accounts', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organizations.id),
  code: text('code').notNull(),
  name: text('name').notNull(),
  type: text('type', {
    enum: ['asset', 'liability', 'equity', 'revenue', 'expense']
  }).notNull(),
  parentId: text('parent_id').references(() => accounts.id),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  balance: real('balance').notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const invoices = sqliteTable('invoices', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organizations.id),
  invoiceNumber: text('invoice_number').notNull(),
  companyId: text('company_id').references(() => companies.id),
  contactId: text('contact_id').references(() => contacts.id),
  issueDate: text('issue_date').notNull(),
  dueDate: text('due_date').notNull(),
  status: text('status', {
    enum: ['draft', 'sent', 'paid', 'overdue', 'cancelled']
  }).notNull().default('draft'),
  subtotal: real('subtotal').notNull().default(0),
  taxAmount: real('tax_amount').notNull().default(0),
  total: real('total').notNull().default(0),
  amountPaid: real('amount_paid').notNull().default(0),
  currency: text('currency').notNull().default('TND'),
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
});

// Type exports
export type Account = typeof accounts.$inferSelect;
export type InsertAccount = typeof accounts.$inferInsert;
export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = typeof invoices.$inferInsert;
```

### Connexion Database

```typescript
// apps/workers/api/src/db.ts
import { drizzle } from 'drizzle-orm/d1';
import * as schema from '@perfex/database';

export function getDb(d1: D1Database) {
  return drizzle(d1, { schema });
}
```

---

## Authentification & Securite

### Flux d'Authentification

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│  Client  │     │   API    │     │   D1     │
└────┬─────┘     └────┬─────┘     └────┬─────┘
     │                │                │
     │ POST /login    │                │
     │ {email, pass}  │                │
     │───────────────>│                │
     │                │ Query user     │
     │                │───────────────>│
     │                │                │
     │                │ User data      │
     │                │<───────────────│
     │                │                │
     │                │ Verify password│
     │                │ Generate JWT   │
     │                │                │
     │ {accessToken,  │                │
     │  refreshToken} │                │
     │<───────────────│                │
     │                │                │
     │ GET /invoices  │                │
     │ Authorization: │                │
     │ Bearer <token> │                │
     │───────────────>│                │
     │                │ Verify JWT     │
     │                │ Check RBAC     │
     │                │───────────────>│
     │                │                │
     │ Invoice data   │                │
     │<───────────────│                │
```

### Structure des Tokens JWT

```typescript
// Access Token (15 min - 24h)
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "type": "access",
  "iat": 1234567890,
  "exp": 1234567890
}

// Refresh Token (7 days)
{
  "sub": "user-uuid",
  "type": "refresh",
  "jti": "unique-token-id",
  "iat": 1234567890,
  "exp": 1234567890
}
```

### Hachage des Mots de Passe

```typescript
import bcrypt from 'bcryptjs';

// Hash password
const hash = await bcrypt.hash(password, 10);

// Verify password
const isValid = await bcrypt.compare(password, hash);
```

---

## Patterns et Conventions

### Naming Conventions

| Element | Convention | Exemple |
|---------|-----------|---------|
| Fichiers TypeScript | camelCase | `invoiceService.ts` |
| Composants React | PascalCase | `InvoiceTable.tsx` |
| Routes API | kebab-case | `/api/v1/invoice-lines` |
| Tables DB | snake_case | `invoice_lines` |
| Variables | camelCase | `invoiceNumber` |
| Constantes | SCREAMING_SNAKE | `MAX_RETRIES` |
| Types/Interfaces | PascalCase | `InvoiceStatus` |

### Structure des Reponses API

```typescript
// Success response
{
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 50,
    "total": 150
  }
}

// Error response
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": [
      { "field": "email", "message": "Invalid email format" }
    ]
  }
}
```

### Error Handling

```typescript
// Custom error class
class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string
  ) {
    super(message);
  }
}

// Usage
throw new AppError(404, 'NOT_FOUND', 'Invoice not found');

// Global error handler
app.onError((err, c) => {
  if (err instanceof AppError) {
    return c.json({
      error: {
        code: err.code,
        message: err.message
      }
    }, err.statusCode);
  }

  console.error(err);
  return c.json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred'
    }
  }, 500);
});
```

---

## Performance

### Optimisations Frontend

1. **Code Splitting**
   ```typescript
   // Lazy loading des pages
   const InvoicesPage = lazy(() => import('./pages/finance/InvoicesPage'));
   ```

2. **React Query Caching**
   ```typescript
   const queryClient = new QueryClient({
     defaultOptions: {
       queries: {
         staleTime: 5 * 60 * 1000, // 5 minutes
         gcTime: 30 * 60 * 1000, // 30 minutes
       },
     },
   });
   ```

3. **Bundle Optimization**
   - Tree shaking automatique avec Vite
   - Chunks separes par route
   - Compression gzip/brotli

### Optimisations Backend

1. **Connection Pooling D1**
   - Gere automatiquement par Cloudflare

2. **Indexation Database**
   ```sql
   CREATE INDEX idx_invoices_org ON invoices(organization_id);
   CREATE INDEX idx_invoices_status ON invoices(status);
   CREATE INDEX idx_invoices_date ON invoices(issue_date);
   ```

3. **Pagination**
   ```typescript
   const items = await db
     .select()
     .from(invoices)
     .limit(50)
     .offset((page - 1) * 50);
   ```

### Metriques de Performance

| Metrique | Cible | Actuel |
|----------|-------|--------|
| Time to First Byte (TTFB) | < 100ms | ~50ms |
| Largest Contentful Paint (LCP) | < 2.5s | ~1.5s |
| First Input Delay (FID) | < 100ms | ~50ms |
| Cumulative Layout Shift (CLS) | < 0.1 | ~0.05 |
| API Response (simple) | < 100ms | ~50ms |
| API Response (complex) | < 500ms | ~200ms |

---

## Scalabilite

### Limites Actuelles

| Ressource | Limite |
|-----------|--------|
| Workers CPU Time | 10ms (free) / 30ms (paid) |
| D1 Database Size | 500MB (free) / 10GB (paid) |
| D1 Rows Read | 5M/day (free) |
| D1 Rows Written | 100K/day (free) |
| KV Operations | 100K/day (free) |

### Strategies de Scaling

1. **Horizontal Scaling**
   - Workers stateless par design
   - Scale automatique Cloudflare

2. **Database Sharding**
   - Partition par organization_id
   - D1 supporte read replicas

3. **Caching**
   - KV pour sessions
   - Cache responses API
   - Stale-while-revalidate

4. **Edge Computing**
   - 300+ locations Cloudflare
   - Latence < 50ms globalement

---

**Derniere mise a jour**: Decembre 2024
