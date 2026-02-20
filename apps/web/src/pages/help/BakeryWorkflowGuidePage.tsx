/**
 * Bakery Workflow Guide Page
 * Interactive guide explaining the bakery workflow by role
 */

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface WorkflowStep {
  id: number;
  title: string;
  description: string;
  icon: string;
  module: string;
  route: string;
  details: string[];
  tips: string[];
}

interface RoleWorkflow {
  id: string;
  name: string;
  icon: string;
  color: string;
  bgColor: string;
  description: string;
  steps: WorkflowStep[];
}

// Role-based workflows
const ROLE_WORKFLOWS: RoleWorkflow[] = [
  {
    id: 'boulanger',
    name: 'Boulanger',
    icon: '👨‍🍳',
    color: 'text-amber-800',
    bgColor: 'bg-amber-100',
    description: 'Production et fabrication des produits',
    steps: [
      {
        id: 1,
        title: 'Consulter le Stock',
        description: 'Vérifiez la disponibilité des matières premières',
        icon: '📦',
        module: 'Inventaire',
        route: '/inventory',
        details: [
          'Consultez le stock des ingrédients',
          'Vérifiez les alertes de stock bas',
          'Signalez les ruptures au manager',
        ],
        tips: [
          'Vérifiez le stock en début de journée',
          'Anticipez les besoins pour demain',
        ],
      },
      {
        id: 2,
        title: 'Consulter les Recettes',
        description: 'Accédez aux fiches recettes pour la production',
        icon: '📋',
        module: 'Recettes',
        route: '/recipes',
        details: [
          'Consultez les fiches recettes',
          'Vérifiez les quantités d\'ingrédients',
          'Suivez les instructions de fabrication',
        ],
        tips: [
          'Respectez les proportions exactes',
          'Notez les variations de température/humidité',
        ],
      },
      {
        id: 3,
        title: 'Lancer la Production',
        description: 'Fabriquez selon les ordres de fabrication',
        icon: '🏭',
        module: 'Production',
        route: '/manufacturing/work-orders',
        details: [
          'Consultez les ordres de fabrication du jour',
          'Lancez la production des recettes',
          'Enregistrez les quantités produites',
          'Déclarez les pertes éventuelles',
        ],
        tips: [
          'Suivez l\'ordre de priorité des OF',
          'Signalez tout écart de production',
        ],
      },
      {
        id: 4,
        title: 'Contrôle Qualité',
        description: 'Assurez la conformité et la traçabilité',
        icon: '✅',
        module: 'Traçabilité',
        route: '/traceability',
        details: [
          'Enregistrez les contrôles de température',
          'Documentez les numéros de lots',
          'Validez les points de contrôle HACCP',
        ],
        tips: [
          'Contrôles obligatoires = pas d\'oubli',
          'Photos si anomalie détectée',
        ],
      },
    ],
  },
  {
    id: 'vendeur',
    name: 'Vendeur',
    icon: '🛒',
    color: 'text-green-800',
    bgColor: 'bg-green-100',
    description: 'Ventes en boutique et service client',
    steps: [
      {
        id: 1,
        title: 'Ouvrir la Caisse',
        description: 'Préparez votre poste de vente',
        icon: '💰',
        module: 'Point de Vente',
        route: '/pos',
        details: [
          'Ouvrez la caisse avec le fond de caisse',
          'Vérifiez le stock en vitrine',
          'Consultez les promotions du jour',
        ],
        tips: [
          'Comptez le fond de caisse à l\'ouverture',
          'Notez les produits manquants',
        ],
      },
      {
        id: 2,
        title: 'Ventes & Encaissements',
        description: 'Servez les clients et encaissez',
        icon: '🛒',
        module: 'Point de Vente',
        route: '/pos',
        details: [
          'Sélectionnez les produits vendus',
          'Encaissez (CB, espèces, chèques)',
          'Imprimez les tickets de caisse',
          'Gérez les retours si nécessaire',
        ],
        tips: [
          'Proposez les produits du jour',
          'Suggérez les ventes additionnelles',
        ],
      },
      {
        id: 3,
        title: 'Suivi du Stock Vitrine',
        description: 'Gérez le réassort de la vitrine',
        icon: '📊',
        module: 'Inventaire',
        route: '/inventory',
        details: [
          'Signalez les produits en rupture',
          'Demandez le réassort au fournil',
          'Mettez à jour les étiquettes prix',
        ],
        tips: [
          'Réassort régulier = vitrine attractive',
          'Rotation des produits (FIFO)',
        ],
      },
      {
        id: 4,
        title: 'Fermeture de Caisse',
        description: 'Clôturez la journée de vente',
        icon: '📝',
        module: 'Point de Vente',
        route: '/pos',
        details: [
          'Comptez la caisse',
          'Validez le Z de caisse',
          'Déclarez les écarts éventuels',
          'Consultez le résumé des ventes',
        ],
        tips: [
          'Double comptage recommandé',
          'Signalez tout écart immédiatement',
        ],
      },
    ],
  },
  {
    id: 'livreur',
    name: 'Livreur',
    icon: '🚛',
    color: 'text-blue-800',
    bgColor: 'bg-blue-100',
    description: 'Livraisons aux clients professionnels',
    steps: [
      {
        id: 1,
        title: 'Consulter les Commandes',
        description: 'Visualisez les livraisons du jour',
        icon: '📋',
        module: 'Ventes',
        route: '/sales/orders',
        details: [
          'Consultez la liste des livraisons',
          'Vérifiez les adresses et horaires',
          'Notez les instructions spéciales',
        ],
        tips: [
          'Planifiez votre itinéraire',
          'Vérifiez les contacts clients',
        ],
      },
      {
        id: 2,
        title: 'Préparer les Commandes',
        description: 'Chargez le véhicule avec les commandes',
        icon: '📦',
        module: 'Ventes',
        route: '/sales/orders',
        details: [
          'Récupérez les bons de livraison',
          'Vérifiez les quantités préparées',
          'Chargez dans l\'ordre de livraison',
          'Contrôlez la température si nécessaire',
        ],
        tips: [
          'LIFO pour le chargement (dernier chargé = premier livré)',
          'Photos de chargement recommandées',
        ],
      },
      {
        id: 3,
        title: 'Effectuer les Livraisons',
        description: 'Livrez et faites signer les clients',
        icon: '🚛',
        module: 'Ventes',
        route: '/sales/orders',
        details: [
          'Livrez selon l\'itinéraire prévu',
          'Faites signer le bon de livraison',
          'Notez les refus ou problèmes',
          'Encaissez si paiement à la livraison',
        ],
        tips: [
          'Signature obligatoire = preuve de livraison',
          'Photo du bon signé si possible',
        ],
      },
      {
        id: 4,
        title: 'Retour & Rapport',
        description: 'Finalisez la tournée',
        icon: '✅',
        module: 'Ventes',
        route: '/sales/orders',
        details: [
          'Retournez les invendus/refusés',
          'Remettez les encaissements',
          'Validez les livraisons effectuées',
          'Signalez les incidents',
        ],
        tips: [
          'Rapport complet = moins de litiges',
          'Feedback sur les clients',
        ],
      },
    ],
  },
  {
    id: 'manager',
    name: 'Manager',
    icon: '👔',
    color: 'text-purple-800',
    bgColor: 'bg-purple-100',
    description: 'Supervision et gestion globale',
    steps: [
      {
        id: 1,
        title: 'Tableau de Bord',
        description: 'Vue d\'ensemble de l\'activité',
        icon: '📊',
        module: 'Dashboard',
        route: '/',
        details: [
          'Consultez les KPIs du jour',
          'Vérifiez les alertes',
          'Analysez les tendances',
        ],
        tips: [
          'Revue quotidienne recommandée',
          'Identifiez les écarts rapidement',
        ],
      },
      {
        id: 2,
        title: 'Gestion des Stocks',
        description: 'Supervisez les approvisionnements',
        icon: '📦',
        module: 'Inventaire',
        route: '/inventory',
        details: [
          'Vérifiez les niveaux de stock',
          'Validez les besoins de réappro',
          'Lancez les commandes fournisseurs',
        ],
        tips: [
          'Anticipez les ruptures',
          'Négociez avec les fournisseurs',
        ],
      },
      {
        id: 3,
        title: 'Commandes Fournisseurs',
        description: 'Gérez les achats',
        icon: '🚚',
        module: 'Achats',
        route: '/procurement',
        details: [
          'Créez les bons de commande',
          'Suivez les livraisons',
          'Validez les factures',
          'Gérez les fournisseurs',
        ],
        tips: [
          'Comparez les prix régulièrement',
          'Gardez plusieurs fournisseurs',
        ],
      },
      {
        id: 4,
        title: 'Planification Production',
        description: 'Organisez la production',
        icon: '📅',
        module: 'Production',
        route: '/manufacturing/work-orders',
        details: [
          'Créez les ordres de fabrication',
          'Affectez les ressources',
          'Validez les productions',
        ],
        tips: [
          'Planifiez selon les prévisions',
          'Ajustez selon la météo/événements',
        ],
      },
      {
        id: 5,
        title: 'Gestion des Recettes',
        description: 'Maintenez les fiches recettes',
        icon: '📋',
        module: 'Recettes',
        route: '/recipes',
        details: [
          'Créez/modifiez les recettes',
          'Calculez les coûts de revient',
          'Définissez les prix de vente',
        ],
        tips: [
          'Mettez à jour les coûts régulièrement',
          'Testez avant de valider',
        ],
      },
      {
        id: 6,
        title: 'Suivi Commercial',
        description: 'Gérez les ventes B2B',
        icon: '💼',
        module: 'Ventes',
        route: '/sales/orders',
        details: [
          'Suivez les commandes clients',
          'Gérez les factures',
          'Analysez les performances',
        ],
        tips: [
          'Relancez les impayés',
          'Fidélisez les bons clients',
        ],
      },
      {
        id: 7,
        title: 'Rapports & Analyses',
        description: 'Pilotez par les chiffres',
        icon: '📈',
        module: 'Finance',
        route: '/finance/reports',
        details: [
          'Consultez les rapports de ventes',
          'Analysez les marges',
          'Suivez la trésorerie',
        ],
        tips: [
          'Revue hebdomadaire minimum',
          'Comparez avec les objectifs',
        ],
      },
    ],
  },
];

