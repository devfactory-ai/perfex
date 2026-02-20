# Guide Utilisateur - Module Boulangerie

Ce guide détaille les cas d'usage pour chaque rôle dans le module Boulangerie de Perfex ERP.

---

## Guide Gérant (demo@perfex.io)

Le gérant a accès à l'ensemble des fonctionnalités du système.

### Accès aux Modules

- Dashboard complet
- Boulangerie (tous les sous-modules)
- Recettes & Formulations
- Traçabilité HACCP
- Point de Vente
- Inventaire
- Ressources Humaines
- Finance
- Paramètres

### Cas d'Usage Quotidiens

#### 1. Consulter le Dashboard (Matin)

**Objectif** : Avoir une vue d'ensemble de l'activité

**Étapes** :
1. Se connecter avec `demo@perfex.io`
2. Accéder au Dashboard (`/bakery`)
3. Consulter les indicateurs :
   - Production du jour (vs objectif)
   - Stock de matières premières
   - Ventes en cours
   - Alertes à traiter

**Informations affichées** :
- CA du jour et du mois
- Production théorique vs réelle
- Taux de conformité qualité
- Alertes stock minimum

#### 2. Gérer les Articles (Stock)

**Objectif** : Maintenir le catalogue des matières premières

**Création d'un article** :
1. Accéder à `/bakery/articles`
2. Cliquer sur "Nouvel Article"
3. Renseigner :
   - Référence (ex: FAR-T65)
   - Nom (ex: Farine de blé T65)
   - Catégorie (farine, levure, etc.)
   - Unité de mesure (kg, L, unité)
   - Prix d'achat moyen
   - Seuils (minimum, optimal)
   - Fournisseur principal
4. Valider

**Modification** :
1. Cliquer sur l'article dans la liste
2. Modifier les champs souhaités
3. Enregistrer

#### 3. Configurer les Équipements

**Objectif** : Inventorier et paramétrer les équipements

**Ajout d'équipement** :
1. Accéder à `/bakery/maintenance`
2. Onglet "Équipements"
3. Cliquer sur "Nouvel Équipement"
4. Renseigner :
   - Nom, marque, modèle
   - Numéro de série
   - Date d'achat
   - Valeur
   - Durée garantie
5. Télécharger le manuel (PDF)
6. Valider

#### 4. Planifier la Maintenance Préventive

**Objectif** : Éviter les pannes par des interventions planifiées

**Création d'un plan** :
1. Accéder à `/bakery/maintenance`
2. Onglet "Plans préventifs"
3. Cliquer sur "Nouveau Plan"
4. Sélectionner l'équipement
5. Définir :
   - Périodicité (hebdo, mensuel, etc.)
   - Intervalle (ex: tous les 2 mois)
   - Checklist des actions
   - Durée estimée
6. Activer le plan

#### 5. Analyser les Rapports

**Objectif** : Piloter l'activité avec des données

**Consultation** :
1. Accéder à `/bakery/reports`
2. Sélectionner le type de rapport :
   - Quotidien : production, ventes
   - Hebdomadaire : évolutions, tendances
   - Mensuel : bilan complet
3. Choisir la période
4. Exporter en PDF ou Excel si besoin

---

## Guide Boulanger (boulanger@perfex.io)

Le boulanger est responsable de la production et du stock de matières premières.

### Accès aux Modules

- Dashboard (vue production)
- Boulangerie (stock, production, équipements)
- Recettes & Formulations
- Traçabilité HACCP
- Inventaire (lecture)

### Cas d'Usage Quotidiens

#### 1. Consulter le Planning Production

**Objectif** : Connaître les produits à fabriquer

**Étapes** :
1. Se connecter avec `boulanger@perfex.io`
2. Accéder au Dashboard (`/bakery`)
3. Consulter la section "Production du jour"
4. Voir les quantités prévues par produit

#### 2. Vérifier le Stock Matières Premières

**Objectif** : S'assurer de la disponibilité des ingrédients

**Étapes** :
1. Accéder à `/bakery/articles`
2. Filtrer par catégorie si besoin
3. Vérifier les niveaux de stock
4. Identifier les alertes (orange/rouge)

**Indicateurs couleurs** :
- 🟢 Vert : Stock OK (> optimal)
- 🟠 Orange : Stock bas (< optimal)
- 🔴 Rouge : Stock critique (< minimum)

#### 3. Enregistrer une Réception

**Objectif** : Saisir une livraison fournisseur

**Étapes** :
1. Accéder à `/bakery/stock`
2. Cliquer sur "Nouvelle Entrée"
3. Sélectionner l'article
4. Saisir :
   - Quantité reçue
   - Prix unitaire (bon de livraison)
   - Numéro de lot
   - Date de péremption (si applicable)
   - Référence BL fournisseur
5. Valider l'entrée

**Résultat** : Le stock et le PUMP sont mis à jour automatiquement.

#### 4. Enregistrer un Chariot en Pousse

**Objectif** : Tracer les chariots en chambre de pousse

**Étapes** :
1. Accéder à `/bakery/proofing`
2. Sélectionner la chambre de pousse
3. Cliquer sur "Entrée Chariot"
4. Saisir :
   - Numéro de chariot
   - Produits chargés (type + quantité)
   - Température mesurée
   - Humidité mesurée
5. Valider

**Suivi** :
- Le timer démarre automatiquement
- Alerte si temps optimal dépassé
- Notification "Prêt pour le four"

#### 5. Effectuer un Passage au Four

**Objectif** : Enregistrer la cuisson

