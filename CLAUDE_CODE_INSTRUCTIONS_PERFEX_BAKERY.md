# Instructions Claude Code : Optimisation Perfex ERP pour Boulangerie

## Contexte du Projet

Tu vas optimiser et personnaliser **Perfex ERP** pour une boulangerie en Tunisie. Ce document contient toutes les spécifications techniques et fonctionnelles pour transformer Perfex en un ERP spécialisé pour le secteur de la boulangerie.

## Stack Technique

### Architecture Cible
- **Base** : Perfex ERP (PHP/CodeIgniter)
- **Migration vers** : Architecture cloud-native Cloudflare
  - Backend : Hono.js + Cloudflare Workers
  - Frontend : React 18 + Vite
  - Base de données : Cloudflare D1 (SQLite)
  - Storage : Cloudflare R2
  - Cache : Cloudflare KV

### Approche de Migration

Tu dois créer une architecture hybride permettant une migration progressive :

1. **Phase 1** : Modules personnalisés Perfex (PHP)
2. **Phase 2** : API REST pour découpler frontend/backend
3. **Phase 3** : Migration progressive vers Cloudflare Workers
4. **Phase 4** : Frontend React complet

## Modules à Développer

### Module 1 : Gestion des Stocks

#### Objectif
Gérer les matières premières (farine, semoule, sucre, levure, etc.) avec traçabilité complète.

#### Fonctionnalités Clés

**1.1 Catalogue des Articles**

```typescript
// Structure de données Article
interface Article {
  id: number;
  reference: string;
  nom: string;
  categorie: 'farine' | 'semoule' | 'levure' | 'additifs' | 'emballages' | 'autre';
  unite_mesure: 'kg' | 'L' | 'unite';
  prix_achat_moyen: number; // PUMP (Prix Unitaire Moyen Pondéré)
  stock_actuel: number;
  stock_minimum: number;
  stock_optimal: number;
  fournisseur_principal_id: number;
  fournisseurs_alternatifs: number[]; // IDs fournisseurs
  date_peremption?: Date; // Pour produits périssables
  actif: boolean;
  date_creation: Date;
  date_modification: Date;
}
```

**Instructions pour toi :**
- Créer table `bakery_articles` avec champs ci-dessus
- Créer CRUD complet avec interface Perfex AdminLTE
- Implémenter calcul PUMP automatique lors des entrées
- Ajouter validation : stock_minimum < stock_optimal
- Interface de recherche/filtrage par catégorie

**1.2 Mouvements de Stock**

```typescript
interface MouvementStock {
  id: number;
  article_id: number;
  type: 'entree' | 'sortie' | 'ajustement' | 'inventaire';
  quantite: number; // Positif pour entrée, négatif pour sortie
  motif: string;
  reference_document?: string; // Bon de livraison, bon de sortie, etc.
  numero_lot?: string; // Pour traçabilité
  date_mouvement: Date;
  responsable_id: number;
  commentaire?: string;
  valide: boolean; // Validation par superviseur
  date_validation?: Date;
}
```

**Instructions pour toi :**
- Table `bakery_mouvements_stock`
- Trigger pour mettre à jour `stock_actuel` dans `bakery_articles`
- Calcul PUMP lors des entrées : `nouveau_pump = (ancien_stock * ancien_pump + quantite_entree * prix_achat) / (ancien_stock + quantite_entree)`
- Interface saisie rapide entrée/sortie
- Historique complet avec filtres (date, type, article, responsable)

**1.3 Inventaire Quotidien**

```typescript
interface Inventaire {
  id: number;
  date_inventaire: Date;
  type: 'quotidien' | 'mensuel' | 'annuel';
  statut: 'en_cours' | 'termine' | 'valide';
  responsable_id: number;
  commentaire?: string;
  date_validation?: Date;
}

interface LigneInventaire {
  id: number;
  inventaire_id: number;
  article_id: number;
  stock_theorique: number;
  stock_reel: number;
  ecart: number; // stock_reel - stock_theorique
  ecart_valeur: number; // ecart * prix_achat_moyen
  justification?: string;
  photo_url?: string; // Photo du comptage
}
```

**Instructions pour toi :**
- Tables `bakery_inventaires` et `bakery_lignes_inventaire`
- Interface de comptage : liste articles avec input stock réel
- Calcul automatique écarts
- Génération mouvement ajustement après validation
- Dashboard écarts avec graphiques (Chart.js)

**1.4 Alertes Stock Minimum**

```typescript
interface AlerteStock {
  id: number;
  article_id: number;
  type_alerte: 'stock_minimum' | 'stock_optimal' | 'peremption_proche';
  stock_actuel: number;
  seuil_declenche: number;
  date_alerte: Date;
  notifie: boolean;
  date_notification?: Date;
  acquittee: boolean;
  date_acquittement?: Date;
}
```

**Instructions pour toi :**
- Table `bakery_alertes_stock`
- CRON job quotidien vérifiant stock_actuel < stock_minimum
- Intégration email SMTP Perfex pour notifications
- Intégration WhatsApp via API (Twilio ou équivalent)
- Interface dashboard alertes avec compteur badge

**1.5 Commandes Fournisseurs Automatiques**

```typescript
interface CommandeFournisseur {
  id: number;
  fournisseur_id: number;
  numero_commande: string;
  date_commande: Date;
  date_livraison_prevue?: Date;
  statut: 'brouillon' | 'envoyee' | 'confirmee' | 'recue' | 'annulee';
  montant_total: number;
  envoyee_par_email: boolean;
  envoyee_par_whatsapp: boolean;
  date_envoi?: Date;
}

interface LigneCommandeFournisseur {
  id: number;
  commande_id: number;
  article_id: number;
  quantite: number;
  prix_unitaire: number;
  montant_ligne: number;
}
```

