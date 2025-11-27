"use client"

import { useState, useEffect } from "react"
import { Heart, Calendar, Send, Clock, User, LogOut, Bot } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  checkAndGenerateQuestion,
  saveAnswer,
  getAnswersForQuestion,
  getReactionsForAnswer,
  toggleReaction,
  loadSettingsForClient,
} from "./actions"
import type { Question, Answer, Reaction, QuestionTheme } from "@/lib/types"
import { ReactionButton } from "@/components/reaction-button"

export default function HomePage() {
  const [currentUser, setCurrentUser] = useState<"partner1" | "partner2" | null>(null)
  const [question, setQuestion] = useState<Question | null>(null)
  const [answers, setAnswers] = useState<Answer[]>([])
  const [reactions, setReactions] = useState<Record<string, Reaction[]>>({})
  const [myAnswer, setMyAnswer] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [partner1Name, setPartner1Name] = useState("Alex")
  const [partner2Name, setPartner2Name] = useState("Sam")
  const [timeUntilNext, setTimeUntilNext] = useState("")
  const [questionThemes, setQuestionThemes] = useState<QuestionTheme[]>([])
  const [questionTime, setQuestionTime] = useState("09:00")
  const router = useRouter()

  // Ajouter un état pour forcer le rechargement
  const [lastCheck, setLastCheck] = useState(Date.now())

  // Check authentication
  useEffect(() => {
    const user = localStorage.getItem("currentUser") as "partner1" | "partner2" | null
    const loginTime = localStorage.getItem("loginTime")

    if (!user || !loginTime) {
      router.push("/login")
      return
    }

    // Check if login is still valid (24 hours)
    const loginDate = new Date(loginTime)
    const now = new Date()
    const hoursSinceLogin = (now.getTime() - loginDate.getTime()) / (1000 * 60 * 60)

    if (hoursSinceLogin > 24) {
      localStorage.removeItem("currentUser")
      localStorage.removeItem("loginTime")
      router.push("/login")
      return
    }

    setCurrentUser(user)
  }, [router])

  // Fonction pour charger les données complètes
  const loadCompleteData = async () => {
    if (!currentUser) return

    try {
      // Load settings
      const settings = await loadSettingsForClient()
      setPartner1Name(settings.partner1Name)
      setPartner2Name(settings.partner2Name)
      setQuestionThemes(settings.questionThemes || [])
      setQuestionTime(settings.questionTime)

      // Check and potentially generate today's question
      const todaysQuestion = await checkAndGenerateQuestion()
      setQuestion(todaysQuestion)

      // Load answers and reactions if question exists
      if (todaysQuestion) {
        const questionAnswers = await getAnswersForQuestion(todaysQuestion.id)
        setAnswers(questionAnswers)

        // Load reactions for each answer
        const allReactions: Record<string, Reaction[]> = {}
        for (const answer of questionAnswers) {
          const answerReactions = await getReactionsForAnswer(answer.id)
          allReactions[answer.id] = answerReactions
        }
        setReactions(allReactions)

        // Set existing answer if user already answered
        const existingAnswer = questionAnswers.find((a) => a.userId === currentUser)
        if (existingAnswer) {
          setMyAnswer(existingAnswer.text)
        }
      }
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Fonction pour synchroniser uniquement les réponses et réactions (sans les settings)
  const syncAnswersAndReactions = async () => {
    if (!currentUser || !question) return

    try {
      // Load answers and reactions
      const questionAnswers = await getAnswersForQuestion(question.id)
      setAnswers(questionAnswers)

      // Load reactions for each answer
      const allReactions: Record<string, Reaction[]> = {}
      for (const answer of questionAnswers) {
        const answerReactions = await getReactionsForAnswer(answer.id)
        allReactions[answer.id] = answerReactions
      }
      setReactions(allReactions)

      // Update existing answer if user already answered
      const existingAnswer = questionAnswers.find((a) => a.userId === currentUser)
      if (existingAnswer && existingAnswer.text !== myAnswer) {
        setMyAnswer(existingAnswer.text)
      }
    } catch (error) {
      console.error("Error syncing answers and reactions:", error)
    }
  }

  // Chargement initial des données
  useEffect(() => {
    loadCompleteData()
  }, [currentUser, lastCheck])

  // Synchronisation périodique des réponses et réactions
  useEffect(() => {
    if (!currentUser || !question) return

    const interval = setInterval(async () => {
      if (document.hidden) return // Ne pas synchroniser si l'onglet est inactif

      console.log("Syncing answers and reactions...")
      await syncAnswersAndReactions()
    }, 10000) // 10 secondes

    return () => clearInterval(interval)
  }, [currentUser, question])

  // Vérification périodique pour nouvelle question
  useEffect(() => {
    const interval = setInterval(async () => {
      if (!currentUser || document.hidden) return

      try {
        console.log("Periodic check for new question...")
        const todaysQuestion = await checkAndGenerateQuestion()
        if (todaysQuestion && (!question || todaysQuestion.id !== question.id)) {
          console.log("New question detected by periodic check, reloading data...")
          setLastCheck(Date.now())
        } else if (!todaysQuestion && question) {
          console.log("Current question is no longer today's question, reloading data...")
          setLastCheck(Date.now())
        }
      } catch (error) {
        console.error("Error checking for new question periodically:", error)
      }
    }, 30000) // 30 secondes pour les nouvelles questions

    return () => clearInterval(interval)
  }, [currentUser, question])

  // Calculate time until next question
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date()
      const [targetHour, targetMinute] = questionTime.split(":").map(Number)

      // Create target time for today
      let targetTime = new Date()
      targetTime.setHours(targetHour, targetMinute, 0, 0)

      // If target time has passed today, set it for tomorrow
      if (now >= targetTime) {
        targetTime = new Date(targetTime.getTime() + 24 * 60 * 60 * 1000)
      }

      const diff = targetTime.getTime() - now.getTime()
      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      setTimeUntilNext(
        `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`,
      )
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)
    return () => clearInterval(interval)
  }, [questionTime])

  const handleSaveAnswer = async () => {
    if (!question || !currentUser || !myAnswer.trim()) return

    setIsSaving(true)
    try {
      const answer = await saveAnswer(question.id, currentUser, myAnswer.trim())

      // Update answers list immediately
      const updatedAnswers = answers.filter((a) => a.userId !== currentUser)
      updatedAnswers.push(answer)
      setAnswers(updatedAnswers)
    } catch (error) {
      console.error("Error saving answer:", error)
      alert("Erreur lors de la sauvegarde de votre réponse")
    } finally {
      setIsSaving(false)
    }
  }

  const handleReaction = async (answerId: string, type: Reaction["type"]) => {
    if (!currentUser) return

    try {
      const reaction = await toggleReaction(answerId, currentUser, type)

      // Update reactions immediately
      const updatedReactions = { ...reactions }
      if (reaction) {
        // Add reaction
        updatedReactions[answerId] = [
          ...(updatedReactions[answerId] || []).filter((r) => r.userId !== currentUser),
          reaction,
        ]
      } else {
        // Remove reaction
        updatedReactions[answerId] = (updatedReactions[answerId] || []).filter(
          (r) => !(r.userId === currentUser && r.type === type),
        )
      }
      setReactions(updatedReactions)
    } catch (error) {
      console.error("Error toggling reaction:", error)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("currentUser")
    localStorage.removeItem("loginTime")
    router.push("/login")
  }

  const getCurrentUserName = () => {
    return currentUser === "partner1" ? partner1Name : partner2Name
  }

  const getPartnerName = () => {
    return currentUser === "partner1" ? partner2Name : partner1Name
  }

  const hasUserAnswered = (userId: "partner1" | "partner2") => {
    return answers.some((a) => a.userId === userId)
  }

  const getQuestionTheme = () => {
    if (!question?.theme) return null
    return questionThemes.find((t) => t.id === question.theme)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-red-950 flex flex-col items-center justify-center text-white">
        <Heart className="w-12 h-12 text-red-500 animate-pulse mb-4" />
        <p className="text-xl mb-2">Chargement des données...</p>
        <div className="w-40 h-2 bg-red-900 rounded-full overflow-hidden">
          <div className="h-2 bg-red-500 animate-pulse w-full"></div>
        </div>
      </div>
    )
  }

  if (!currentUser) {
    return null // Will redirect to login
  }

  const currentTheme = getQuestionTheme()

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-red-950">
      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 max-w-4xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
          <div className="flex items-center gap-3">
            <Heart className="w-6 h-6 sm:w-8 sm:h-8 text-red-500 animate-pulse" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">Questions de Couple</h1>
              <p className="text-sm sm:text-base text-gray-300">Connecté en tant que {getCurrentUserName()}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Link href="/calendar">
              <Button
                variant="outline"
                size="sm"
                className="border-red-800/50 text-gray-300 hover:bg-red-950/30 text-xs sm:text-sm"
              >
                <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                Calendrier
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="border-red-800/50 text-gray-300 hover:bg-red-950/30 text-xs sm:text-sm"
            >
              <LogOut className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              Déconnexion
            </Button>
          </div>
        </div>

        {/* Countdown */}
        <Card className="mb-8 bg-black/60 backdrop-blur-sm border-red-900/30 shadow-2xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-center gap-4">
              <Clock className="w-6 h-6 text-red-400" />
              <div className="text-center">
                <p className="text-gray-300 text-sm">
                  {question ? "Prochaine question dans" : `Question disponible à ${questionTime} - Dans`}
                </p>
                <p className="text-2xl font-bold text-white font-mono">{timeUntilNext}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* No Question Yet */}
        {!question && (
          <Card className="mb-8 bg-black/60 backdrop-blur-sm border-red-900/30 shadow-2xl">
            <CardContent className="p-8 text-center">
              <Bot className="w-16 h-16 text-red-500/50 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Aucune question pour aujourd'hui</h2>
              <p className="text-gray-300 mb-4">La question du jour sera générée automatiquement à {questionTime}.</p>
              <p className="text-gray-400 text-sm">
                Revenez à l'heure prévue ou rafraîchissez la page pour voir si une nouvelle question est disponible.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Today's Question */}
        {question && (
          <Card className="mb-8 bg-black/60 backdrop-blur-sm border-red-900/30 shadow-2xl">
            <CardHeader className="relative">
              <div className="flex flex-col items-center">
                <CardTitle className="text-white text-center text-lg sm:text-xl">Question du jour</CardTitle>
                {currentTheme && (
                  <Badge
                    className="mt-2 sm:absolute sm:top-6 sm:right-6 sm:mt-0 text-white border-0 text-xs"
                    style={{ backgroundColor: currentTheme.color }}
                  >
                    {currentTheme.name}
                  </Badge>
                )}
              </div>
              <p className="text-gray-300 text-center text-xs sm:text-sm">
                {new Date(question.date).toLocaleDateString("fr-FR", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </CardHeader>
            <CardContent className="px-4 sm:px-6">
              <div className="text-center mb-6">
                <p className="text-base sm:text-lg text-gray-100 leading-relaxed">{question.text}</p>
              </div>

              {/* Answer Status */}
              <div className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-4 mb-6">
                <Badge
                  variant={hasUserAnswered("partner1") ? "default" : "outline"}
                  className={`justify-center ${
                    hasUserAnswered("partner1")
                      ? "bg-red-800 text-red-100 border-red-700"
                      : "border-red-800/50 text-gray-300"
                  }`}
                >
                  <User className="w-3 h-3 mr-1" />
                  {partner1Name} {hasUserAnswered("partner1") ? "✓" : "⏳"}
                </Badge>
                <Badge
                  variant={hasUserAnswered("partner2") ? "default" : "outline"}
                  className={`justify-center ${
                    hasUserAnswered("partner2")
                      ? "bg-red-800 text-red-100 border-red-700"
                      : "border-red-800/50 text-gray-300"
                  }`}
                >
                  <User className="w-3 h-3 mr-1" />
                  {partner2Name} {hasUserAnswered("partner2") ? "✓" : "⏳"}
                </Badge>
              </div>

              {/* My Answer */}
              <div className="space-y-4">
                <div>
                  <label className="block text-white font-medium mb-2 text-sm sm:text-base">Votre réponse</label>
                  <Textarea
                    value={myAnswer}
                    onChange={(e) => setMyAnswer(e.target.value)}
                    placeholder="Écrivez votre réponse ici..."
                    rows={4}
                    className="bg-black/40 border-red-900/50 text-white placeholder-gray-400 focus:border-red-600 focus:ring-red-600 text-sm sm:text-base"
                  />
                  <Button
                    onClick={handleSaveAnswer}
                    disabled={!myAnswer.trim() || isSaving}
                    className="mt-3 w-full sm:w-auto bg-gradient-to-r from-red-700 to-red-900 hover:from-red-800 hover:to-red-950 text-white text-sm sm:text-base"
                  >
                    <Send className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                    {isSaving ? "Sauvegarde..." : "Sauvegarder ma réponse"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Answers */}
        {answers.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold text-white text-center mb-6">Vos réponses</h2>
            {answers.map((answer) => {
              const isMyAnswer = answer.userId === currentUser
              const authorName = answer.userId === "partner1" ? partner1Name : partner2Name
              const answerReactions = reactions[answer.id] || []

              return (
                <Card
                  key={answer.id}
                  className={`bg-black/60 backdrop-blur-sm border-red-900/30 shadow-2xl ${isMyAnswer ? "ring-2 ring-red-600" : ""}`}
                >
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className="flex-shrink-0">
                        <div
                          className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center ${
                            isMyAnswer ? "bg-red-700" : "bg-red-800"
                          }`}
                        >
                          <User className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-white text-sm sm:text-base">{authorName}</span>
                            {isMyAnswer && (
                              <Badge className="bg-red-800 text-red-100 border-red-700 text-xs">Vous</Badge>
                            )}
                          </div>
                          <span className="text-gray-400 text-xs sm:text-sm">
                            {new Date(answer.createdAt).toLocaleTimeString("fr-FR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <p className="text-gray-100 leading-relaxed mb-4 text-sm sm:text-base break-words">
                          {answer.text}
                        </p>

                        {/* Reactions */}
                        <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                          {!isMyAnswer && (
                            <>
                              <ReactionButton
                                type="like"
                                isActive={answerReactions.some((r) => r.userId === currentUser && r.type === "like")}
                                count={answerReactions.filter((r) => r.type === "like").length}
                                onClick={() => handleReaction(answer.id, "like")}
                              />
                              <ReactionButton
                                type="love"
                                isActive={answerReactions.some((r) => r.userId === currentUser && r.type === "love")}
                                count={answerReactions.filter((r) => r.type === "love").length}
                                onClick={() => handleReaction(answer.id, "love")}
                              />
                              <ReactionButton
                                type="laugh"
                                isActive={answerReactions.some((r) => r.userId === currentUser && r.type === "laugh")}
                                count={answerReactions.filter((r) => r.type === "laugh").length}
                                onClick={() => handleReaction(answer.id, "laugh")}
                              />
                              <ReactionButton
                                type="surprise"
                                isActive={answerReactions.some(
                                  (r) => r.userId === currentUser && r.type === "surprise",
                                )}
                                count={answerReactions.filter((r) => r.type === "surprise").length}
                                onClick={() => handleReaction(answer.id, "surprise")}
                              />
                            </>
                          )}

                          {/* Afficher les réactions existantes seulement si c'est ma réponse ET qu'il y en a */}
                          {isMyAnswer && answerReactions.length > 0 && (
                            <div className="flex items-center gap-1 flex-wrap">
                              {["like", "love", "laugh", "surprise"].map((type) => {
                                const typeReactions = answerReactions.filter((r) => r.type === type)
                                if (typeReactions.length === 0) return null

                                const reactionEmojis = {
                                  like: "👍",
                                  love: "❤️",
                                  laugh: "😂",
                                  surprise: "😮",
                                }

                                return (
                                  <div
                                    key={type}
                                    className="flex items-center gap-1 px-2 py-1 bg-black/30 rounded-full"
                                  >
                                    <span className="text-xs sm:text-sm">
                                      {reactionEmojis[type as keyof typeof reactionEmojis]}
                                    </span>
                                    <span className="text-xs text-white/70">{typeReactions.length}</span>
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
