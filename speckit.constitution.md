# Constitution Perfex ERP AI-Native

> Document de référence obligatoire pour tout développement sur Perfex.
> Version 2.0 - Novembre 2025

---

## 1. VISION & MISSION

### 1.1 Mission
Créer le **premier ERP véritablement AI-native**, où les LLMs ne sont pas un add-on mais le **cœur de l'architecture**, révolutionnant l'expérience utilisateur et l'efficacité opérationnelle des PME/ETI.

### 1.2 Vision
- Rendre l'ERP accessible à tous via une **interface conversationnelle**
- Réduire la courbe d'apprentissage de **70%**
- Réduire le temps de déploiement de **80%**
- Automatiser **60%** des tâches répétitives via AI

### 1.3 Principes Fondateurs
1. **AI-First**: L'IA est native, pas ajoutée après coup
2. **Edge-First**: Performance mondiale < 50ms
3. **User-Centric**: UX conversationnelle intuitive
4. **Open & Extensible**: API-first, plugins, marketplace
5. **Cost-Effective**: Économique pour les PME

---

## 2. STACK TECHNIQUE (NON-NÉGOCIABLE)

### 2.1 Frontend
| Technologie | Version | Usage |
|-------------|---------|-------|
| React | 18+ | UI Framework |
| TypeScript | 5+ | Type Safety |
| Vite | 5+ | Build Tool |
| TailwindCSS | 3+ | Styling |
| Shadcn/ui | Latest | Component Library |
| React Router | 6+ | Routing |
| Zustand | 4+ | State Management |
| TanStack Query | 5+ | Server State |
| React Hook Form | 7+ | Forms |
| Zod | 3+ | Validation |

### 2.2 Backend
| Technologie | Version | Usage |
|-------------|---------|-------|
| Hono.js | 4+ | API Framework |
| TypeScript | 5+ | Type Safety |
| Drizzle ORM | 0.29+ | Database ORM |
| Zod | 3+ | Validation |
| bcryptjs | 2.4+ | Password Hashing |
| jsonwebtoken | 9+ | JWT Auth |

### 2.3 Infrastructure Cloudflare
| Service | Usage | Limite Free |
|---------|-------|-------------|
| Workers | Edge Compute | 100k req/jour |
| Pages | Frontend Hosting | Illimité |
| D1 | SQLite Database | 5GB, 5M reads/jour |
| R2 | Object Storage | 10GB |
| KV | Key-Value Cache | 100k reads/jour |
| Vectorize | Vector DB (RAG) | 5M vectors |
| Queues | Message Queue | 1M msg/mois |
| Workers AI | LLM Inference | 10k neurons/jour |
| Durable Objects | Stateful Workers | Selon usage |

### 2.4 AI Stack
| Service | Usage | Modèle |
|---------|-------|--------|
| Workers AI | Primary LLM | Llama 3.1 8B/70B |
| Gemini 2.0 Flash | Fallback/Complex | gemini-2.0-flash |
| Vectorize | Embeddings | BGE Base EN v1.5 |
| Custom Agents | Multi-Agent | Orchestration maison |

---

## 3. ARCHITECTURE