**Instructions pour toi :**
- Tables `bakery_commandes_fournisseurs` et `bakery_lignes_commandes`
- Bouton "Générer commande auto" : analyse alertes stock et suggère quantités
- Calcul quantité suggérée : `stock_optimal - stock_actuel`
- Génération PDF bon de commande (bibliothèque TCPDF Perfex)
- Envoi email avec PDF attaché
- Envoi WhatsApp avec message + lien PDF

**1.6 Calculs Prévisionnels de Production**

```typescript
interface RecetteProduit {
  id: number;
  produit_id: number;
  nom_produit: string;
  rendement: number; // Combien d'unités produites
  unite_rendement: string; // Ex: "baguettes", "kg"
}

interface CompositionRecette {
  id: number;
  recette_id: number;
  article_id: number;
  quantite_necessaire: number; // Par unité de rendement
}
```

**Instructions pour toi :**
- Tables `bakery_recettes` et `bakery_compositions_recettes`
- Interface gestion recettes (CRUD)
- Calcul production théorique :
  ```
  Pour chaque article consommé (sortie stock):
    Pour chaque recette utilisant cet article:
      production_theorique = quantite_sortie / quantite_necessaire_recette * rendement
  ```
- Dashboard affichant production théorique jour/semaine/mois
- Export Excel tableau prévisionnel

---

### Module 2 : Production

#### Objectif
Suivre le processus de production : chambres de pousse, passage au four, contrôle qualité, comparaison théorique/réel.

#### Fonctionnalités Clés

**2.1 Gestion Chariots / Chambres de Pousse**

```typescript
interface ChariotPousse {
  id: number;
  numero_chariot: string;
  chambre_pousse_id: number;
  date_heure_entree: Date;
  date_heure_sortie?: Date;
  statut: 'en_pousse' | 'pret_four' | 'au_four' | 'termine';
  responsable_id: number;
  temperature?: number;
  humidite?: number;
  commentaire?: string;
}

interface LigneChariot {
  id: number;
  chariot_id: number;
  produit_id: number;
  quantite: number;
  poids_pate?: number; // En kg
}

interface ChambrePousse {
  id: number;
  nom: string;
  capacite_chariots: number;
  temperature_ideale: number;
  humidite_ideale: number;
  actif: boolean;
}
```

**Instructions pour toi :**
- Tables `bakery_chambres_pousse`, `bakery_chariots_pousse`, `bakery_lignes_chariot`
- Interface saisie rapide : scan code-barre chariot ou saisie manuelle
- Affichage temps réel chariots en cours (AJAX refresh toutes les 30 secondes)
- Notification si chariot dépasse temps optimal de pousse
- Statistiques : temps moyen pousse par produit

**2.2 Gestion Passage au Four**

```typescript
interface PassageFour {
  id: number;
  chariot_id: number;
  four_id: number;
  date_heure_entree: Date;
  date_heure_sortie?: Date;
  temperature: number;
  duree_cuisson_prevue: number; // En minutes
  duree_cuisson_reelle?: number;
  statut: 'en_cuisson' | 'termine' | 'incident';
  responsable_id: number;
  commentaire?: string;
}

interface Four {
  id: number;
  nom: string;
  type: 'rotatif' | 'sole' | 'tunnel' | 'autre';
  capacite_chariots: number;
  temperature_max: number;
  actif: boolean;
}
```

**Instructions pour toi :**
- Tables `bakery_fours`, `bakery_passages_four`
- Timer visuel pour cuisson en cours
- Alerte sonore/visuelle quand cuisson terminée
- Historique températures (pour analyse défauts)
- Dashboard occupation fours (planning visuel)

**2.3 Contrôle Qualité**

```typescript
interface ControlQualite {
  id: number;
  passage_four_id: number;
  date_controle: Date;
  controleur_id: number;
  conforme: boolean;
  commentaire?: string;
}

interface DefautProduction {
  id: number;
  controle_qualite_id: number;
  produit_id: number;
  type_defaut: 'brule' | 'sous_cuit' | 'deforme' | 'casse' | 'autre';
  quantite_defectueuse: number;
  photo_url?: string;
  responsable_production_id: number;
  cause_probable?: string;
  action_corrective?: string;
}
```

**Instructions pour toi :**
- Tables `bakery_controles_qualite`, `bakery_defauts_production`
- Interface contrôle : checkbox par produit (conforme/non-conforme)
- Upload photo défauts (Perfex upload handler)
- Statistiques défauts par responsable/période
- Alertes si taux rebut > seuil défini (ex: 5%)

**2.4 Comparaison Théorique vs Réel**

```typescript
interface ComparaisonProduction {
  id: number;
  date_comparaison: Date;
  produit_id: number;
  quantite_theorique: number; // Calculée depuis sorties stock
  quantite_entree_pousse: number; // Chariots
  quantite_sortie_four: number; // Après cuisson
  quantite_conforme: number; // Après contrôle qualité
  quantite_defectueuse: number;
  ecart_theorique_reel: number;
  taux_conformite: number; // quantite_conforme / quantite_sortie_four
  taux_perte: number; // ecart / quantite_theorique
}
```

**Instructions pour toi :**
- Table `bakery_comparaisons_production`
- CRON job quotidien générant comparaison
- Dashboard avec graphiques (Chart.js) :
  - Courbe production théorique vs réelle
  - Évolution taux conformité
  - Top 5 produits avec plus d'écarts
- Export Excel rapport quotidien

**2.5 Suivi Consommations Énergétiques**

