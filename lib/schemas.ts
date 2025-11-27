import { z } from "zod"

export const PartnerSchema = z.object({
  name: z.string().min(1, "Le nom est requis").max(50, "Le nom ne peut pas dépasser 50 caractères"),
  password: z.string().min(1, "Le mot de passe est requis").max(100), // Peut-être min(6) pour une meilleure robustesse
})

export const SettingsSchema = z.object({
  partner1Name: z.string().min(1, "Nom du partenaire 1 requis").max(50),
  partner1Password: z.string().min(1, "Mot de passe du partenaire 1 requis"), // Stocké en clair
  partner2Name: z.string().min(1, "Nom du partenaire 2 requis").max(50),
  partner2Password: z.string().min(1, "Mot de passe du partenaire 2 requis"), // Stocké en clair
  adminPassword: z.string().min(1, "Mot de passe admin requis"), // Stocké en clair
  openaiApiKey: z.string().optional(), // Clé API OpenAI optionnelle
  questionTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Format HH:MM invalide"),
  relationshipStartDate: z.string().refine((date) => !isNaN(Date.parse(date)), "Date invalide"),
  questionThemes: z
    .array(
      z.object({
        id: z.string(),
        name: z.string().min(1).max(50),
        description: z.string().max(200),
        percentage: z.number().min(0).max(100),
        color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Format de couleur hexadécimal invalide (#RRGGBB)"),
      }),
    )
    .min(1, "Au moins un thème est requis")
    .refine(
      (themes) => {
        const totalPercentage = themes.reduce((sum, theme) => sum + theme.percentage, 0)
        return totalPercentage === 100
      },
      { message: "La somme des pourcentages des thèmes doit être égale à 100%" },
    ),
  reunionDate: z.string().optional(),
  quotes: z.array(z.any()).optional(),
  finalMessage: z.string().optional(),
  likes: z.array(z.any()).optional(),
})

export const AnswerSchema = z.object({
  text: z.string().min(1, "La réponse ne peut pas être vide").max(1000, "La réponse est trop longue"),
})

export const AdminLoginSchema = z.object({
  password: z.string().min(1, "Le mot de passe est requis"),
})

export const UserLoginSchema = z.object({
  password: z.string().min(1, "Le mot de passe est requis"),
  userId: z.enum(["partner1", "partner2"]),
})