### 3.1 Architecture Globale
```
┌─────────────────────────────────────────────────────────────┐
│                      CLOUDFLARE EDGE                         │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐        │
│  │  Pages  │  │ Workers │  │   D1    │  │   R2    │        │
│  │Frontend │  │   API   │  │Database │  │ Storage │        │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘        │
│       │            │            │            │              │
│  ┌────┴────────────┴────────────┴────────────┴────┐        │
│  │              UNIFIED EDGE LAYER                 │        │
│  └─────────────────────┬───────────────────────────┘        │
│                        │                                    │
│  ┌─────────┐  ┌───────┴───────┐  ┌─────────┐              │
│  │   KV    │  │  Workers AI   │  │Vectorize│              │
│  │ Cache   │  │  LLM Engine   │  │   RAG   │              │
│  └─────────┘  └───────────────┘  └─────────┘              │
│                                                             │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐                    │
│  │ Queues  │  │ Durable │  │  Cron   │                    │
│  │  Jobs   │  │ Objects │  │Triggers │                    │
│  └─────────┘  └─────────┘  └─────────┘                    │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Architecture Multi-Agent AI
```
┌──────────────────────────────────────────────────────────┐
│                    ORCHESTRATOR AGENT                     │
│              (Routing, Planning, Coordination)            │
└────────────────────────┬─────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
┌───────┴───────┐ ┌──────┴──────┐ ┌──────┴──────┐
│ DOMAIN AGENTS │ │ TASK AGENTS │ │HELPER AGENTS│
├───────────────┤ ├─────────────┤ ├─────────────┤
│ • Finance     │ │ • Analyzer  │ │ • Search    │
│ • Sales       │ │ • Generator │ │ • Calculator│
│ • HR          │ │ • Validator │ │ • Formatter │
│ • Inventory   │ │ • Executor  │ │ • Translator│
│ • Production  │ │ • Reporter  │ │ • Summarizer│
└───────────────┘ └─────────────┘ └─────────────┘
```

### 3.3 Structure Monorepo
```
perfex/
├── apps/
│   ├── web/                    # Frontend React
│   │   ├── src/
│   │   │   ├── components/     # UI Components
│   │   │   │   ├── ui/         # Shadcn components
│   │   │   │   ├── forms/      # Form components
│   │   │   │   ├── layouts/    # Layout components
│   │   │   │   └── modules/    # Module-specific
│   │   │   ├── pages/          # Page components
│   │   │   ├── lib/            # Utilities
│   │   │   ├── stores/         # Zustand stores
│   │   │   ├── hooks/          # Custom hooks
│   │   │   └── styles/         # Global styles
│   │   └── package.json
│   │
│   └── workers/
│       ├── api/                # Main API Worker
│       │   ├── src/
│       │   │   ├── routes/     # API routes by module
│       │   │   ├── middleware/ # Middlewares
│       │   │   ├── services/   # Business logic
│       │   │   └── utils/      # Utilities
│       │   ├── wrangler.toml
│       │   └── package.json
│       │
│       ├── ai/                 # AI Worker
│       │   ├── src/
│       │   │   ├── agents/     # AI Agents
│       │   │   ├── prompts/    # Prompt templates
│       │   │   ├── tools/      # Agent tools
│       │   │   └── rag/        # RAG pipeline
│       │   └── wrangler.toml
│       │
│       └── jobs/               # Background Jobs Worker
│           ├── src/
│           │   ├── handlers/   # Job handlers
│           │   └── consumers/  # Queue consumers
│           └── wrangler.toml
│
├── packages/
│   ├── database/               # Drizzle schemas
│   │   ├── src/
│   │   │   ├── schema/         # Table schemas
│   │   │   └── migrations/     # SQL migrations
│   │   └── drizzle.config.ts
│   │
│   ├── shared/                 # Shared code
│   │   ├── src/
│   │   │   ├── types/          # TypeScript types
│   │   │   ├── validators/     # Zod schemas
│   │   │   ├── constants/      # Constants
│   │   │   └── utils/          # Utilities
│   │   └── package.json
│   │
│   └── ai-core/                # AI utilities
│       ├── src/
│       │   ├── prompts/        # Prompt templates
│       │   ├── agents/         # Agent definitions
│       │   └── tools/          # Agent tools
│       └── package.json
│
├── .specify/                   # Speckit
│   ├── memory/
│   │   └── constitution.md     # This file
│   ├── specs/                  # Specifications
│   ├── plans/                  # Plans
│   └── tasks/                  # Tasks
│
├── pnpm-workspace.yaml
├── package.json
└── turbo.json
```

---

## 4. MODULES PERFEX

### 4.1 Phase 1 - MVP (Mois 1-4)

| Module | Description | Priorité |
|--------|-------------|----------|
| **Auth** | Authentication, Users, RBAC, Organizations | P0 |
| **Finance** | Comptabilité, Facturation, Trésorerie, Reporting | P0 |
| **CRM** | Contacts, Leads, Opportunités, Devis, Pipeline | P0 |
| **AI Core** | Chat, Agents, RAG, Embeddings, Orchestration | P0 |

### 4.2 Phase 2 - Core (Mois 5-8)

| Module | Description | Priorité |
|--------|-------------|----------|
| **Purchases** | Achats, Fournisseurs, DA, PO, Réception | P1 |
| **Inventory** | Stock, Entrepôts, Mouvements, Inventaire | P1 |
| **Projects** | Projets, Tâches, Timesheet, Ressources | P1 |
| **HR** | Employés, Absences, Paie, Recrutement | P1 |

### 4.3 Phase 3 - Advanced (Mois 9-12)

| Module | Description | Priorité |
|--------|-------------|----------|
| **Manufacturing** | Production, BOM, MRP, Qualité | P2 |
| **E-commerce** | Boutique, POS, Marketplace, Paiements | P2 |
| **Analytics** | BI, Dashboards, KPIs, Reports | P2 |
| **Advanced AI** | Prédictif, Optimisation, Anomalies | P2 |

---

## 5. CONVENTIONS DE CODE

### 5.1 Naming Conventions

| Type | Convention | Exemple |
|------|------------|---------|
| Files | kebab-case | `user-service.ts` |
| Classes | PascalCase | `UserService` |
| Functions | camelCase | `getUserById` |
| Constants | UPPER_SNAKE | `MAX_RETRIES` |
| Components | PascalCase | `LoginForm.tsx` |
| Hooks | camelCase + use | `useAuth` |
| Types/Interfaces | PascalCase | `User`, `AuthResponse` |
| Enums | PascalCase | `UserRole` |
| DB Tables | snake_case | `user_roles` |
| API Routes | kebab-case | `/api/v1/user-roles` |

### 5.2 File Organization

```typescript
// 1. External imports
import { Hono } from 'hono';
import { z } from 'zod';