```typescript
interface RelevéCompteur {
  id: number;
  date_releve: Date;
  type_compteur: 'gaz' | 'electricite' | 'eau';
  valeur_compteur: number;
  responsable_id: number;
  photo_compteur?: string;
}

interface ConsommationJournaliere {
  id: number;
  date_consommation: Date;
  type_energie: 'gaz' | 'electricite' | 'eau';
  consommation: number;
  cout_unitaire: number;
  cout_total: number;
  quantite_produite_jour: number; // Total produits
  ratio_consommation: number; // consommation / quantite_produite
}
```

**Instructions pour toi :**
- Tables `bakery_releves_compteurs`, `bakery_consommations`
- Interface saisie quotidienne : 3 inputs (gaz, élec, eau)
- Calcul automatique consommation = relevé_jour - relevé_veille
- Graphiques évolution consommations
- Calcul coût énergétique par produit
- Alertes si consommation anormale

---

### Module 3 : Maintenance

#### Objectif
GMAO (Gestion Maintenance Assistée par Ordinateur) pour équipements boulangerie.

#### Fonctionnalités Clés

**3.1 Inventaire Équipements**

```typescript
interface Equipement {
  id: number;
  nom: string;
  type: 'four' | 'petrin' | 'cylindre' | 'laminoir' | 'chambre_pousse' | 'diviseur' | 'faconneur' | 'congelateur' | 'autre';
  marque: string;
  modele: string;
  numero_serie: string;
  date_achat: Date;
  date_mise_service: Date;
  fournisseur_id: number;
  valeur_achat: number;
  duree_garantie_mois: number;
  date_fin_garantie: Date;
  emplacement: string;
  photo_url?: string;
  manuel_utilisation_url?: string;
  actif: boolean;
}
```

**Instructions pour toi :**
- Table `bakery_equipements`
- CRUD complet avec upload photo + PDF manuel
- Calcul automatique date_fin_garantie
- QR code par équipement (pour scan mobile)
- Interface liste avec filtres (type, actif, en garantie)

**3.2 Interventions Maintenance**

```typescript
interface Intervention {
  id: number;
  equipement_id: number;
  type: 'preventive' | 'corrective' | 'revision' | 'amelioration';
  date_intervention: Date;
  duree_minutes: number;
  nature_probleme?: string;
  actions_realisees: string;
  intervenant_interne_id?: number;
  intervenant_externe?: string; // Nom technicien externe
  societe_externe?: string;
  cout_main_oeuvre: number;
  statut: 'planifiee' | 'en_cours' | 'terminee' | 'annulee';
  arret_production: boolean;
  duree_arret_minutes?: number;
  commentaire?: string;
}

interface PieceUtilisee {
  id: number;
  intervention_id: number;
  piece_detachee_id: number;
  quantite: number;
  prix_unitaire: number;
  montant: number;
}
```

**Instructions pour toi :**
- Tables `bakery_interventions`, `bakery_pieces_utilisees`
- Formulaire intervention avec sélection équipement
- Calcul coût total intervention automatique
- Upload documents (facture, rapport technicien)
- Notification email/WhatsApp responsable maintenance

**3.3 Planning Maintenance Préventive**

```typescript
interface PlanMaintenancePreventive {
  id: number;
  equipement_id: number;
  type_periodicite: 'jours' | 'semaines' | 'mois' | 'heures_fonctionnement';
  intervalle: number; // Ex: tous les 3 mois
  prochaine_date_prevue?: Date;
  prochaines_heures_prevues?: number;
  checklist: string; // JSON des actions à faire
  duree_estimee_minutes: number;
  actif: boolean;
}

interface AlerteMaintenance {
  id: number;
  plan_id: number;
  equipement_id: number;
  date_alerte: Date;
  type_alerte: 'j_moins_7' | 'j_moins_3' | 'j_moins_1' | 'depassement';
  notifiee: boolean;
  acquittee: boolean;
}
```

**Instructions pour toi :**
- Tables `bakery_plans_maintenance`, `bakery_alertes_maintenance`
- CRON job quotidien vérifiant échéances
- Notification J-7, J-3, J-1
- Interface planning visuel (FullCalendar.js)
- Génération automatique intervention après alerte

**3.4 Gestion Pièces Détachées**

```typescript
interface PieceDetachee {
  id: number;
  reference: string;
  designation: string;
  equipements_compatibles: number[]; // IDs équipements
  stock_actuel: number;
  stock_minimum: number;
  prix_unitaire: number;
  fournisseur_id: number;
  delai_livraison_jours: number;
  photo_url?: string;
}

interface MouvementPiece {
  id: number;
  piece_id: number;
  type: 'entree' | 'sortie_intervention' | 'ajustement';
  quantite: number;
  intervention_id?: number;
  date_mouvement: Date;
  responsable_id: number;
}
```

**Instructions pour toi :**
- Tables `bakery_pieces_detachees`, `bakery_mouvements_pieces`
- CRUD pièces avec gestion stock
- Alertes stock minimum pièces critiques
- Historique utilisation par pièce
- Intégration avec module Stock (fournisseurs communs)

**3.5 Indicateurs Maintenance**

```typescript
interface IndicateurMaintenance {
  equipement_id: number;
  periode: Date; // Mois
  mtbf: number; // Mean Time Between Failures (heures)
  mttr: number; // Mean Time To Repair (minutes)
  disponibilite: number; // % temps disponible
  cout_maintenance_total: number;
  nombre_interventions_preventives: number;
  nombre_interventions_correctives: number;
  duree_arret_production_minutes: number;
}
```

**Instructions pour toi :**
- Table `bakery_indicateurs_maintenance` (calculée)
- CRON job mensuel calculant indicateurs
- Dashboard KPIs maintenance :
  - MTBF par équipement
  - MTTR moyen
  - Coûts maintenance mois/an
  - Ratio préventif/correctif
- Graphiques évolution indicateurs

---

### Module 4 : Ventes Multi-Canaux

#### Objectif
Gérer ventes livraison B2B ET ventes sur site avec logique complexe de calcul CA.

