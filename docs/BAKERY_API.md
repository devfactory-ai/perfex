# API Boulangerie - Spécifications Techniques

## Base URL

- **Staging** : `https://perfex-api-staging.yassine-techini.workers.dev/api/v1`
- **Production** : `https://perfex-api.yassine-techini.workers.dev/api/v1`

## Authentification

### Login

```http
POST /auth/login
Content-Type: application/json

{
  "email": "demo@perfex.io",
  "password": "Demo@2024!"
}
```

**Réponse** :
```json
{
  "data": {
    "user": {
      "id": "user-demo-001",
      "email": "demo@perfex.io",
      "firstName": "Jean-Pierre",
      "lastName": "Dupont"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
}
```

### Utilisation du Token

```http
Authorization: Bearer <accessToken>
```

---

## Module Stock

### Articles (Matières Premières)

#### Lister les Articles

```http
GET /bakery/articles
Authorization: Bearer <token>
```

**Paramètres Query** :
| Paramètre | Type | Description |
|-----------|------|-------------|
| `category` | string | Filtrer par catégorie (farine, levure, etc.) |
| `search` | string | Recherche par nom ou référence |
| `limit` | number | Nombre de résultats (défaut: 50) |
| `offset` | number | Pagination |

**Réponse** :
```json
{
  "data": [
    {
      "id": "art-001",
      "reference": "FAR-T65",
      "name": "Farine de blé T65",
      "category": "farine",
      "unitOfMeasure": "kg",
      "averagePurchasePrice": 0.90,
      "currentStock": 400,
      "minimumStock": 80,
      "optimalStock": 250,
      "mainSupplierId": "sup-001",
      "isActive": true
    }
  ],
  "pagination": {
    "total": 35,
    "limit": 50,
    "offset": 0
  }
}
```

#### Créer un Article

```http
POST /bakery/articles
Authorization: Bearer <token>
Content-Type: application/json

{
  "reference": "FAR-NEW",
  "name": "Nouvelle Farine",
  "category": "farine",
  "unitOfMeasure": "kg",
  "averagePurchasePrice": 1.05,
  "minimumStock": 50,
  "optimalStock": 150,
  "mainSupplierId": "sup-001"
}
```

#### Mettre à jour un Article

```http
PUT /bakery/articles/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "averagePurchasePrice": 1.10,
  "optimalStock": 200
}
```

#### Supprimer un Article

```http
DELETE /bakery/articles/:id
Authorization: Bearer <token>
```

### Mouvements de Stock

#### Lister les Mouvements

```http
GET /bakery/stock-movements
Authorization: Bearer <token>
```

**Paramètres Query** :
| Paramètre | Type | Description |
|-----------|------|-------------|
| `articleId` | string | Filtrer par article |
| `type` | string | Type: entree, sortie, ajustement |
| `startDate` | string | Date début (ISO 8601) |
| `endDate` | string | Date fin (ISO 8601) |
| `validated` | boolean | Uniquement validés |

#### Créer un Mouvement

```http
POST /bakery/stock-movements
Authorization: Bearer <token>
Content-Type: application/json

{
  "articleId": "art-001",
  "type": "entree",
  "quantity": 500,
  "reason": "Réception commande CF-2024-002",
  "documentReference": "BL-GMP-2024-5678",
  "lotNumber": "LOT-2024-02-20",
  "purchasePrice": 0.92
}
```

**Calculs automatiques** :
- Stock actuel mis à jour
- PUMP recalculé pour les entrées : `nouveau_pump = (stock * pump + qty * prix) / (stock + qty)`

### Inventaires

#### Lister les Inventaires

```http
GET /bakery/inventories
Authorization: Bearer <token>
```

#### Créer un Inventaire

```http
POST /bakery/inventories
Authorization: Bearer <token>
Content-Type: application/json

{
  "type": "mensuel",
  "scheduledDate": "2024-02-20",
  "notes": "Inventaire février"
}
```

#### Saisir une Ligne d'Inventaire

```http
POST /bakery/inventories/:id/lines
Authorization: Bearer <token>
Content-Type: application/json

{
  "articleId": "art-001",
  "actualStock": 395
}
```

---

## Module Production

### Chambres de Pousse

#### Lister les Chambres

```http
GET /bakery/proofing-chambers
Authorization: Bearer <token>
```