// 2. Internal imports (absolute)
import { users } from '@perfex/database';
import { UserService } from '@/services/user.service';

// 3. Types
interface Props { ... }

// 4. Constants
const MAX_RETRIES = 3;

// 5. Main code (class/function/component)
export class UserController { ... }

// 6. Helper functions (private)
function validateInput() { ... }

// 7. Exports (if not inline)
export { UserController };
```

### 5.3 API Response Format

```typescript
// Success
{
  data: T,
  meta?: {
    page: number,
    limit: number,
    total: number
  }
}

// Error
{
  error: {
    code: string,        // "VALIDATION_ERROR"
    message: string,     // Human-readable
    details?: any        // Additional info
  }
}
```

### 5.4 Commit Messages (Conventional)

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting
- `refactor`: Code refactoring
- `test`: Tests
- `chore`: Maintenance

**Exemples**:
```
feat(auth): add password reset endpoint
fix(finance): correct invoice total calculation
docs(readme): update installation steps
test(crm): add contact service tests
```

---

## 6. SÉCURITÉ

### 6.1 Authentication
- JWT Access Token: **15 minutes**
- JWT Refresh Token: **7 jours**
- Password hashing: **bcrypt cost 12**
- Session storage: **Workers KV**

### 6.2 Rate Limiting
| Endpoint | Limite | Fenêtre |
|----------|--------|---------|
| Login | 5 | 15 min |
| Register | 3 | 1 heure |
| API (auth) | 100 | 1 min |
| API (public) | 30 | 1 min |
| AI Chat | 20 | 1 min |

### 6.3 Validation
- **Toutes** les entrées validées avec Zod
- Sanitization automatique (trim, lowercase emails)
- SQL Injection: impossible avec Drizzle ORM
- XSS: React échappe par défaut
- CSRF: Tokens sur mutations

### 6.4 CORS
```typescript
cors({
  origin: [
    'https://app.perfex.com',
    'https://perfex.com',
    process.env.NODE_ENV === 'development' && 'http://localhost:3000'
  ].filter(Boolean),
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400
})
```

---

## 7. QUALITÉ

### 7.1 Tests
| Type | Coverage Min | Outil |
|------|--------------|-------|
| Unit | 80% | Vitest |
| Integration | 70% | Vitest + Miniflare |
| E2E | Critical paths | Playwright |

### 7.2 Quality Gates

**Pre-Commit**:
```bash
✓ ESLint pass
✓ Prettier formatted
✓ TypeScript type-check
```

**Pre-Push**:
```bash
✓ All tests pass
✓ Build succeeds
✓ Bundle size < 1MB
```

**CI/CD (GitHub Actions)**:
```bash
✓ All tests pass
✓ Coverage ≥ 80%
✓ No security vulnerabilities
✓ Lighthouse > 90
✓ Deploy dry-run success
```

### 7.3 Performance Targets
| Métrique | Target | Critical |
|----------|--------|----------|
| API Latency p50 | < 50ms | < 100ms |
| API Latency p95 | < 100ms | < 200ms |
| LLM First Token | < 500ms | < 1s |
| Page Load (LCP) | < 1.5s | < 2.5s |
| Time to Interactive | < 2s | < 3s |
| Lighthouse Score | > 95 | > 90 |

---

## 8. INTERDICTIONS STRICTES

### 8.1 ❌ JAMAIS

1. **JavaScript vanilla** - TypeScript OBLIGATOIRE
2. **`any` type** - Sauf cas documenté et approuvé
3. **Node.js APIs** - Workers runtime uniquement
4. **Long-running processes** - Max 30s CPU
5. **Filesystem access** - Utiliser R2 ou KV
6. **`eval()` ou `Function()`** - Faille sécurité
7. **Secrets dans le code** - wrangler secret
8. **`console.log` en prod** - Logger structuré
9. **Packages non-edge** - Vérifier compatibilité
10. **SQL raw** - Drizzle ORM uniquement
11. **Dépendances > 100KB** - Justification requise
12. **Tests < 80%** - Bloque le merge

### 8.2 ⚠️ À ÉVITER

1. Packages sans tree-shaking
2. Heavy computation (> 10ms CPU)
3. Large data in memory (> 50MB)
4. Synchronous blocking operations
5. Deep nesting (> 4 levels)
6. Functions > 50 lines
7. Files > 300 lines
8. Magic numbers sans constante
9. Commented-out code
10. TODO sans ticket

---

## 9. DOCUMENTATION

### 9.1 Obligatoire
- README.md dans chaque package
- JSDoc sur fonctions/classes publiques
- Inline comments sur logique complexe
- OpenAPI spec pour l'API
- ADRs pour décisions architecturales

### 9.2 JSDoc Format
```typescript
/**
 * Creates a new invoice for a customer
 * 
 * @param customerId - The customer's unique identifier
 * @param items - Array of invoice line items
 * @param options - Optional invoice configuration
 * @returns The created invoice with calculated totals
 * @throws {ValidationError} If items array is empty
 * @throws {NotFoundError} If customer doesn't exist
 * 
 * @example
 * const invoice = await createInvoice('cust_123', [
 *   { productId: 'prod_1', quantity: 2, unitPrice: 100 }
 * ]);
 */