#### Fonctionnalités Clés

**4.1 Canal Livraisons B2B**

```typescript
interface ClientB2B {
  id: number;
  perfex_client_id: number; // Lien avec clients Perfex
  nom_commercial: string;
  type: 'restaurant' | 'hotel' | 'collectivite' | 'grossiste' | 'autre';
  contact_principal: string;
  telephone: string;
  adresse_livraison: string;
  conditions_paiement: string; // Ex: "30 jours fin de mois"
  prix_specifiques: boolean; // Si tarifs négociés
  actif: boolean;
}

interface CommandeLivraison {
  id: number;
  client_b2b_id: number;
  numero_commande: string;
  date_commande: Date;
  date_livraison_prevue: Date;
  heure_livraison_prevue: string;
  statut: 'brouillon' | 'confirmee' | 'preparee' | 'en_livraison' | 'livree' | 'facturee';
  montant_total_ht: number;
  montant_tva: number;
  montant_total_ttc: number;
  livreur_id?: number;
  commentaire?: string;
}

interface LigneCommandeLivraison {
  id: number;
  commande_id: number;
  produit_id: number;
  quantite_commandee: number;
  quantite_livree?: number;
  prix_unitaire_ht: number;
  montant_ligne_ht: number;
}
```

**Instructions pour toi :**
- Tables `bakery_clients_b2b`, `bakery_commandes_livraison`, `bakery_lignes_commande_livraison`
- CRUD commandes avec calcul automatique montants
- Génération PDF bon de livraison (TCPDF)
- Signature électronique client (Canvas HTML5)
- Interface livreur mobile (responsive)
- Suivi GPS livraisons (Google Maps API)

**4.2 Bon de Livraison et Signature**

```typescript
interface BonLivraison {
  id: number;
  commande_livraison_id: number;
  numero_bl: string;
  date_emission: Date;
  heure_depart?: Date;
  heure_arrivee?: Date;
  livreur_id: number;
  signature_client_data?: string; // Base64 image
  nom_signataire?: string;
  date_signature?: Date;
  latitude_signature?: number;
  longitude_signature?: number;
  photo_livraison_url?: string;
  commentaire_client?: string;
}
```

**Instructions pour toi :**
- Table `bakery_bons_livraison`
- Interface mobile signature :
  - Canvas HTML5 pour dessiner signature
  - Bouton "Capturer photo livraison"
  - Géolocalisation automatique
- Validation livraison met à jour stock (déduction)
- Email automatique BL au client

**4.3 Canal Vente sur Site**

```typescript
interface PointVente {
  id: number;
  nom: string;
  emplacement: string;
  actif: boolean;
}

interface SessionVente {
  id: number;
  point_vente_id: number;
  date_session: Date;
  periode: 'matin' | 'apres_midi';
  responsable_id: number;
  heure_ouverture: Date;
  heure_fermeture?: Date;
  statut: 'ouverte' | 'fermee' | 'validee';
  ca_calcule: number;
  ca_declare?: number;
  ecart_ca?: number;
}

interface StockPointVente {
  id: number;
  session_vente_id: number;
  produit_id: number;
  type_produit: 'pain' | 'patisserie';
  stock_debut: number; // Pour pâtisserie = stock_fin J-1
  entrees_jour: number; // Production du jour
  livraisons: number; // Quantités livrées (déduites)
  defectueux: number;
  stock_fin: number; // Comptage réel
  quantite_vendue_calculee: number;
  prix_unitaire: number;
  ca_produit: number;
}
```

**Instructions pour toi :**
- Tables `bakery_points_vente`, `bakery_sessions_vente`, `bakery_stock_point_vente`
- Interface ouverture session :
  - Sélection responsable
  - Validation stock J-1 pâtisserie (checkbox)
  - Signalement différences
- Calculs automatiques :
  ```
  PAINS (pas de report J-1):
    stock_debut = production_jour - livraisons
    quantite_vendue = stock_debut - stock_fin
    
  PÂTISSERIE (avec report J-1):
    stock_debut = stock_fin_session_precedente
    stock_disponible = stock_debut + entrees_jour - defectueux
    quantite_vendue = stock_disponible - livraisons - stock_fin
    
  CA = quantite_vendue * prix_unitaire
  ```

**4.4 Changement d'Équipe (Mi-Journée)**

```typescript
interface PassationEquipe {
  id: number;
  session_vente_matin_id: number;
  session_vente_apres_midi_id: number;
  date_passation: Date;
  heure_passation: Date;
  responsable_matin_id: number;
  responsable_apres_midi_id: number;
  validation_conjointe: boolean;
  signature_matin?: string;
  signature_apres_midi?: string;
  ca_matin_calcule: number;
  ca_matin_declare?: number;
  ecart?: number;
  commentaire?: string;
}
```

**Instructions pour toi :**
- Table `bakery_passations_equipe`
- Interface passation :
  - Affichage stock par produit
  - Input comptage par les 2 responsables
  - Signature conjointe (2 canvas)
  - Calcul CA matin automatique
  - Validation obligatoire avant fermeture matin
- Alerte si CA déclaré ≠ CA calculé (écart > 2%)

**4.5 Tableau Récapitulatif Quotidien**

```typescript
interface RecapitulatifVentesJour {
  date: Date;
  ca_livraisons_ht: number;
  ca_livraisons_ttc: number;
  ca_vente_sur_site_matin: number;
  ca_vente_sur_site_apres_midi: number;
  ca_vente_sur_site_total: number;
  ca_total_jour: number;
  nombre_livraisons: number;
  nombre_clients_sur_site_estime: number;
  panier_moyen: number;
  top_5_produits: {produit_id: number, quantite: number, ca: number}[];
}
```

