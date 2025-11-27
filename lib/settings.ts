import type { Settings, Quote, QuoteLike } from "./types"

// Settings par défaut SANS le mot de passe (sécurité côté client)
export const defaultSettings: Omit<Settings, "partner1PasswordHash" | "partner2PasswordHash" | "adminPasswordHash"> & {
  // Ces champs sont pour l'exemple, ils ne seront pas sauvegardés dans settings.json
  // si on ne les ajoute pas au schéma Zod et à la logique de sauvegarde.
  // Pour l'instant, on les garde pour la compatibilité avec l'existant.
  partner1Password?: string
  partner2Password?: string
  adminPassword?: string
  openaiApiKey?: string
  reunionDate: string
  quotes: Quote[]
  finalMessage: string
  likes: QuoteLike[]
} = {
  partner1Name: "Alex",
  // Les mots de passe en clair ici sont UNIQUEMENT pour l'initialisation par défaut.
  // Ils seront "hachés" (simulé) lors de la première sauvegarde.
  partner1Password: "alex123",
  partner2Name: "Sam",
  partner2Password: "sam123",
  adminPassword: "admin123", // Mot de passe admin par défaut
  openaiApiKey: "", // Clé API vide par défaut
  questionTime: "09:00",
  relationshipStartDate: new Date().toISOString().split("T")[0],
  questionThemes: [
    {
      id: "romantic",
      name: "Romantique",
      description: "Questions sur l'amour, les sentiments et la romance",
      percentage: 30,
      color: "#d97706",
    },
    {
      id: "intimate",
      name: "Intime",
      description: "Questions plus personnelles et intimes",
      percentage: 20,
      color: "#dc2626",
    },
    {
      id: "future",
      name: "Avenir",
      description: "Questions sur vos projets et rêves ensemble",
      percentage: 25,
      color: "#059669",
    },
    {
      id: "memories",
      name: "Souvenirs",
      description: "Questions sur votre passé et vos expériences",
      percentage: 15,
      color: "#7c2d12",
    },
    {
      id: "fun",
      name: "Amusant",
      description: "Questions légères et amusantes",
      percentage: 10,
      color: "#b45309",
    },
  ],
  reunionDate: "2025-02-14T18:00:00",
  quotes: [
    {
      id: 1,
      text: "L'amour, c'est quand on se rencontre et qu'on se reconnaît.",
      author: "Françoise Sagan",
      order: 1,
    },
    {
      id: 2,
      text: "Aimer, ce n'est pas se regarder l'un l'autre, c'est regarder ensemble dans la même direction.",
      author: "Antoine de Saint-Exupéry",
      order: 2,
    },
    {
      id: 3,
      text: "Il n'y a qu'un bonheur dans la vie, c'est d'aimer et d'être aimé.",
      author: "George Sand",
      order: 3,
    },
  ],
  finalMessage:
    "Après tous ces jours d'attente, nous voilà enfin réunis. Tu es ma plus belle récompense. Je t'aime infiniment. 💖",
  likes: [],
}

// Settings complets UNIQUEMENT côté serveur (avec les vrais hash après la première sauvegarde)
export const serverDefaultSettings: Settings = {
  partner1Name: defaultSettings.partner1Name,
  partner1PasswordHash: `simulated_hash_for_${defaultSettings.partner1Password}`, // Sera écrasé par un vrai hash simulé
  partner2Name: defaultSettings.partner2Name,
  partner2PasswordHash: `simulated_hash_for_${defaultSettings.partner2Password}`,
  adminPasswordHash: `simulated_hash_for_${defaultSettings.adminPassword}`,
  openaiApiKey: defaultSettings.openaiApiKey || "",
  questionTime: defaultSettings.questionTime,
  relationshipStartDate: defaultSettings.relationshipStartDate,
  questionThemes: defaultSettings.questionThemes,
  reunionDate: defaultSettings.reunionDate,
  quotes: defaultSettings.quotes,
  finalMessage: defaultSettings.finalMessage,
  likes: defaultSettings.likes,
}