async function createInvoice(
  customerId: string,
  items: InvoiceItem[],
  options?: InvoiceOptions
): Promise<Invoice> { ... }
```

---

## 10. ENVIRONNEMENTS

### 10.1 Development
- **URL**: http://localhost:3000 (frontend), :8787 (api)
- **Database**: D1 local (--local flag)
- **Features**: Hot reload, debug mode, mock data
- **AI**: Workers AI sandbox

### 10.2 Staging
- **URL**: https://staging.perfex.com
- **Database**: D1 staging (separate)
- **Features**: Production-like, test data
- **AI**: Workers AI (limited)

### 10.3 Production
- **URL**: https://app.perfex.com
- **Database**: D1 production (replicated)
- **Features**: Full monitoring, alerting
- **AI**: Workers AI + Gemini fallback

---

## 11. WORKFLOW DÉVELOPPEMENT

### 11.1 Feature Development
```
1. Créer branche: feature/MODULE-description
2. Spécifier avec Speckit si nouveau module
3. Implémenter avec Claude Code
4. Tests (unit + integration)
5. Self-review (constitution check)
6. PR avec description détaillée
7. CI passe
8. Merge après review
```

### 11.2 Bug Fix
```
1. Créer branche: fix/MODULE-description
2. Reproduire le bug
3. Écrire test qui échoue
4. Fix le bug
5. Test passe
6. PR + merge
```

### 11.3 Speckit Workflow
```
1. /speckit.specify - Créer spec
2. /speckit.clarify - Clarifier si besoin
3. /speckit.analyze - Analyser faisabilité
4. /speckit.plan - Créer plan
5. /speckit.tasks - Générer tâches
6. Claude Code - Implémenter
```

---

## 12. DÉPLOIEMENT

### 12.1 Commandes
```bash
# Development
wrangler dev                    # API local
pnpm dev                        # Frontend local