**Instructions pour toi :**
- Vue SQL générée `v_recap_ventes_jour`
- Dashboard ventes avec :
  - KPIs clés (CA, nombre ventes, panier moyen)
  - Graphique CA par canal (pie chart)
  - Top produits (bar chart)
  - Évolution CA sur 30 jours (line chart)
- Export Excel récap quotidien
- Email automatique fin de journée à la direction

---

### Module 5 : Reporting & Analytics

#### Objectif
Tableaux de bord interactifs et rapports automatisés pour pilotage.

#### Fonctionnalités Clés

**5.1 Dashboards Interactifs**

```typescript
// Dashboard Stock
interface DashboardStock {
  articles_alerte_stock: number;
  valeur_stock_total: number;
  rotation_stock_moyen_jours: number;
  top_5_articles_consommes: Article[];
  alertes_actives: AlerteStock[];
  mouvements_recents: MouvementStock[];
}

// Dashboard Production
interface DashboardProduction {
  quantite_produite_jour: number;
  taux_conformite_jour: number;
  taux_rebut_jour: number;
  production_en_cours: ChariotPousse[];
  alertes_qualite: DefautProduction[];
  ecarts_theorique_reel: ComparaisonProduction[];
}

// Dashboard Ventes
interface DashboardVentes {
  ca_jour: number;
  ca_mois: number;
  evolution_ca_vs_mois_precedent: number;
  top_10_clients_b2b: {client: string, ca: number}[];
  top_10_produits: {produit: string, quantite: number, ca: number}[];
  panier_moyen_jour: number;
}

// Dashboard Maintenance
interface DashboardMaintenance {
  interventions_planifiees_7j: Intervention[];
  alertes_maintenance_actives: AlerteMaintenance[];
  equipements_en_panne: Equipement[];
  cout_maintenance_mois: number;
  mtbf_moyen: number;
  mttr_moyen: number;
}
```

**Instructions pour toi :**
- 4 dashboards séparés (Stock, Production, Ventes, Maintenance)
- Utiliser Chart.js pour graphiques
- Refresh AJAX toutes les 60 secondes
- Widgets cliquables menant aux détails
- Export PDF de chaque dashboard

**5.2 Rapports Automatisés**

```typescript
interface ConfigurationRapport {
  id: number;
  nom_rapport: string;
  type: 'quotidien' | 'hebdomadaire' | 'mensuel';
  template_id: number;
  destinataires_email: string[]; // Liste emails
  destinataires_whatsapp: string[]; // Numéros tél
  heure_envoi: string; // Ex: "18:00"
  jour_envoi?: number; // 1-7 pour hebdo, 1-31 pour mensuel
  actif: boolean;
  derniere_execution?: Date;
}

interface RapportGenere {
  id: number;
  configuration_id: number;
  date_generation: Date;
  periode_debut: Date;
  periode_fin: Date;
  fichier_pdf_url: string;
  envoye: boolean;
  date_envoi?: Date;
}
```

**Instructions pour toi :**
- Tables `bakery_config_rapports`, `bakery_rapports_generes`
- Templates de rapports :
  - Rapport quotidien : CA, production, alertes
  - Rapport hebdomadaire : évolutions, top produits
  - Rapport mensuel : compte résultat simplifié, marges
- CRON job génération et envoi automatique
- Intégration TCPDF pour PDF professionnels
- Archive rapports générés (30 jours)

**5.3 Exports Comptables**

```typescript
interface ExportComptable {
  id: number;
  periode_debut: Date;
  periode_fin: Date;
  type_export: 'ventes' | 'achats' | 'stocks' | 'complet';
  format: 'csv' | 'excel' | 'sage' | 'ciel';
  fichier_url: string;
  genere_par_id: number;
  date_generation: Date;
}
```

**Instructions pour toi :**
- Table `bakery_exports_comptables`
- Interface génération export :
  - Sélection période
  - Choix format
  - Téléchargement immédiat
- Formats supportés :
  - CSV standard
  - Excel (PHPExcel)
  - Sage Tunisie (format spécifique)
  - Ciel (format spécifique)
- Colonnes exports : date, libellé, débit, crédit, compte

---

## Intégrations Externes

### Email (SMTP)

**Configuration** : Utiliser système email Perfex existant

**Cas d'usage** :
- Alertes stock minimum
- Alertes maintenance préventive
- Rapports quotidiens/hebdomadaires/mensuels
- Bons de livraison clients
- Confirmation commandes fournisseurs

**Template emails** : Créer dans `application/views/bakery/emails/`

### WhatsApp Business API

**Provider recommandé** : Twilio ou équivalent compatible Tunisie

**Configuration** :
```php
// application/config/bakery_config.php
$config['whatsapp_enabled'] = true;
$config['whatsapp_provider'] = 'twilio'; // ou 'messagebird', 'whapi'
$config['whatsapp_api_key'] = 'YOUR_API_KEY';
$config['whatsapp_phone_number'] = '+216XXXXXXXX';
```

**Helper** :
```php
// application/helpers/bakery_whatsapp_helper.php
function send_whatsapp_message($to, $message, $media_url = null) {
    // Implémentation selon provider
}

function send_whatsapp_template($to, $template_name, $params) {
    // Templates WhatsApp Business
}
```

**Cas d'usage** :
- Alertes critiques temps réel (rupture stock critique, panne équipement)
- Confirmation commandes clients
- Notifications livreur
- Rappels maintenance urgente

---

## Architecture Base de Données

### Principes de Nommage

- Préfixe toutes les tables : `bakery_`
- Noms en snake_case : `bakery_articles`, `bakery_mouvements_stock`
- IDs auto-increment : `id` (PRIMARY KEY)
- Clés étrangères : `{table_source}_id` (ex: `article_id`, `fournisseur_id`)
- Dates : `date_creation`, `date_modification`, `date_xxx`
- Booléens : `actif`, `valide`, `notifie`, etc.

