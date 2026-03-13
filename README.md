# 🎭 MemeGenius — Générateur de memes IA

## C'est quoi ?

Une app web où tu tapes une idée → l'IA génère 4 memes différents avec les
bons templates et les bonnes captions. Tu choisis ton préféré, tu édites
le texte si besoin, et tu le partages.

## Comment lancer le projet

### Prérequis (une seule fois)

**1. Installer Homebrew** (gestionnaire de paquets Mac)

Ouvre le Terminal (Cmd+Espace → tape "Terminal") et colle :

```
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

**2. Installer Node.js**

```
brew install node
```

Vérifie avec `node --version` → tu dois voir un numéro.

**3. Obtenir une clé API Anthropic**

- Va sur https://console.anthropic.com
- Crée un compte
- Va dans Settings → API Keys → Create Key
- Copie la clé (elle commence par `sk-ant-...`)

### Lancer l'app

**4. Ouvre le Terminal dans le dossier du projet**

Si tu as téléchargé le zip, dézippe-le, puis dans le Terminal :

```
cd ~/Downloads/memegenius    # adapte le chemin si nécessaire
```

**5. Configure ta clé API**

Ouvre le fichier `.env.local` avec un éditeur de texte et remplace
`sk-ant-COLLE-TA-CLE-ICI` par ta vraie clé.

Tu peux aussi le faire depuis le Terminal :

```
nano .env.local
```

(modifie la ligne, puis Ctrl+X → Y → Enter pour sauvegarder)

**6. Lance le script de démarrage**

```
chmod +x start.sh && ./start.sh
```

OU manuellement :

```
npm install
npm run dev
```

**7. Ouvre ton navigateur**

Va sur http://localhost:3000 — c'est parti ! 🎉

## Structure du projet

```
memegenius/
├── app/
│   ├── page.tsx              ← La page principale (ce que tu vois)
│   ├── layout.tsx            ← Le template HTML de base
│   ├── globals.css           ← Les styles globaux
│   └── api/
│       └── generate/
│           └── route.ts      ← Le backend (parle à l'IA)
├── .env.local                ← Ta clé API (NE PAS PARTAGER)
├── start.sh                  ← Script de lancement
├── package.json              ← Les dépendances du projet
├── tailwind.config.js        ← Config du CSS
└── tsconfig.json             ← Config TypeScript
```

## Comment ça marche (simplifié)

1. Tu tapes "les devs le lundi matin" dans le champ
2. Le frontend envoie ça au backend (`/api/generate`)
3. Le backend appelle l'API Claude avec un prompt structuré
4. Claude retourne un JSON avec 4 memes (template + captions)
5. Le frontend affiche les 4 variantes
6. Tu choisis, tu édites, tu partages

## Prochaines étapes

- [ ] Ajouter les vraies images de templates (Canvas API)
- [ ] Système d'auth (Supabase)
- [ ] Paiement (Stripe)
- [ ] Galerie communautaire
- [ ] Export PNG/JPG
- [ ] Mode vidéo (memes animés)

## Coûts

- **Hébergement** : Gratuit (Vercel free tier)
- **IA** : ~$0.003 par meme (API Anthropic)
- **Base de données** : Gratuit (Supabase free tier)
- **Total au départ** : ~$5-10/mois pour les premiers 1000 utilisateurs