# Staging
wrangler deploy --env staging   # API staging
wrangler pages deploy --branch staging  # Frontend

# Production
wrangler deploy                 # API production
wrangler pages deploy           # Frontend production
```

### 12.2 Rollback
```bash
# Voir versions
wrangler deployments list

# Rollback
wrangler rollback
```

### 12.3 Migrations D1
```bash
# Générer
pnpm --filter @perfex/database generate

# Appliquer local
wrangler d1 migrations apply perfex-db --local

# Appliquer production
wrangler d1 migrations apply perfex-db
```

---

## 13. MONITORING

### 13.1 Métriques Clés
- Request count & latency
- Error rate par endpoint
- Database query time
- Cache hit rate
- AI response time
- User actions (analytics)

### 13.2 Alertes
| Condition | Sévérité | Action |
|-----------|----------|--------|
| Error rate > 1% | Warning | Investigate |
| Error rate > 5% | Critical | Immediate fix |
| Latency p95 > 500ms | Warning | Optimize |
| DB errors | Critical | Check D1 |
| AI failures > 10% | Warning | Check fallback |

### 13.3 Logging
```typescript
// Structured logging
logger.info('Invoice created', {
  invoiceId: invoice.id,
  customerId: customer.id,
  total: invoice.total,
  duration: Date.now() - start
});

// Error logging
logger.error('Payment failed', {
  error: err.message,
  invoiceId,
  provider: 'stripe',
  stack: err.stack
});
```

---

## 14. ÉVOLUTION

### 14.1 Modification de cette Constitution
1. Proposer changement via PR
2. Discussion en équipe
3. Validation CTO
4. Update document
5. Communiquer changements

### 14.2 Versioning
- **Version actuelle**: 2.0
- **Date**: Novembre 2025
- **Prochaine révision**: Février 2026

---

## 15. RESSOURCES

### 15.1 Documentation Officielle
- Cloudflare Workers: https://developers.cloudflare.com/workers/
- Hono.js: https://hono.dev/
- Drizzle ORM: https://orm.drizzle.team/
- Shadcn/ui: https://ui.shadcn.com/
- TailwindCSS: https://tailwindcss.com/
- Zod: https://zod.dev/

### 15.2 Communautés
- Cloudflare Discord: https://discord.gg/cloudflaredev
- Hono Discord: https://discord.gg/hono

### 15.3 Outils Internes
- Speckit: Specifications & Planning
- Claude Code: AI-assisted development

---

## RAPPEL FINAL

> **Cette constitution est la LOI du projet Perfex.**
> 
> Tout code qui ne respecte pas cette constitution sera rejeté.
> En cas de doute, toujours se référer à ce document.
> 
> **Objectif**: Créer le meilleur ERP AI-native du marché.
> **Moyen**: Excellence technique + AI-first + Edge performance.
> **Stack**: Cloudflare = Performance + Coût + Simplicité.

---

*Document vivant - Dernière mise à jour: Novembre 2025*
