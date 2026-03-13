#!/bin/bash

# ============================================================
# 🎭 MemeGenius — Script de lancement
#
# Ce script fait TOUT pour toi :
# 1. Vérifie que Node.js est installé
# 2. Installe les dépendances du projet
# 3. Te rappelle de configurer ta clé API
# 4. Lance l'app en mode développement
#
# USAGE : Ouvre le Terminal, va dans le dossier du projet, et tape :
#   chmod +x start.sh && ./start.sh
# ============================================================

echo ""
echo "🎭 MemeGenius — Lancement du projet"
echo "===================================="
echo ""

# --- Vérifier Node.js ---
if ! command -v node &> /dev/null; then
    echo "❌ Node.js n'est pas installé !"
    echo ""
    echo "   Installe-le avec cette commande :"
    echo "   brew install node"
    echo ""
    echo "   (Si tu n'as pas brew, installe-le d'abord :"
    echo "   /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\")"
    echo ""
    exit 1
fi

NODE_VERSION=$(node --version)
echo "✅ Node.js trouvé : $NODE_VERSION"

# --- Vérifier la clé API ---
if [ -f .env.local ]; then
    if grep -q "COLLE-TA-CLE" .env.local; then
        echo ""
        echo "⚠️  Ta clé API n'est pas encore configurée !"
        echo ""
        echo "   1. Va sur https://console.anthropic.com"
        echo "   2. Crée une clé API"
        echo "   3. Ouvre le fichier .env.local avec un éditeur de texte"
        echo "   4. Remplace 'sk-ant-COLLE-TA-CLE-ICI' par ta vraie clé"
        echo ""
        echo "   Ensuite relance ce script."
        echo ""
        exit 1
    fi
    echo "✅ Fichier .env.local trouvé"
else
    echo "❌ Fichier .env.local manquant !"
    echo "   Crée-le avec : echo 'ANTHROPIC_API_KEY=ta-clé-ici' > .env.local"
    exit 1
fi

# --- Installer les dépendances ---
echo ""
echo "📦 Installation des dépendances (ça peut prendre 1-2 minutes)..."
echo ""
npm install

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Erreur d'installation. Essaie de supprimer node_modules et réessayer :"
    echo "   rm -rf node_modules && npm install"
    exit 1
fi

echo ""
echo "✅ Dépendances installées !"
echo ""
echo "===================================="
echo "🚀 Lancement de MemeGenius..."
echo ""
echo "   L'app sera disponible sur :"
echo "   👉  http://localhost:3000"
echo ""
echo "   Pour arrêter : Ctrl+C"
echo "===================================="
echo ""

# --- Lancer l'app ---
npm run dev