**Réponse** :
```json
{
  "data": [
    {
      "id": "pc-001",
      "name": "Chambre pousse 1",
      "cartCapacity": 8,
      "idealTemperature": 28,
      "idealHumidity": 85,
      "isActive": true,
      "currentCarts": 3
    }
  ]
}
```

#### Entrée de Chariot

```http
POST /bakery/proofing-carts
Authorization: Bearer <token>
Content-Type: application/json

{
  "chamberId": "pc-001",
  "cartNumber": "CH-042",
  "products": [
    { "productId": "prod-001", "quantity": 24, "pastWeight": 3.5 }
  ],
  "temperature": 27.5,
  "humidity": 82
}
```

#### Sortie de Chariot

```http
PUT /bakery/proofing-carts/:id/exit
Authorization: Bearer <token>
```

### Fours

#### Lister les Fours

```http
GET /bakery/ovens
Authorization: Bearer <token>
```

#### Démarrer une Cuisson

```http
POST /bakery/oven-sessions
Authorization: Bearer <token>
Content-Type: application/json

{
  "ovenId": "oven-001",
  "cartId": "cart-042",
  "temperature": 240,
  "plannedDuration": 25
}
```

#### Terminer une Cuisson

```http
PUT /bakery/oven-sessions/:id/end
Authorization: Bearer <token>
Content-Type: application/json

{
  "actualDuration": 27,
  "notes": "Cuisson légèrement prolongée"
}
```

### Contrôle Qualité

#### Saisir un Contrôle

```http
POST /bakery/quality-controls
Authorization: Bearer <token>
Content-Type: application/json

{
  "ovenSessionId": "session-001",
  "results": [
    {
      "productId": "prod-001",
      "conformQuantity": 22,
      "defects": [
        { "type": "brule", "quantity": 2, "cause": "Température trop haute" }
      ]
    }
  ]
}
```

---

## Module Ventes

### Clients B2B

#### Lister les Clients

```http
GET /bakery/b2b-clients
Authorization: Bearer <token>
```

#### Créer un Client

```http
POST /bakery/b2b-clients
Authorization: Bearer <token>
Content-Type: application/json

{
  "commercialName": "Restaurant La Table",
  "type": "restaurant",
  "mainContact": "Jean Martin",
  "phone": "+33 1 42 33 44 55",
  "email": "contact@latable.fr",
  "deliveryAddress": "15 Rue de la Gaîté, 75014 Paris",
  "paymentTerms": "Net 30"
}
```

### Commandes de Livraison

#### Lister les Commandes

```http
GET /bakery/delivery-orders
Authorization: Bearer <token>
```

**Paramètres Query** :
| Paramètre | Type | Description |
|-----------|------|-------------|
| `status` | string | Statut: brouillon, confirmee, preparee, en_livraison, livree |
| `clientId` | string | Filtrer par client |
| `deliveryDate` | string | Date de livraison |

#### Créer une Commande

```http
POST /bakery/delivery-orders
Authorization: Bearer <token>
Content-Type: application/json

{
  "clientId": "client-001",
  "expectedDeliveryDate": "2024-02-21",
  "expectedDeliveryTime": "06:30",
  "lines": [
    { "productId": "prod-001", "quantity": 20, "unitPrice": 1.18 },
    { "productId": "prod-002", "quantity": 15, "unitPrice": 1.27 }
  ],
  "notes": "Livraison par entrée de service"
}
```

#### Mettre à jour le Statut

```http
PUT /bakery/delivery-orders/:id/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "livree",
  "deliveredQuantities": [
    { "lineId": "line-001", "delivered": 20 },
    { "lineId": "line-002", "delivered": 14 }
  ],
  "signature": "data:image/png;base64,...",
  "signatureName": "M. Dupont"
}
```

---

## Module Maintenance

### Équipements

#### Lister les Équipements

```http
GET /bakery/equipment
Authorization: Bearer <token>
```

#### Créer un Équipement

```http
POST /bakery/equipment
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Four rotatif Bongard",
  "type": "four",
  "brand": "Bongard",
  "model": "Cervap MR 2000",
  "serialNumber": "BG-2024-1234",
  "purchaseDate": "2024-01-15",
  "purchaseValue": 45000,
  "warrantyMonths": 24,
  "location": "Atelier principal"
}
```

### Interventions

#### Lister les Interventions

```http
GET /bakery/maintenance-interventions
Authorization: Bearer <token>
```

#### Créer une Intervention

