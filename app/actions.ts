"use server"

import { promises as fs } from "fs"
import path from "path"
import OpenAI from "openai"
import type { Settings, Question, Answer, Reaction, DailyData, QuestionTheme } from "@/lib/types"
import { defaultSettings } from "@/lib/settings" // defaultSettings contient les mdp en clair
import { SettingsSchema, AnswerSchema } from "@/lib/schemas"
import { ZodError } from "zod"

const DATA_DIR = path.join(process.cwd(), "data")
const SETTINGS_FILE = path.join(DATA_DIR, "settings.json")
const QUESTIONS_FILE = path.join(DATA_DIR, "questions.json")
const ANSWERS_FILE = path.join(DATA_DIR, "answers.json")
const REACTIONS_FILE = path.join(DATA_DIR, "reactions.json")

let simulatedDate: string | null = null

async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true })
  } catch (error) {
    /* Directory already exists */
  }
}

export async function setSimulatedDate(date: string): Promise<void> {
  simulatedDate = date
  console.log("Simulation activée pour la date:", simulatedDate)
}

export async function clearSimulation(): Promise<void> {
  simulatedDate = null
  console.log("Simulation désactivée")
}

function getCurrentDate(): string {
  if (simulatedDate) return simulatedDate
  const now = new Date()
  return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, "0")}-${now.getDate().toString().padStart(2, "0")}`
}

function getCurrentDateTime(): Date {
  return new Date()
}

export async function checkAndGenerateQuestion(forceGenerate = false): Promise<Question | null> {
  await ensureDataDir()
  try {
    const settings = await loadFullSettings()
    const now = getCurrentDateTime()
    const today = getCurrentDate()

    if (forceGenerate) {
      return await generateDailyQuestionForDate(today, settings)
    }

    const existingQuestion = await getQuestionByDate(today)
    if (existingQuestion) return existingQuestion

    if (!simulatedDate) {
      const [targetHour, targetMinute] = settings.questionTime.split(":").map(Number)
      const targetTimeToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), targetHour, targetMinute, 0)

      if (now >= targetTimeToday) {
        return await generateDailyQuestionForDate(today, settings)
      }
    }
    return null
  } catch (error) {
    console.error("Error in checkAndGenerateQuestion:", error)
    return null
  }
}

async function generateDailyQuestionForDate(date: string, settings: Settings): Promise<Question> {
  await ensureDataDir()
  try {
    // Utiliser la clé API depuis les settings, puis fallback sur l'env
    const apiKey = settings.openaiApiKey || process.env.OPENAI_API_KEY
    if (!apiKey) {
      console.error("OpenAI API key is not configured in settings or environment variables.")
      throw new Error("OpenAI API key not configured.")
    }

    const selectedTheme = selectRandomTheme(settings.questionThemes)
    const prompt = getThemePrompt(selectedTheme, settings.partner1Name, settings.partner2Name)

    const openai = new OpenAI({ apiKey })
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.9,
      max_tokens: 200,
    })

    const text =
      completion.choices[0]?.message?.content?.trim() ||
      "Oops, je n'ai pas pu générer de question. Réessayez plus tard !"

    const question: Question = {
      id: `q_${Date.now()}`,
      text,
      date,
      createdAt: new Date().toISOString(),
      theme: selectedTheme.id,
    }

    let questions: Question[] = []
    try {
      questions = JSON.parse(await fs.readFile(QUESTIONS_FILE, "utf8"))
    } catch (e) {
      /* File might not exist */
    }

    questions = questions.filter((q) => q.date !== date)
    questions.push(question)
    await fs.writeFile(QUESTIONS_FILE, JSON.stringify(questions, null, 2))
    return question
  } catch (error) {
    console.error("Error generating question with OpenAI:", error)
    const fallbackQuestion: Question = {
      id: `q_fallback_${Date.now()}`,
      text: "Si vous pouviez partager un super pouvoir, lequel serait-ce et comment l'utiliseriez-vous ensemble ?",
      date,
      createdAt: new Date().toISOString(),
      theme: "fun",
    }
    let questions: Question[] = []
    try {
      questions = JSON.parse(await fs.readFile(QUESTIONS_FILE, "utf8"))
    } catch (e) {}
    questions = questions.filter((q) => q.date !== date)
    questions.push(fallbackQuestion)
    await fs.writeFile(QUESTIONS_FILE, JSON.stringify(questions, null, 2))
    return fallbackQuestion
  }
}

function selectRandomTheme(themes: QuestionTheme[]): QuestionTheme {
  const totalPercentage = themes.reduce((sum, theme) => sum + theme.percentage, 0)
  if (totalPercentage === 0 && themes.length > 0) return themes[0]
  if (themes.length === 0) throw new Error("No themes available for selection.")

  const random = Math.random() * totalPercentage
  let currentSum = 0
  for (const theme of themes) {
    currentSum += theme.percentage
    if (random <= currentSum) return theme
  }
  return themes[themes.length - 1]
}

function getThemePrompt(theme: QuestionTheme, partner1Name: string, partner2Name: string): string {
  return `Génère une question pour un couple (${partner1Name} et ${partner2Name}). Thème: ${theme.name} (${theme.description}). La question doit être en français, unique, engageante, et sans introduction.`
}

export async function loadSettingsForClient(): Promise<
  Omit<Settings, "partner1Password" | "partner2Password" | "adminPassword" | "openaiApiKey">
> {
  const fullSettings = await loadFullSettings()
  // Exclure les mots de passe ET la clé API pour le client
  const { partner1Password, partner2Password, adminPassword, openaiApiKey, ...clientSettings } = fullSettings
  return clientSettings
}

export async function loadFullSettings(): Promise<Settings> {
  await ensureDataDir()
  try {
    const data = await fs.readFile(SETTINGS_FILE, "utf8")
    const diskSettings = JSON.parse(data)
    // Valider et fusionner avec les valeurs par défaut pour les champs manquants
    // defaultSettings contient les mots de passe en clair
    return SettingsSchema.parse({
      ...defaultSettings,
      ...diskSettings,
    })
  } catch (error) {
    console.warn("Failed to load or parse settings.json, using defaults and attempting to save.", error)
    // Si le fichier n'existe pas ou est corrompu, on initialise avec les valeurs par défaut
    // et on les sauvegarde. defaultSettings contient déjà les mdp en clair.
    const initialSettings = { ...defaultSettings }
    await fs.writeFile(SETTINGS_FILE, JSON.stringify(SettingsSchema.parse(initialSettings), null, 2))
    return initialSettings
  }
}

export async function saveSettings(
  newSettings: Partial<Settings> &
    Pick<Settings, "partner1Name" | "partner2Name" | "questionTime" | "relationshipStartDate" | "questionThemes">,
): Promise<void> {
  await ensureDataDir()
  const currentSettings = await loadFullSettings()

  const settingsToUpdate: Settings = {
    ...currentSettings,
    partner1Name: newSettings.partner1Name,
    partner2Name: newSettings.partner2Name,
    questionTime: newSettings.questionTime,
    relationshipStartDate: newSettings.relationshipStartDate,
    questionThemes: newSettings.questionThemes,
    // Mettre à jour les mots de passe s'ils sont explicitement fournis
    partner1Password: newSettings.partner1Password ?? currentSettings.partner1Password,
    partner2Password: newSettings.partner2Password ?? currentSettings.partner2Password,
    adminPassword: newSettings.adminPassword ?? currentSettings.adminPassword,
    // Mettre à jour la clé API s'elle est fournie
    openaiApiKey: newSettings.openaiApiKey ?? currentSettings.openaiApiKey,
    // Champs optionnels de réunion
    reunionDate: newSettings.reunionDate ?? currentSettings.reunionDate,
    quotes: newSettings.quotes ?? currentSettings.quotes,
    finalMessage: newSettings.finalMessage ?? currentSettings.finalMessage,
    likes: newSettings.likes ?? currentSettings.likes,
  }

  try {
    const validatedSettings = SettingsSchema.parse(settingsToUpdate)
    console.log("Saving settings (sensitive data not logged).")
    await fs.writeFile(SETTINGS_FILE, JSON.stringify(validatedSettings, null, 2))
  } catch (error) {
    if (error instanceof ZodError) {
      console.error("Validation error saving settings:", error.errors)
      throw new Error(`Erreur de validation: ${error.errors[0]?.message || "Données invalides."}`)
    }
    console.error("Error saving settings:", error)
    throw new Error("Impossible de sauvegarder les paramètres.")
  }
}

export async function authenticateUser(userId: "partner1" | "partner2", passwordAttempt: string): Promise<boolean> {
  const settings = await loadFullSettings()
  const expectedPassword = userId === "partner1" ? settings.partner1Password : settings.partner2Password
  const isValid = passwordAttempt === expectedPassword
  if (!isValid) console.warn(`Failed login attempt for ${userId}`)
  return isValid
}

export async function authenticateAdmin(passwordAttempt: string): Promise<boolean> {
  const settings = await loadFullSettings()
  const isValid = passwordAttempt === settings.adminPassword
  if (!isValid) console.warn("Failed admin login attempt")
  return isValid
}

export async function regenerateTodaysQuestion(): Promise<Question> {
  await ensureDataDir()
  const settings = await loadFullSettings()
  const apiKey = settings.openaiApiKey || process.env.OPENAI_API_KEY
  if (!apiKey) {
    console.error("OpenAI API key not configured in settings or environment.")
    throw new Error("OpenAI API key non configurée.")
  }

  const today = getCurrentDate()
  console.log("Regenerating question for date:", today)

  let questions: Question[] = []
  try {
    questions = JSON.parse(await fs.readFile(QUESTIONS_FILE, "utf8"))
  } catch (e) {}

  const existingQuestion = questions.find((q) => q.date === today)
  questions = questions.filter((q) => q.date !== today)

  if (existingQuestion) {
    let answers: Answer[] = []
    try {
      answers = JSON.parse(await fs.readFile(ANSWERS_FILE, "utf8"))
    } catch (e) {}
    const answersForOldQuestion = answers.filter((a) => a.questionId === existingQuestion.id)
    const answerIdsToDelete = answersForOldQuestion.map((a) => a.id)

    answers = answers.filter((a) => a.questionId !== existingQuestion.id)
    await fs.writeFile(ANSWERS_FILE, JSON.stringify(answers, null, 2))

    if (answerIdsToDelete.length > 0) {
      let reactions: Reaction[] = []
      try {
        reactions = JSON.parse(await fs.readFile(REACTIONS_FILE, "utf8"))
      } catch (e) {}
      reactions = reactions.filter((r) => !answerIdsToDelete.includes(r.answerId))
      await fs.writeFile(REACTIONS_FILE, JSON.stringify(reactions, null, 2))
    }
  }

  return await generateDailyQuestionForDate(today, settings)
}

export async function getTodaysQuestion(): Promise<Question | null> {
  return getQuestionByDate(getCurrentDate())
}

export async function getQuestionByDate(date: string): Promise<Question | null> {
  await ensureDataDir()
  try {
    const questions: Question[] = JSON.parse(await fs.readFile(QUESTIONS_FILE, "utf8"))
    return questions.find((q) => q.date === date) || null
  } catch (error) {
    return null
  }
}

export async function saveAnswer(questionId: string, userId: "partner1" | "partner2", text: string): Promise<Answer> {
  await ensureDataDir()
  AnswerSchema.parse({ text })

  const answer: Answer = {
    id: `a_${Date.now()}_${userId}`,
    questionId,
    userId,
    text,
    createdAt: new Date().toISOString(),
  }

  let answers: Answer[] = []
  try {
    answers = JSON.parse(await fs.readFile(ANSWERS_FILE, "utf8"))
  } catch (e) {}

  answers = answers.filter((a) => !(a.questionId === questionId && a.userId === userId))
  answers.push(answer)
  await fs.writeFile(ANSWERS_FILE, JSON.stringify(answers, null, 2))
  return answer
}

export async function getAnswersForQuestion(questionId: string): Promise<Answer[]> {
  await ensureDataDir()
  try {
    const answers: Answer[] = JSON.parse(await fs.readFile(ANSWERS_FILE, "utf8"))
    return answers.filter((a) => a.questionId === questionId)
  } catch (error) {
    return []
  }
}

export async function toggleReaction(
  answerId: string,
  userId: "partner1" | "partner2",
  type: Reaction["type"],
): Promise<Reaction | null> {
  await ensureDataDir()
  let reactions: Reaction[] = []
  try {
    reactions = JSON.parse(await fs.readFile(REACTIONS_FILE, "utf8"))
  } catch (e) {}

  const existingReactionIndex = reactions.findIndex(
    (r) => r.answerId === answerId && r.userId === userId && r.type === type,
  )

  if (existingReactionIndex >= 0) {
    reactions.splice(existingReactionIndex, 1)
    await fs.writeFile(REACTIONS_FILE, JSON.stringify(reactions, null, 2))
    return null
  } else {
    reactions = reactions.filter((r) => !(r.answerId === answerId && r.userId === userId))
    const newReaction: Reaction = {
      id: `r_${Date.now()}_${userId}`,
      answerId,
      userId,
      type,
      createdAt: new Date().toISOString(),
    }
    reactions.push(newReaction)
    await fs.writeFile(REACTIONS_FILE, JSON.stringify(reactions, null, 2))
    return newReaction
  }
}

export async function getReactionsForAnswer(answerId: string): Promise<Reaction[]> {
  await ensureDataDir()
  try {
    const reactions: Reaction[] = JSON.parse(await fs.readFile(REACTIONS_FILE, "utf8"))
    return reactions.filter((r) => r.answerId === answerId)
  } catch (error) {
    return []
  }
}

export async function getDailyData(date: string): Promise<DailyData | null> {
  const question = await getQuestionByDate(date)
  if (!question) return null
  const answers = await getAnswersForQuestion(question.id)
  const reactions: Reaction[] = []
  for (const answer of answers) {
    reactions.push(...(await getReactionsForAnswer(answer.id)))
  }
  return { question, answers, reactions }
}

export async function getCalendarData(year: number, month: number): Promise<Record<string, DailyData>> {
  await ensureDataDir()
  const data: Record<string, DailyData> = {}
  let questions: Question[] = []
  try {
    questions = JSON.parse(await fs.readFile(QUESTIONS_FILE, "utf8"))
  } catch (e) {}

  const monthQuestions = questions.filter((q) => {
    try {
      const qDate = new Date(q.date + "T00:00:00")
      return qDate.getFullYear() === year && qDate.getMonth() === month
    } catch {
      return false
    }
  })

  for (const question of monthQuestions) {
    const dailyEntry = await getDailyData(question.date)
    if (dailyEntry) data[question.date] = dailyEntry
  }
  return data
}

export async function isOpenAiApiKeyConfigured(): Promise<boolean> {
  const settings = await loadFullSettings()
  return !!(settings.openaiApiKey || process.env.OPENAI_API_KEY)
}
