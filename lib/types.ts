export interface User {
  id: "partner1" | "partner2"
  name: string
  password?: string // Mot de passe en clair
}

export interface Question {
  id: string
  text: string
  date: string // Format YYYY-MM-DD
  createdAt: string // ISOString
  theme?: string // id du thème
}

export interface Answer {
  id: string
  questionId: string
  userId: "partner1" | "partner2"
  text: string
  createdAt: string // ISOString
}

export interface Reaction {
  id: string
  answerId: string
  userId: "partner1" | "partner2"
  type: "like" | "love" | "laugh" | "surprise" | "sad" | "angry"
  createdAt: string // ISOString
}

export interface QuestionTheme {
  id: string
  name: string
  description: string
  percentage: number
  color: string // ex: "#FF0000"
}

export interface Settings {
  partner1Name: string
  partner1Password: string // Mot de passe en clair
  partner2Name: string
  partner2Password: string // Mot de passe en clair
  adminPassword: string // Mot de passe en clair
  openaiApiKey: string // Clé API OpenAI
  questionTime: string // Format: "HH:MM" (heure locale)
  relationshipStartDate: string // Format YYYY-MM-DD
  questionThemes: QuestionTheme[]

  reunionDate?: string // ISOString
  quotes?: Quote[]
  finalMessage?: string
  likes?: QuoteLike[]
}

export interface Quote {
  id: number
  text: string
  author: string
  image?: string
  order: number
}

export interface QuoteLike {
  quoteId: number
  liked: boolean
  likedAt: string // ISOString
}

export interface DailyData {
  question: Question
  answers: Answer[]
  reactions: Reaction[]
}