```http
POST /bakery/maintenance-interventions
Authorization: Bearer <token>
Content-Type: application/json

{
  "equipmentId": "equip-001",
  "type": "preventive",
  "description": "Révision mensuelle four",
  "plannedDate": "2024-02-25",
  "estimatedDuration": 60,
  "checklist": [
    "Nettoyage brûleurs",
    "Vérification joints",
    "Contrôle température"
  ]
}
```

### Plans de Maintenance

#### Lister les Plans

```http
GET /bakery/maintenance-plans
Authorization: Bearer <token>
```

#### Créer un Plan

```http
POST /bakery/maintenance-plans
Authorization: Bearer <token>
Content-Type: application/json

{
  "equipmentId": "equip-001",
  "periodicityType": "mois",
  "interval": 1,
  "checklist": ["Nettoyage", "Vérification", "Lubrification"],
  "estimatedDuration": 60
}
```

---

## Module Rapports

### Rapports Générés

#### Rapport de Production

```http
GET /bakery/reports/production
Authorization: Bearer <token>
```

**Paramètres Query** :
| Paramètre | Type | Description |
|-----------|------|-------------|
| `date` | string | Date du rapport |
| `period` | string | Période: day, week, month |

**Réponse** :
```json
{
  "data": {
    "period": {
      "start": "2024-02-20",
      "end": "2024-02-20"
    },
    "production": {
      "theoretical": 1250,
      "actual": 1180,
      "variance": -70,
      "conformityRate": 0.96
    },
    "byProduct": [
      {
        "productId": "prod-001",
        "name": "Baguette tradition",
        "theoretical": 500,
        "actual": 480,
        "defects": 5
      }
    ],
    "energyConsumption": {
      "gas": 125.5,
      "electricity": 89.2
    }
  }
}
```

#### Rapport de Ventes

```http
GET /bakery/reports/sales
Authorization: Bearer <token>
```

**Paramètres Query** :
| Paramètre | Type | Description |
|-----------|------|-------------|
| `startDate` | string | Date début |
| `endDate` | string | Date fin |
| `channel` | string | Canal: b2b, pos, all |

---

## Seed Data

### Exécuter le Seed Bakery

```http
POST /seed/bakery
X-Seed-Key: perfex-demo-2024
```

**Réponse** :
```json
{
  "success": true,
  "message": "Boulangerie Au Pain Doré créée avec succès!",
  "data": {
    "organization": {
      "id": "org-xxx",
      "name": "Boulangerie Au Pain Doré"
    },
    "accounts": [
      { "role": "Gérant", "email": "demo@perfex.io", "password": "Demo@2024!" },
      { "role": "Boulanger", "email": "boulanger@perfex.io", "password": "Baker@2024!" },
      { "role": "Vendeur", "email": "vente@perfex.io", "password": "Sales@2024!" },
      { "role": "Livreur", "email": "livraison@perfex.io", "password": "Delivery@2024!" }
    ],
    "stats": {
      "articles": 10,
      "products": 8,
      "equipment": 3,
      "clients": 3,
      "suppliers": 3
    }
  }
}
```

### Vérifier le Statut du Seed

```http
GET /seed/status
```

**Réponse** :
```json
{
  "success": true,
  "data": {
    "hasBakeryOrg": true,
    "bakeryProducts": 8,
    "bakeryArticles": 10,
    "seeded": true
  }
}
```

---

## Codes d'Erreur

| Code | Description |
|------|-------------|
| `400` | Bad Request - Paramètres invalides |
| `401` | Unauthorized - Token manquant ou expiré |
| `403` | Forbidden - Permissions insuffisantes |
| `404` | Not Found - Ressource inexistante |
| `409` | Conflict - Conflit de données (ex: doublon) |
| `429` | Too Many Requests - Rate limit dépassé |
| `500` | Internal Server Error |

**Format erreur** :
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Le champ 'quantity' est requis",
    "details": {
      "field": "quantity",
      "rule": "required"
    }
  }
}
```

---

## Rate Limiting

- **Login** : 5 tentatives / 15 minutes
- **API générale** : 100 requêtes / minute
- **Export/Rapports** : 10 requêtes / minute

---

## Webhooks (Futur)

Endpoints pour recevoir des notifications :

| Événement | Description |
|-----------|-------------|
| `stock.low` | Stock passé sous le minimum |
| `order.created` | Nouvelle commande créée |
| `order.delivered` | Commande livrée |
| `maintenance.due` | Maintenance préventive à venir |