### Index Recommandés

Créer index sur :
- Clés étrangères (performances JOIN)
- Champs de recherche fréquente (date, statut, type)
- Champs utilisés dans WHERE/ORDER BY

Exemple :
```sql
CREATE INDEX idx_article_categorie ON bakery_articles(categorie);
CREATE INDEX idx_mouvement_date ON bakery_mouvements_stock(date_mouvement);
CREATE INDEX idx_commande_statut ON bakery_commandes_livraison(statut);
```

### Triggers Base de Données

**Mise à jour stock automatique** :
```sql
DELIMITER $$
CREATE TRIGGER after_mouvement_stock_insert
AFTER INSERT ON bakery_mouvements_stock
FOR EACH ROW
BEGIN
  UPDATE bakery_articles 
  SET stock_actuel = stock_actuel + NEW.quantite
  WHERE id = NEW.article_id;
END$$
DELIMITER ;
```

**Calcul PUMP** :
```sql
DELIMITER $$
CREATE TRIGGER after_entree_stock
AFTER INSERT ON bakery_mouvements_stock
FOR EACH ROW
BEGIN
  IF NEW.type = 'entree' AND NEW.quantite > 0 THEN
    UPDATE bakery_articles a
    SET prix_achat_moyen = (
      (a.stock_actuel * a.prix_achat_moyen + NEW.quantite * NEW.prix_achat) 
      / (a.stock_actuel + NEW.quantite)
    )
    WHERE id = NEW.article_id;
  END IF;
END$$
DELIMITER ;
```

---

## Interface Utilisateur

### Thème et Design

- Utiliser AdminLTE (déjà dans Perfex)
- Couleurs cohérentes (définir palette dans CSS custom)
- Icons Font Awesome pour actions
- Badges pour statuts (success, warning, danger)
- DataTables pour toutes les listes

### Responsive Design

- Toutes les interfaces doivent être **mobile-friendly**
- Tester sur viewport : 320px, 768px, 1024px, 1920px
- Utiliser Bootstrap grid system
- Forms verticaux sur mobile, horizontaux sur desktop

### UX Best Practices

**Saisie rapide** :
- Formulaires courts avec uniquement champs essentiels
- Auto-complétion (Select2) pour sélections
- Datepicker pour dates
- Validation HTML5 + JavaScript
- Messages de confirmation clairs

**Notifications** :
- Toasts (bibliothèque toastr.js) pour actions success/error
- Badge compteur alertes dans menu
- Modal pour confirmations actions critiques (suppression)

