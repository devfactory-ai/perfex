# Perfex Web Frontend

Application frontend React pour Perfex ERP Healthcare.

## Stack Technique

| Technologie | Version | Description |
|-------------|---------|-------------|
| React | 18.3 | Framework UI |
| TypeScript | 5.7 | Typage statique |
| Vite | 6.0 | Build tool |
| TanStack Query | 5.x | Gestion état serveur |
| Zustand | 5.x | Gestion état client |
| React Hook Form | 7.x | Formulaires |
| Zod | 3.x | Validation |
| TailwindCSS | 3.4 | Styling |
| React Router | 6.x | Routing |
| Axios | 1.x | Client HTTP |
| Lucide React | - | Icônes |

## Démarrage Rapide

### Installation

```bash
# Depuis la racine du projet
pnpm install

# Ou depuis ce répertoire
pnpm install
```

### Configuration

Créez un fichier `.env` (basé sur `.env.example`) :

```env
VITE_API_URL=http://localhost:8787/api/v1
VITE_APP_NAME=Perfex ERP Healthcare
```

### Développement

```bash
# Démarrer le serveur de dev
pnpm dev

# L'application sera disponible sur http://localhost:5173
```

### Build

```bash
# Build production
pnpm build

# Preview du build
pnpm preview
```

## Structure du Projet

```
src/
├── App.tsx                       # Composant racine
├── main.tsx                      # Point d'entrée
│
├── components/
│   ├── ui/                       # Composants UI réutilisables
│   │   └── button.tsx
│   │
│   ├── healthcare/               # Composants spécifiques santé
│   │   └── HealthcareErrorBoundary.tsx
│   │
│   ├── layouts/                  # Layouts (Dashboard, Auth, etc.)
│   ├── forms/                    # Composants de formulaires
│   └── ErrorBoundary.tsx         # Gestion erreurs globale
│
├── pages/
│   ├── auth/
│   │   └── LoginPage.tsx
│   │
│   ├── finance/                  # Module Comptabilité
│   ├── crm/                      # Module CRM
│   ├── hr/                       # Module RH
│   ├── inventory/                # Module Inventaire
│   ├── manufacturing/            # Module Production
│   ├── projects/                 # Module Projets
│   ├── procurement/              # Module Achats
│   ├── sales/                    # Module Ventes
│   ├── assets/                   # Module Actifs
│   ├── workflows/                # Module Workflows
│   │
│   │   # --- PAGES HEALTHCARE ---
│   ├── clinical-ai/              # IA Clinique
│   │   ├── index.ts
│   │   ├── ClinicalAIDashboardPage.tsx
│   │   ├── DiagnosticAssistantPage.tsx
│   │   ├── PatientSummaryPage.tsx
│   │   ├── ClinicalDocumentationPage.tsx
│   │   └── ClinicalDocumentFormPage.tsx
│   │
│   ├── imaging-ai/               # IA Imagerie
│   │   ├── index.ts
│   │   ├── ImagingDashboardPage.tsx
│   │   └── ImagingAnalysisPage.tsx
│   │
│   ├── patient-portal/           # Portail Patient
│   │   ├── index.ts
│   │   ├── PortalDashboardPage.tsx
│   │   ├── PortalLoginPage.tsx
│   │   ├── PortalAppointmentsPage.tsx
│   │   ├── PortalMessagesPage.tsx
│   │   └── PortalSymptomTrackerPage.tsx
│   │
│   ├── population-health/        # Santé Populationnelle
│   │   ├── index.ts
│   │   ├── PopulationHealthDashboardPage.tsx
│   │   ├── CohortsPage.tsx
│   │   └── QualityIndicatorsPage.tsx
│   │
│   └── rpm/                      # Remote Patient Monitoring
│       ├── index.ts
│       ├── RpmDashboardPage.tsx
│       ├── RpmDevicesPage.tsx
│       ├── RpmProgramsPage.tsx
│       ├── RpmEnrollmentsPage.tsx
│       └── RpmCompliancePage.tsx
│
├── hooks/
│   ├── useApi.ts                 # Hook pour appels API
│   ├── useAccessibility.ts       # Accessibilité (a11y)
│   └── useKeyboardShortcuts.ts   # Raccourcis clavier
│
├── lib/
│   ├── api.ts                    # Client API Axios
│   └── utils.ts                  # Fonctions utilitaires
│
├── store/                        # Stores Zustand
│   └── authStore.ts
│
├── utils/
│   ├── accessibility.ts          # Utilitaires a11y
│   └── errors.ts                 # Gestion erreurs
│
└── config/
    └── industryPresets/          # Presets par industrie
```

