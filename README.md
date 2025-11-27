# 💕 Love Question - Questions de Couple IA

Une application interactive de questions de couple avec génération automatique par IA, système de réactions et calendrier d'historique.

![Version](https://img.shields.io/badge/Version-1.0.0-red?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-15.2.4-black?style=for-the-badge&logo=next.js)
![React](https://img.shields.io/badge/React-18.2.0-61DAFB?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4.17-38B2AC?style=for-the-badge&logo=tailwind-css)
![OpenAI](https://img.shields.io/badge/OpenAI-API-00A67E?style=for-the-badge&logo=openai)

## ✨ Fonctionnalités

### 💖 Interface Utilisateur
- **Questions quotidiennes** générées automatiquement par IA (OpenAI GPT-4)
- **Système de réactions** avec emojis (👍, ❤️, 😂, 😮) et compteurs
- **Réponses personnalisées** pour chaque partenaire avec sauvegarde automatique
- **Calendrier interactif** pour consulter l'historique des questions
- **Synchronisation temps réel** des réactions et réponses (toutes les 10 secondes)
- **Thèmes de questions** variés (Communication, Intimité, Projets, etc.)
- **Design élégant** avec thème sombre romantique
- **Interface responsive** optimisée pour mobile et desktop
- **Authentification sécurisée** par couple avec mots de passe individuels

### 🤖 Génération IA
- **Questions intelligentes** adaptées aux couples
- **Thèmes rotatifs** pour varier les sujets de conversation
- **Configuration flexible** de la clé API OpenAI
- **Génération automatique** quotidienne ou manuelle
- **Personnalisation** des prompts et styles de questions

### 🛠️ Panneau d'Administration
- **Configuration des utilisateurs** (noms, mots de passe, thèmes de couleur)
- **Gestion de la clé API OpenAI** avec stockage sécurisé
- **Génération manuelle** de nouvelles questions
- **Statistiques d'utilisation** et historique des interactions
- **Paramètres de synchronisation** et fréquences de mise à jour
- **Sauvegarde et restauration** des données

### 🔧 Fonctionnalités Techniques
- **Server Actions** Next.js 15 pour la gestion des données
- **Stockage JSON** persistant avec structure optimisée
- **Synchronisation automatique** entre les partenaires
- **Gestion d'état** optimisée avec React hooks
- **Validation** stricte des données avec Zod
- **Sécurité** renforcée pour les mots de passe et API

## 🚀 Installation

### Prérequis
- **Node.js** 18+ 
- **npm** ou **yarn**
- **Clé API OpenAI** (optionnel, configurable via l'interface)

### Étapes d'installation

1. **Cloner le repository**
```
git clone https://github.com/Aprilox/love-question.git
cd love-question
```

2. **Installer les dépendances**
```
npm install
# ou
yarn install
```

3. **Créer le dossier de données**
```
mkdir data
```

4. **Configuration optionnelle**
```
# Créer un fichier .env.local (optionnel)
echo "OPENAI_API_KEY=votre_clé_api" > .env.local
```

5. **Lancer en mode développement**
```
npm run dev
# ou
yarn dev
```

6. **Ouvrir dans le navigateur**
```
http://localhost:3000
```

## 📁 Structure du Projet

```
love-question/
├── app/
│   ├── admin/
│   │   ├── actions.tsx           # Actions admin (config, génération IA)
│   │   └── page.tsx              # Interface d'administration
│   ├── calendar/
│   │   └── page.tsx              # Calendrier des questions
│   ├── login/
│   │   └── page.tsx              # Page de connexion
│   ├── actions.ts                # Server Actions principales
│   ├── globals.css               # Styles globaux Tailwind
│   ├── layout.tsx                # Layout principal avec metadata
│   └── page.tsx                  # Page principale des questions
├── components/
│   ├── ui/                       # Composants shadcn/ui
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── calendar.tsx
│   │   └── ...
│   ├── reaction-button.tsx       # Composant de réactions
│   └── theme-provider.tsx        # Provider de thème
├── data/
│   └── settings.json             # Base de données JSON (auto-générée)
├── lib/
│   ├── settings.ts               # Gestion des paramètres
│   ├── types.ts                  # Types TypeScript
│   ├── schemas.ts                # Schémas de validation Zod
│   └── utils.ts                  # Utilitaires
├── public/
│   └── favicon.png               # Favicon personnalisé
├── package.json                  # Dépendances et scripts
├── tailwind.config.ts            # Configuration Tailwind
├── tsconfig.json                 # Configuration TypeScript
└── README.md                     # Documentation
```

## ⚙️ Configuration

### Première utilisation

1. **Accéder à l'application**
   - Aller sur http://localhost:3000
   - Créer les comptes des deux partenaires

2. **Configuration administrative**
   - Accéder à /admin directement dans l'URL
   - Configurer les noms et mots de passe des utilisateurs
   - Ajouter la clé API OpenAI pour la génération automatique

3. **Personnalisation**
   - Choisir les thèmes de couleur pour chaque partenaire
   - Configurer les thèmes de questions préférés
   - Tester la génération de questions

### Structure des données

```
interface Settings {
  users: {
    user1: UserConfig
    user2: UserConfig
  }
  questions: Question[]
  openaiApiKey?: string
  lastQuestionDate?: string
  questionThemes: string[]
}

interface Question {
  id: string
  text: string
  date: string
  theme: string
  responses: {
    user1?: string
    user2?: string
  }
  reactions: {
    user1: Reaction[]
    user2: Reaction[]
  }
}

interface UserConfig {
  name: string
  password: string
  color: string
}
```

## 🎮 Utilisation

### Pour les Couples
1. **Se connecter** avec son nom d'utilisateur et mot de passe
2. **Découvrir la question du jour** générée automatiquement
3. **Répondre** à la question dans la zone de texte dédiée
4. **Réagir** aux réponses du partenaire avec des emojis
5. **Consulter l'historique** dans le calendrier interactif
6. **Synchronisation automatique** des nouvelles réponses et réactions

### Pour les Administrateurs
1. **Accéder** au panel admin via /admin
2. **Configurer** les utilisateurs et leurs préférences
3. **Gérer** la clé API OpenAI pour la génération automatique
4. **Générer** manuellement de nouvelles questions
5. **Consulter** les statistiques d'utilisation

## 🤖 Génération IA

### Thèmes de Questions Disponibles
- **Communication** - Questions sur l'écoute et l'expression
- **Intimité** - Questions sur la proximité et la complicité  
- **Projets** - Questions sur les rêves et objectifs communs
- **Souvenirs** - Questions sur les moments partagés
- **Découverte** - Questions pour mieux se connaître
- **Avenir** - Questions sur les projets futurs

### Configuration OpenAI
```
// Exemple de prompt utilisé
const prompt = `Génère une question de couple sur le thème "\${theme}".
La question doit être:
- Ouverte et engageante
- Adaptée à un couple qui se connaît bien
- Formulée pour encourager le dialogue
- En français
- Sans numérotation ni préfixe`
```

## 🎨 Personnalisation

### Thèmes de Couleur
```
/* Couleurs disponibles pour les utilisateurs */
.user-red { --user-color: #dc2626; }
.user-blue { --user-color: #2563eb; }
.user-green { --user-color: #16a34a; }
.user-purple { --user-color: #9333ea; }
.user-pink { --user-color: #ec4899; }
.user-orange { --user-color: #ea580c; }
```

### Responsive Design
| Écran | Optimisation | Breakpoint |
|-------|--------------|------------|
| Mobile | Interface tactile, layout vertical | < 640px |
| Tablette | Équilibre taille/lisibilité | 640px - 1024px |
| Desktop | Affichage optimal complet | > 1024px |

## 🛡️ Sécurité

- **Authentification** par mot de passe pour chaque utilisateur
- **Clé API OpenAI** stockée de manière sécurisée côté serveur
- **Validation** stricte des données avec Zod
- **Séparation** des données publiques/privées
- **Server Actions** sécurisées Next.js 15
- **Pas d'exposition** des mots de passe côté client

## 🔄 API / Actions Serveur

### Actions Publiques
```
// Authentification et données
authenticateUser(username: string, password: string): Promise<boolean>
loadSettingsForClient(): Promise<PublicSettings>

// Questions et réponses
saveResponse(questionId: string, response: string): Promise<void>
addReaction(questionId: string, emoji: string): Promise<void>
removeReaction(questionId: string, emoji: string): Promise<void>
```

### Actions Admin
```
// Configuration
updateUserConfig(userId: string, config: UserConfig): Promise<void>
updateOpenAIKey(apiKey: string): Promise<void>

// Génération IA
generateNewQuestion(): Promise<Question>
generateQuestionsForRange(startDate: string, endDate: string): Promise<void>
```

## 🚀 Déploiement

### Vercel (Recommandé)
```
# Installation Vercel CLI
npm i -g vercel

# Déploiement
vercel --prod

# Ou via l'interface web Vercel
# 1. Connecter le repository
# 2. Configurer les variables d'environnement
# 3. Déployer automatiquement
```

### Variables d'environnement (optionnelles)
```
# Clé API OpenAI (peut être configurée via l'interface)
OPENAI_API_KEY=sk-...

# Configuration Next.js
NODE_ENV=production
```

### Docker
```
FROM node:18-alpine
WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

## 🧪 Tests et Développement

### Scripts disponibles
```
npm run dev      # Développement avec hot-reload
npm run build    # Build de production  
npm run start    # Démarrage en production
npm run lint     # Vérification ESLint
```

### Mode Debug
- **Logs détaillés** des Server Actions
- **Validation TypeScript** en temps réel
- **Hot reload** pour le développement
- **Inspection** des données JSON

## 📦 Technologies Utilisées

### Core Framework
- **Next.js** 15.2.4 - Framework React full-stack avec App Router
- **React** 18.2.0 - Bibliothèque UI avec hooks modernes
- **TypeScript** ^5 - Typage statique strict
- **Tailwind CSS** ^3.4.17 - Framework CSS utility-first

### IA et APIs
- **OpenAI API** via @ai-sdk/openai ^0.0.66 - Génération de questions
- **AI SDK** ^3.4.32 - Interface unifiée pour les modèles IA

### UI Components
- **Radix UI** 1.1.x - 2.2.x - Composants accessibles headless
- **Lucide React** ^0.454.0 - Icônes SVG optimisées
- **React Day Picker** 8.10.1 - Composant calendrier
- **Sonner** ^1.7.1 - Notifications toast élégantes

### Form & Validation
- **React Hook Form** ^7.54.1 - Gestion performante des formulaires
- **Zod** ^3.24.1 - Validation de schémas TypeScript-first
- **@hookform/resolvers** ^3.9.1 - Intégration Zod + RHF

### Utilities
- **date-fns** 3.6.0 - Manipulation des dates
- **clsx** ^2.1.1 - Classes conditionnelles
- **tailwind-merge** ^2.5.5 - Fusion intelligente de classes

## 📝 Changelog

### v1.0.0 (2025-01-25)
- 🎉 **Initial**: Application de questions de couple avec IA
- 🤖 **Add**: Génération automatique de questions via OpenAI GPT-4
- 💕 **Add**: Système de réactions avec emojis et compteurs
- 📅 **Add**: Calendrier interactif pour l'historique
- 🔄 **Add**: Synchronisation temps réel des réponses et réactions
- 👥 **Add**: Authentification multi-utilisateur sécurisée
- 🛠️ **Add**: Panel d'administration complet
- 📱 **Add**: Interface responsive optimisée mobile/desktop
- 🎨 **Add**: Thèmes de couleur personnalisables par utilisateur
- 🔐 **Add**: Stockage sécurisé des clés API et mots de passe

## 🐛 Problèmes Connus

- ⚠️ La synchronisation peut prendre jusqu'à 10 secondes pour apparaître
- ⚠️ Les questions générées dépendent de la disponibilité de l'API OpenAI
- ⚠️ Le calendrier peut être lent avec un très grand historique de questions

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier LICENSE pour plus de détails.

## 👨‍💻 Auteur

Créé avec ❤️ pour renforcer les liens entre couples

---

## 🆘 Support

Pour toute question ou problème :

1. 📋 Consulter cette documentation
2. 🔧 Vérifier la configuration de la clé API OpenAI
3. 🔄 Tester la synchronisation entre les comptes
4. 💬 Contacter le support technique

---

## 🔗 Liens Utiles

- **Documentation Next.js**: https://nextjs.org/docs
- **Documentation OpenAI**: https://platform.openai.com/docs
- **Documentation Radix UI**: https://www.radix-ui.com/
- **Documentation Tailwind CSS**: https://tailwindcss.com/docs
- **AI SDK Documentation**: https://sdk.vercel.ai/

---

**💕 Créé pour rapprocher les cœurs ! 💖**

*Que cette application apporte plus de complicité et de dialogue dans votre couple !* ✨