**Étapes** :
1. Accéder à `/bakery/ovens`
2. Sélectionner le four disponible
3. Cliquer sur "Nouveau Passage"
4. Sélectionner le chariot (depuis liste pousse)
5. Définir :
   - Température de cuisson
   - Durée prévue
6. Lancer le timer

**Fin de cuisson** :
1. Cliquer sur "Fin cuisson"
2. Enregistrer la durée réelle
3. Transférer vers contrôle qualité

#### 6. Saisir un Contrôle Qualité

**Objectif** : Valider la conformité des produits

**Étapes** :
1. Accéder à `/bakery/quality`
2. Sélectionner le lot à contrôler
3. Pour chaque produit :
   - Marquer "Conforme" ou "Non conforme"
   - Si défaut : sélectionner le type (brûlé, sous-cuit, etc.)
   - Quantifier les rebuts
4. Valider le contrôle

**Impact** :
- Calcul automatique du taux de conformité
- Mise à jour des statistiques production

---

## Guide Vendeur (vente@perfex.io)

Le vendeur gère les ventes B2B et le point de vente.

### Accès aux Modules

- Dashboard (vue ventes)
- Boulangerie (ventes B2B)
- Point de Vente
- Inventaire (lecture seule)

### Cas d'Usage Quotidiens

#### 1. Consulter les Commandes du Jour

**Objectif** : Voir les livraisons à préparer

**Étapes** :
1. Se connecter avec `vente@perfex.io`
2. Accéder à `/bakery/sales`
3. Filtrer par "Date de livraison = Aujourd'hui"
4. Voir la liste des commandes

#### 2. Créer une Commande Client

**Objectif** : Enregistrer une nouvelle commande B2B

**Étapes** :
1. Accéder à `/bakery/sales`
2. Cliquer sur "Nouvelle Commande"
3. Sélectionner le client B2B
4. Ajouter les lignes de produits :
   - Sélectionner le produit
   - Saisir la quantité
   - Le prix est appliqué automatiquement
5. Définir la date de livraison souhaitée
6. Ajouter des commentaires si nécessaire
7. Enregistrer (statut "Brouillon")
8. Cliquer sur "Confirmer" pour valider

#### 3. Préparer une Commande

**Objectif** : Marquer une commande comme prête

**Étapes** :
1. Ouvrir la commande confirmée
2. Vérifier la disponibilité des produits
3. Cliquer sur "Marquer comme préparée"
4. Imprimer le bon de préparation

#### 4. Gérer les Clients B2B

**Objectif** : Maintenir la base clients

**Création client** :
1. Accéder à la liste clients B2B
2. Cliquer sur "Nouveau Client"
3. Renseigner :
   - Nom commercial
   - Type (restaurant, hôtel, etc.)
   - Contact principal
   - Téléphone, email
   - Adresse de livraison
   - Conditions de paiement
4. Valider

#### 5. Consulter l'Historique Ventes

**Objectif** : Analyser les performances commerciales

**Étapes** :
1. Accéder à `/bakery/sales`
2. Utiliser les filtres :
   - Par client
   - Par période
   - Par statut
3. Exporter les données si besoin

---

## Guide Livreur (livraison@perfex.io)

Le livreur gère les tournées de livraison.

### Accès aux Modules

- Dashboard (vue livreur)
- Boulangerie (livraisons uniquement)

### Cas d'Usage Quotidiens

#### 1. Consulter la Tournée du Jour

**Objectif** : Voir les livraisons à effectuer

**Étapes** :
1. Se connecter avec `livraison@perfex.io`
2. Accéder au Dashboard
3. Voir la liste des livraisons du jour
4. Consulter les détails :
   - Client et adresse
   - Heure souhaitée
   - Produits à livrer

#### 2. Charger le Véhicule

**Objectif** : Préparer les produits pour la tournée

**Étapes** :
1. Consulter la liste consolidée des produits
2. Vérifier physiquement les quantités
3. Charger le véhicule
4. Marquer les commandes comme "En livraison"

#### 3. Effectuer une Livraison

**Objectif** : Livrer et faire signer le client

**Étapes** :
1. Se rendre chez le client
2. Ouvrir la commande sur mobile
3. Remettre les produits
4. Vérifier les quantités avec le client
5. Saisir les écarts éventuels
6. Faire signer le client (écran tactile)
7. Prendre une photo de la livraison (optionnel)
8. Valider la livraison

**Résultat** :
- Le bon de livraison est généré
- Le client reçoit une confirmation email
- La commande passe en "Livrée"

#### 4. Signaler un Problème

**Objectif** : Documenter un incident de livraison

**Cas possibles** :
- Client absent
- Refus de livraison
- Produits manquants
- Produits endommagés

**Étapes** :
1. Ouvrir la commande
2. Cliquer sur "Signaler un problème"
3. Sélectionner le type de problème
4. Ajouter un commentaire
5. Prendre une photo si nécessaire
6. Valider

---

## Annexes

### Raccourcis Clavier

| Raccourci | Action |
|-----------|--------|
| `Ctrl+N` | Nouveau (selon contexte) |
| `Ctrl+S` | Enregistrer |
| `Ctrl+F` | Rechercher |
| `Esc` | Fermer modal |

### Codes Couleurs

| Couleur | Signification |
|---------|---------------|
| 🟢 Vert | Bon / Conforme / En stock |
| 🟡 Jaune | Attention / En cours |
| 🟠 Orange | Alerte / Stock bas |
| 🔴 Rouge | Critique / Erreur / Stock minimum |
| 🔵 Bleu | Information / En traitement |

### Contacts Support

- **Email** : support@devfactory.ai
- **Documentation** : docs/BAKERY_MODULE.md