// Map user emails/names to workflow IDs (based on demo accounts)
const EMAIL_ROLE_MAPPING: Record<string, string> = {
  'boulanger': 'boulanger',
  'baker': 'boulanger',
  'vente': 'vendeur',
  'vendeur': 'vendeur',
  'seller': 'vendeur',
  'caissier': 'vendeur',
  'livraison': 'livreur',
  'livreur': 'livreur',
  'delivery': 'livreur',
  'driver': 'livreur',
  'manager': 'manager',
  'admin': 'manager',
  'gerant': 'manager',
  'demo': 'manager',
};

export function BakeryWorkflowGuidePage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Detect user role from email or name
  const userRole = useMemo(() => {
    if (!user) return 'manager';

    // Check email address for role hints (e.g., boulanger@perfex.io)
    const email = (user.email || '').toLowerCase();
    const name = `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase();
    const searchStr = `${email} ${name}`;

    for (const [key, value] of Object.entries(EMAIL_ROLE_MAPPING)) {
      if (searchStr.includes(key)) {
        return value;
      }
    }

    // Default to manager for unknown roles
    return 'manager';
  }, [user]);

  const [selectedRole, setSelectedRole] = useState<string>(userRole);
  const [activeStep, setActiveStep] = useState<number>(1);

  const currentWorkflow = ROLE_WORKFLOWS.find(w => w.id === selectedRole) || ROLE_WORKFLOWS[0];
  const currentStep = currentWorkflow.steps.find(s => s.id === activeStep);

  // Reset step when changing role
  const handleRoleChange = (roleId: string) => {
    setSelectedRole(roleId);
    setActiveStep(1);
  };

  const handleGoToModule = (route: string) => {
    navigate(route);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">
          Guide du Workflow Boulangerie
        </h1>
        <p className="mt-2 text-muted-foreground">
          Workflow adapté à votre rôle - Sélectionnez un profil pour voir son flux de travail
        </p>
      </div>

      {/* Role Tabs */}
      <div className="flex flex-wrap justify-center gap-3">
        {ROLE_WORKFLOWS.map((workflow) => (
          <button
            key={workflow.id}
            onClick={() => handleRoleChange(workflow.id)}
            className={`flex items-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
              selectedRole === workflow.id
                ? `${workflow.bgColor} ${workflow.color} border-current shadow-md scale-105`
                : 'border-border hover:border-primary/50 bg-card'
            } ${workflow.id === userRole ? 'ring-2 ring-primary ring-offset-2' : ''}`}
          >
            <span className="text-2xl">{workflow.icon}</span>
            <div className="text-left">
              <div className="font-semibold">{workflow.name}</div>
              <div className="text-xs opacity-75">{workflow.description}</div>
            </div>
            {workflow.id === userRole && (
              <span className="ml-2 px-2 py-0.5 text-xs bg-primary text-primary-foreground rounded-full">
                Vous
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Current Workflow Info */}
      <div className={`rounded-lg border-2 ${currentWorkflow.bgColor} ${currentWorkflow.color} p-4`}>
        <div className="flex items-center gap-3">
          <span className="text-4xl">{currentWorkflow.icon}</span>
          <div>
            <h2 className="text-xl font-bold">Workflow {currentWorkflow.name}</h2>
            <p className="opacity-80">{currentWorkflow.description}</p>
          </div>
        </div>
      </div>

      {/* Visual Workflow Diagram */}
      <div className="rounded-lg border bg-card p-6">
        <h2 className="text-lg font-semibold mb-4">Flux de travail - {currentWorkflow.name}</h2>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {currentWorkflow.steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <button
                onClick={() => setActiveStep(step.id)}
                className={`flex flex-col items-center p-3 rounded-lg transition-all ${
                  activeStep === step.id
                    ? `${currentWorkflow.bgColor} ${currentWorkflow.color} scale-110 shadow-lg border-2 border-current`
                    : 'bg-muted hover:bg-muted/80'
                }`}
              >
                <span className="text-2xl">{step.icon}</span>
                <span className="text-xs font-medium mt-1 text-center max-w-[80px]">
                  {step.id}. {step.title.split(' ')[0]}
                </span>
              </button>
              {index < currentWorkflow.steps.length - 1 && (
                <div className="text-muted-foreground mx-1">→</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Details */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Steps List */}
        <div className="md:col-span-1 space-y-2">
          {currentWorkflow.steps.map((step) => (
            <button
              key={step.id}
              onClick={() => setActiveStep(step.id)}
              className={`w-full text-left p-3 rounded-lg border transition-all ${
                activeStep === step.id
                  ? `border-current ${currentWorkflow.bgColor} ${currentWorkflow.color}`
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                  activeStep === step.id
                    ? `${currentWorkflow.bgColor} ${currentWorkflow.color}`
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {step.id}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-sm">{step.title}</div>
                  <div className="text-xs text-muted-foreground">{step.module}</div>
                </div>
                <span className="text-xl">{step.icon}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Active Step Detail */}
        {currentStep && (
          <div className="md:col-span-2 rounded-lg border bg-card p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-3">
                  <span className="text-4xl">{currentStep.icon}</span>
                  <div>
                    <h3 className="text-xl font-bold">
                      Étape {currentStep.id}: {currentStep.title}
                    </h3>
                    <p className="text-muted-foreground">{currentStep.description}</p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleGoToModule(currentStep.route)}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Accéder au module →
              </button>
            </div>

            <div className="grid gap-6 md:grid-cols-2 mt-6">
              {/* What to do */}
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <span className="text-green-600">✓</span> Ce que vous pouvez faire
                </h4>
                <ul className="space-y-2">
                  {currentStep.details.map((detail, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <span className="text-primary mt-1">•</span>
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Tips */}
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <span className="text-amber-500">💡</span> Conseils pratiques
                </h4>
                <ul className="space-y-2">
                  {currentStep.tips.map((tip, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm bg-amber-50 dark:bg-amber-950/20 p-2 rounded">
                      <span className="text-amber-600 mt-0.5">→</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex justify-between mt-6 pt-4 border-t">
              <button
                onClick={() => setActiveStep(Math.max(1, activeStep - 1))}
                disabled={activeStep === 1}
                className="px-4 py-2 text-sm font-medium rounded-md border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted"
              >
                ← Étape précédente
              </button>
              <button
                onClick={() => setActiveStep(Math.min(currentWorkflow.steps.length, activeStep + 1))}
                disabled={activeStep === currentWorkflow.steps.length}
                className="px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90"
              >
                Étape suivante →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* All Workflows Summary */}
      <div className="rounded-lg border bg-gradient-to-r from-primary/5 to-primary/10 p-6">
        <h3 className="font-semibold text-lg mb-4">Résumé par profil</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {ROLE_WORKFLOWS.map((workflow) => (
            <div
              key={workflow.id}
              className={`rounded-lg p-4 ${workflow.bgColor} ${workflow.color}`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{workflow.icon}</span>
                <span className="font-bold">{workflow.name}</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {workflow.steps.map((step, idx) => (
                  <span key={step.id} className="text-sm">
                    {step.icon}
                    {idx < workflow.steps.length - 1 && ' → '}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