**Dashboard widgets** :
- Cartes cliquables
- Graphiques interactifs (hover pour détails)
- Filtres période (aujourd'hui, 7j, 30j, personnalisé)
- Bouton refresh manuel

---

## Sécurité

### Authentification et Autorisations

**Rôles Perfex à créer** :
- `bakery_admin` : Accès complet tous modules
- `bakery_stock_manager` : Module Stock uniquement
- `bakery_production_manager` : Module Production uniquement
- `bakery_maintenance_manager` : Module Maintenance uniquement
- `bakery_sales_manager` : Module Ventes uniquement
- `bakery_seller` : Vente sur site (saisie uniquement)
- `bakery_driver` : Interface livreur mobile

**Vérification permissions** :
```php
// Dans chaque controller
if (!has_permission('bakery_stock', '', 'view')) {
    access_denied('bakery_stock');
}
```

### Protection Données

- **SQL Injection** : Utiliser Query Builder Perfex/CodeIgniter
- **XSS** : Échapper toutes les sorties avec `html_escape()`
- **CSRF** : Utiliser tokens CSRF Perfex dans tous les forms
- **Upload files** : Valider extensions, renommer fichiers, stocker hors webroot si possible

### Logs d'Audit

```typescript
interface AuditLog {
  id: number;
  user_id: number;
  action: string; // Ex: "created_article", "deleted_commande"
  table_name: string;
  record_id: number;
  old_values?: string; // JSON
  new_values?: string; // JSON
  ip_address: string;
  user_agent: string;
  date_action: Date;
}
```

**Instructions pour toi :**
- Table `bakery_audit_logs`
- Logger toutes actions critiques (create, update, delete)
- Hook Perfex : `after_insert`, `after_update`, `after_delete`

---

## Performance et Optimisation

### Requêtes Optimisées

- Utiliser `JOIN` au lieu de boucles avec requêtes multiples
- Limiter `SELECT *` : sélectionner uniquement colonnes nécessaires
- Pagination toutes les listes (50 items/page)
- Indexes sur colonnes fréquemment filtrées

### Cache

**Perfex cache** :
```php
// Cache résultats lourds
$this->load->driver('cache', ['adapter' => 'file']);

// Get from cache
$data = $this->cache->get('bakery_dashboard_stock');

if (!$data) {
    // Generate data
    $data = $this->bakery_stock_model->get_dashboard_data();
    
    // Cache for 5 minutes
    $this->cache->save('bakery_dashboard_stock', $data, 300);
}
```

**Cache invalidation** :
- Supprimer cache lors de modifications données
- CRON job nettoyage cache ancien (> 24h)

### AJAX et Temps Réel

**Endpoints API REST** :
```php
// application/controllers/api/Bakery_api.php
class Bakery_api extends API_Controller {
    
    public function dashboard_stock_GET() {
        $data = $this->bakery_stock_model->get_dashboard_kpis();
        $this->response($data);
    }
    
    public function alerts_GET() {
        $alerts = $this->bakery_alerts_model->get_active_alerts();
        $this->response($alerts);
    }
}
```

**Frontend AJAX** :
```javascript
// Refresh dashboard toutes les 60 secondes
setInterval(function() {
    $.get('/api/bakery/dashboard_stock', function(data) {
        updateDashboardWidgets(data);
    });
}, 60000);
```

---

## Tâches CRON Requises

**Configuration** : Ajouter dans crontab serveur ou utiliser système CRON Perfex

```bash
# Vérification alertes stock (quotidien 8h)
0 8 * * * php /path/to/perfex/index.php bakery/cron/check_stock_alerts

# Génération comparaisons production (quotidien 23h)
0 23 * * * php /path/to/perfex/index.php bakery/cron/generate_production_comparison

# Vérification maintenance préventive (quotidien 9h)
0 9 * * * php /path/to/perfex/index.php bakery/cron/check_maintenance_alerts

# Rapports quotidiens (18h)
0 18 * * * php /path/to/perfex/index.php bakery/cron/send_daily_reports

# Calcul indicateurs maintenance (mensuel, 1er du mois 1h)
0 1 1 * * php /path/to/perfex/index.php bakery/cron/calculate_maintenance_kpis

# Nettoyage logs anciens (hebdomadaire dimanche 2h)
0 2 * * 0 php /path/to/perfex/index.php bakery/cron/cleanup_old_logs
```

---

## Migration vers Cloudflare (Phase 2)

### Stratégie de Migration Progressive

**Phase 2.1 : API REST découplée**
- Créer API REST complète dans Perfex
- Endpoints pour tous les modules
- Documentation OpenAPI/Swagger
- Authentification JWT

**Phase 2.2 : Frontend React progressif**
- Commencer par module le plus simple (ex: Maintenance)
- SPA React consommant API Perfex
- Déploiement Cloudflare Pages
- Coexistence avec UI Perfex

**Phase 2.3 : Migration backend vers Hono.js**
- Réécriture API en Hono.js + TypeScript
- Déploiement Cloudflare Workers
- Migration D1 depuis MySQL (scripts de migration)
- Tests parallèle (Perfex vs Cloudflare)

**Phase 2.4 : Bascule complète**
- Migration données définitive
- Redirection DNS
- Désactivation Perfex (conservation backup)

### Structure Cible Cloudflare

```
bakery-erp-cloudflare/
├── workers/              # Cloudflare Workers (Hono.js)
│   ├── api/
│   │   ├── stock.ts
│   │   ├── production.ts
│   │   ├── maintenance.ts
│   │   ├── sales.ts
│   │   └── reports.ts
│   ├── auth.ts
│   ├── db.ts            # D1 connection
│   └── index.ts         # Main worker
├── frontend/            # React app
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── services/    # API clients
│   │   └── App.tsx
│   └── vite.config.ts
├── database/
│   ├── schema.sql       # D1 schema
│   └── migrations/
├── wrangler.toml        # Cloudflare config
└── package.json
```

---

## Tests et Validation

### Tests Unitaires (Phase 2)

```typescript
// tests/api/stock.test.ts
import { describe, it, expect } from 'vitest';
import { calculatePUMP } from '../workers/api/stock';

describe('Stock calculations', () => {
  it('should calculate PUMP correctly', () => {
    const oldStock = 100;
    const oldPUMP = 10;
    const newQuantity = 50;
    const newPrice = 12;
    
    const result = calculatePUMP(oldStock, oldPUMP, newQuantity, newPrice);
    expect(result).toBe(10.67); // (100*10 + 50*12) / 150
  });
});
```

### Tests End-to-End

```typescript
// tests/e2e/stock-workflow.spec.ts
import { test, expect } from '@playwright/test';

test('Stock entry workflow', async ({ page }) => {
  await page.goto('/stock/entries/new');
  
  // Fill form
  await page.fill('#article_id', '1');
  await page.fill('#quantity', '100');
  await page.fill('#price', '10.5');
  
  // Submit
  await page.click('button[type="submit"]');
  
  // Verify alert
  await expect(page.locator('.alert-success')).toBeVisible();
  
  // Verify stock updated
  const stockValue = await page.locator('#stock-value').textContent();
  expect(stockValue).toBe('1050');
});
```

### Checklist Validation Projet

- [ ] Tous les modules CRUD fonctionnels
- [ ] Calculs automatiques corrects (PUMP, CA, écarts)
- [ ] Alertes email/WhatsApp opérationnelles
- [ ] Rapports PDF générés correctement
- [ ] Dashboards affichent données temps réel
- [ ] Permissions rôles respectées
- [ ] Mobile responsive (testé tablette/smartphone)
- [ ] Performance : temps réponse < 2s
- [ ] Pas d'erreurs PHP/JavaScript console
- [ ] Base de données sauvegardée quotidiennement
- [ ] Documentation technique complète
- [ ] Formation utilisateurs effectuée

---

## Documentation à Produire

### Documentation Technique

**architecture.md** :
- Schéma architecture globale
- Diagramme entité-relation base de données
- Flow des processus métier
- APIs endpoints documentation

**deployment.md** :
- Prérequis serveur (PHP, MySQL versions)
- Instructions installation
- Configuration CRON jobs
- Configuration email/WhatsApp
- Troubleshooting commun

**api-reference.md** :
- Liste complète endpoints REST
- Paramètres requêtes
- Format réponses
- Exemples curl

### Documentation Utilisateur

**manuel-admin.md** :
- Gestion utilisateurs et rôles
- Configuration générale système
- Gestion fournisseurs/clients
- Maintenance base de données

**manuel-stock.md** :
- Gestion articles
- Entrées/sorties stock
- Inventaires
- Commandes fournisseurs

**manuel-production.md** :
- Gestion chariots et fours
- Contrôle qualité
- Suivi consommations

**manuel-ventes.md** :
- Commandes livraison
- Vente sur site
- Passations équipes

**manuel-maintenance.md** :
- Gestion équipements
- Interventions
- Planning préventif

---

## Priorisation Développement

### Sprint 1 (Semaines 1-2) : Fondations
- [ ] Setup environnement Perfex
- [ ] Création tables base de données
- [ ] Module Stock : CRUD articles
- [ ] Module Stock : Mouvements basiques
- [ ] Tests basiques

### Sprint 2 (Semaines 3-4) : Stock Avancé
- [ ] Inventaires
- [ ] Alertes stock minimum
- [ ] Commandes fournisseurs
- [ ] Calculs prévisionnels
- [ ] Integration email

### Sprint 3 (Semaines 5-6) : Production
- [ ] Gestion chariots/chambres pousse
- [ ] Gestion fours
- [ ] Contrôle qualité
- [ ] Comparaisons théorique/réel
- [ ] Suivi énergies

### Sprint 4 (Semaines 7-8) : Maintenance
- [ ] Inventaire équipements
- [ ] Interventions
- [ ] Planning préventif
- [ ] Pièces détachées
- [ ] Indicateurs MTBF/MTTR

### Sprint 5 (Semaines 9-10) : Ventes
- [ ] Commandes livraison B2B
- [ ] Bons de livraison + signatures
- [ ] Vente sur site
- [ ] Passations équipes
- [ ] Calculs CA complexes

### Sprint 6 (Semaines 11-12) : Analytics & Polish
- [ ] Dashboards interactifs
- [ ] Rapports automatisés
- [ ] Exports comptables
- [ ] Integration WhatsApp
- [ ] Tests finaux
- [ ] Documentation

---

## Points d'Attention Critiques

### 1. Calculs CA Ventes Sur Site

C'est la partie la **plus complexe** du projet. Assure-toi de :
- Bien comprendre logique différente pains vs pâtisserie
- Tester avec données réelles
- Valider avec client les formules
- Gérer edge cases (pas de production, pas de comptage)

### 2. Performance Base de Données

Avec données temps réel et historiques :
- Archiver données anciennes (> 2 ans)
- Partitionner grandes tables si nécessaire
- Monitoring requêtes lentes (slow query log)
- Index bien définis

### 3. Intégrations Externes

WhatsApp API peut être complexe :
- Prévoir fallback email si WhatsApp down
- Gérer rate limits provider
- Logs tous les envois (debug)
- Tests avec vrais numéros avant prod

### 4. Mobile UX

Plusieurs interfaces mobiles critiques :
- Livreur : signature, géolocalisation
- Vendeur : comptage stocks rapide
- Production : saisie chariots/fours

Tester intensivement sur appareils réels.

### 5. Sécurité Données Sensibles

- CA et données financières : accès restreint
- Logs audit complets
- Backup quotidien automatique
- Chiffrement base de données (si possible)

---

## Ressources et Références

### Documentation Perfex
- https://help.perfexcrm.com/
- https://docs.perfexcrm.com/api/

### Bibliothèques PHP Recommandées
- TCPDF : Génération PDF
- PHPExcel : Export Excel
- CodeIgniter Query Builder : Requêtes sécurisées

### Bibliothèques JavaScript Recommandées
- Chart.js : Graphiques
- DataTables : Tables interactives
- Select2 : Auto-complétion
- FullCalendar : Planning visuel
- toastr : Notifications
- Signature Pad : Signatures électroniques

### APIs Externes
- Twilio : WhatsApp Business API
- Google Maps : Géolocalisation livraisons

---

## Questions à Clarifier avec le Client

Avant de commencer, confirme ces points :

1. **Fournisseurs actuels** : Liste des fournisseurs matières premières
2. **Produits** : Liste exhaustive produits (pains + pâtisserie)
3. **Équipements** : Inventaire précis (marque, modèle, année)
4. **Prix vente** : Grille tarifaire complète
5. **Workflow actuel** : Comment ils gèrent aujourd'hui (Excel, papier ?)
6. **Volumes** : Combien de commandes/jour, production/jour ?
7. **Utilisateurs** : Combien de personnes utiliseront le système ?
8. **Mobile** : Quels appareils (Android, iOS, tablettes) ?
9. **Internet** : Qualité connexion (pour temps réel) ?
10. **Intégration comptable** : Quel logiciel comptable utilisent-ils ?

---

## Livrables Attendus

À la fin du projet, tu dois fournir :

### Code
- [ ] Repository Git complet avec historique
- [ ] Code commenté (PHPDoc)
- [ ] Tests unitaires (si migration Cloudflare)
- [ ] Scripts SQL (schema + données exemple)

### Documentation
- [ ] README.md (installation)
- [ ] Documentation technique complète
- [ ] Manuels utilisateurs (PDF)
- [ ] Vidéos tutoriels (10-15 vidéos courtes)

### Déploiement
- [ ] Instance Perfex configurée
- [ ] Base de données créée
- [ ] CRON jobs configurés
- [ ] Emails/WhatsApp opérationnels
- [ ] Backup automatique en place

### Formation
- [ ] Formation administrateurs (1 jour)
- [ ] Formation utilisateurs par module (0.5 jour/module)
- [ ] Support 1 mois post-livraison

---

## Conclusion

Ce document te donne toutes les spécifications pour transformer Perfex en ERP boulangerie complet. 

**Approche recommandée** :
1. Commence par Module Stock (fondation)
2. Ensuite Production (utilise données Stock)
3. Puis Ventes (utilise données Production)
4. Maintenance en parallèle (indépendant)
5. Finalise avec Reporting (agrège tout)

**Communication** :
- Démos hebdomadaires au client
- Validation module par module
- Tests utilisateurs réels dès que possible

**Qualité** :
- Code propre et documenté
- Performances optimisées
- UX intuitive
- Sécurité renforcée

Bonne chance ! N'hésite pas si tu as des questions sur les spécifications.
