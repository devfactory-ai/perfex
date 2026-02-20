#!/bin/bash

# Script de Déploiement des Variantes Perfex
# Ce script déploie les différentes variantes (bakery, health, full)

set -e  # Arrêter en cas d'erreur

echo "======================================="
echo "   Déploiement des Variantes Perfex"
echo "======================================="
echo ""

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages
info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

header() {
    echo -e "${BLUE}=== $1 ===${NC}"
}

# Définir le répertoire racine
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# Vérifier que wrangler est installé
if ! command -v wrangler &> /dev/null; then
    error "Wrangler CLI n'est pas installé"
    echo "Installer avec: npm install -g wrangler"
    exit 1
fi

# Vérifier l'authentification
info "Vérification de l'authentification Cloudflare..."
if ! wrangler whoami &> /dev/null; then
    error "Non authentifié avec Cloudflare"
    echo "Exécuter: wrangler login"
    exit 1
fi

info "Authentifié avec Cloudflare"
echo ""

# Fonction de déploiement pour une variante
deploy_variant() {
    local VARIANT=$1
    local PROJECT_NAME=$2
    local APP_NAME=$3

    header "Déploiement $APP_NAME"

    cd "$ROOT_DIR/apps/web"

    # Set environment variables
    export VITE_APP_VARIANT="$VARIANT"
    export VITE_APP_NAME="$APP_NAME"
    export VITE_API_URL="${VITE_API_URL:-https://perfex-api-staging.yassine-techini.workers.dev}"

    info "Variante: $VITE_APP_VARIANT"
    info "API URL: $VITE_API_URL"

    # Build
    info "Construction de l'application..."
    npm run build

    # Deploy
    info "Déploiement vers Cloudflare Pages..."
    npx wrangler pages deploy dist --project-name="$PROJECT_NAME" --branch=main

    echo ""
    info "$APP_NAME déployé avec succès!"
    echo "URL: https://$PROJECT_NAME.pages.dev"
    echo ""

    cd "$ROOT_DIR"
}

# Menu de sélection
echo "Quelle variante voulez-vous déployer?"
echo "1) Perfex Bakery (Solution Boulangerie)"
echo "2) Perfex Health (Solution Santé)"
echo "3) Perfex Full (ERP Complet)"
echo "4) Toutes les variantes"
echo ""
read -p "Choisir (1-4): " choice

case $choice in
    1)
        deploy_variant "perfex-bakery" "perfex-bakery" "Perfex Bakery"
        ;;
    2)
        deploy_variant "perfex-health" "perfex-health" "Perfex Health"
        ;;
    3)
        deploy_variant "perfex-full" "perfex-web-staging" "Perfex ERP"
        ;;
    4)
        deploy_variant "perfex-bakery" "perfex-bakery" "Perfex Bakery"
        deploy_variant "perfex-health" "perfex-health" "Perfex Health"
        deploy_variant "perfex-full" "perfex-web-staging" "Perfex ERP"
        ;;
    *)
        error "Choix invalide"
        exit 1
        ;;
esac

echo ""
echo "========================================="
echo "   Déploiement terminé avec succès!"
echo "========================================="
echo ""
echo "URLs des variantes:"
echo "  - Perfex Bakery: https://perfex-bakery.pages.dev"
echo "  - Perfex Health: https://perfex-health.pages.dev"
echo "  - Perfex Full:   https://perfex-web-staging.pages.dev"
echo ""