## Patterns et Conventions

### Composants React

```typescript
// Composant fonctionnel avec TypeScript
interface ButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
}

export function Button({
  onClick,
  children,
  variant = 'primary',
  disabled = false
}: ButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`btn btn-${variant}`}
    >
      {children}
    </button>
  );
}
```

### Gestion de l'État Serveur (TanStack Query)

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

// Query
const { data, isLoading, error } = useQuery({
  queryKey: ['patients', filters],
  queryFn: () => api.get('/dialyse/patients', { params: filters }),
});

// Mutation
const mutation = useMutation({
  mutationFn: (data) => api.post('/dialyse/patients', data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['patients'] });
  },
});
```

### Gestion de l'État Client (Zustand)

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      login: async (email, password) => {
        const response = await api.post('/auth/login', { email, password });
        set({ user: response.data.user, isAuthenticated: true });
      },
      logout: () => set({ user: null, isAuthenticated: false }),
    }),
    { name: 'auth-storage' }
  )
);
```

### Formulaires (React Hook Form + Zod)

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const patientSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  dateOfBirth: z.string(),
  email: z.string().email().optional(),
});

type PatientFormData = z.infer<typeof patientSchema>;

export function PatientForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema),
  });

  const onSubmit = (data: PatientFormData) => {
    // Envoyer les données
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('firstName')} />
      {errors.firstName && <span>{errors.firstName.message}</span>}
      {/* ... */}
    </form>
  );
}
```

## Pages Healthcare

### Clinical AI Dashboard

Page principale de l'IA clinique avec accès aux fonctionnalités :
- Assistant diagnostic
- Résumés patients automatiques
- Documentation clinique
- Recommandations CDSS

### Imaging AI

Interface d'analyse d'imagerie médicale :
- Upload d'images (ECG, Echo, OCT)
- Analyse automatique
- Visualisation des résultats
- Historique des analyses

### Patient Portal

Portail patient avec :
- Authentification sécurisée
- Tableau de bord patient
- Messagerie avec l'équipe soignante
- Gestion des rendez-vous
- Suivi des symptômes

### Population Health

Tableau de bord santé publique :
- Gestion des cohortes
- Indicateurs qualité (HAS, ROSP)
- Stratification des risques
- Rapports analytiques

### RPM (Remote Patient Monitoring)

Suivi des patients à distance :
- Gestion des appareils connectés
- Visualisation des mesures
- Programmes de suivi
- Suivi compliance

## Accessibilité (a11y)

L'application respecte les standards WCAG 2.1 :

```typescript
// Hook useAccessibility
import { useAccessibility } from '@/hooks/useAccessibility';

function MyComponent() {
  const { announceMessage, focusElement } = useAccessibility();

  const handleAction = () => {
    // Annoncer aux lecteurs d'écran
    announceMessage('Patient enregistré avec succès');
  };
}
```

## Raccourcis Clavier

```typescript
// Hook useKeyboardShortcuts
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

function MyComponent() {
  useKeyboardShortcuts({
    'ctrl+s': handleSave,
    'ctrl+n': handleNew,
    'escape': handleClose,
  });
}
```

## Configuration Vite

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          query: ['@tanstack/react-query'],
        },
      },
    },
  },
});
```

## Tests

```bash
# Tests unitaires
pnpm test

# Tests avec couverture
pnpm test:coverage

# Tests e2e (Playwright)
pnpm test:e2e
```

## Déploiement

### Cloudflare Pages

```bash
# Build
pnpm build

# Deploy avec Wrangler
wrangler pages deploy dist
```

### Variables d'environnement Production

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | URL de l'API backend |
| `VITE_APP_NAME` | Nom de l'application |

## Documentation

- [Architecture Projet](../../docs/ARCHITECTURE.md)
- [Modules Healthcare](../../docs/HEALTHCARE.md)
- [Guide Contribution](../../CONTRIBUTING.md)
- [React Docs](https://react.dev/)
- [TailwindCSS](https://tailwindcss.com/)

## Contribution

Voir [CONTRIBUTING.md](../../CONTRIBUTING.md)

## License

Proprietary - Perfex ERP

---

**Dernière mise à jour** : Février 2025
