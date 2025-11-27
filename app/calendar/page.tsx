"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight, ArrowLeft, User, Heart } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { getCalendarData, loadSettingsForClient } from "../actions"
import type { DailyData } from "@/lib/types"
import { ReactionButton } from "@/components/reaction-button"

export default function CalendarPage() {
  const [currentUser, setCurrentUser] = useState<"partner1" | "partner2" | null>(null)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [calendarData, setCalendarData] = useState<Record<string, DailyData>>({})
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [partner1Name, setPartner1Name] = useState("Alex")
  const [partner2Name, setPartner2Name] = useState("Sam")
  const [isLoading, setIsLoading] = useState(true)
  const [isNavigating, setIsNavigating] = useState(false)
  const router = useRouter()

  // Check authentication
  useEffect(() => {
    const user = localStorage.getItem("currentUser") as "partner1" | "partner2" | null
    if (!user) {
      router.push("/login")
      return
    }
    setCurrentUser(user)
  }, [router])

  // Load data
  useEffect(() => {
    if (!currentUser) return

    const loadData = async () => {
      try {
        console.log("Loading calendar data for:", currentDate.getFullYear(), currentDate.getMonth())
        const settings = await loadSettingsForClient()
        setPartner1Name(settings.partner1Name)
        setPartner2Name(settings.partner2Name)

        const data = await getCalendarData(currentDate.getFullYear(), currentDate.getMonth())
        console.log("Calendar data loaded:", Object.keys(data).length, "days")
        setCalendarData(data)
      } catch (error) {
        console.error("Error loading calendar data:", error)
      } finally {
        setIsLoading(false)
        setIsNavigating(false)
      }
    }

    loadData()
  }, [currentUser, currentDate])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-red-950 flex items-center justify-center">
        <div className="text-white text-xl">Chargement du calendrier...</div>
      </div>
    )
  }

  // Fonction corrigée pour générer les jours du calendrier
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()

    // Premier jour du mois
    const firstDay = new Date(year, month, 1)
    // Dernier jour du mois
    const lastDay = new Date(year, month + 1, 0)
    // Nombre de jours dans le mois
    const daysInMonth = lastDay.getDate()
    // Jour de la semaine du premier jour (0 = dimanche)
    const startingDayOfWeek = firstDay.getDay()

    const days: Array<{ type: "empty" | "day"; day?: number; key: string }> = []

    // Ajouter les cases vides pour les jours avant le premier jour du mois
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push({
        type: "empty",
        key: `empty-${year}-${month}-${i}`,
      })
    }

    // Ajouter les jours du mois
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({
        type: "day",
        day,
        key: `day-${year}-${month}-${day}`,
      })
    }

    return days
  }

  const formatDateKey = (year: number, month: number, day: number) => {
    return `${year}-${(month + 1).toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`
  }

  const getDayStatus = (day: number) => {
    try {
      const dateKey = formatDateKey(currentDate.getFullYear(), currentDate.getMonth(), day)
      const dayData = calendarData[dateKey]

      if (!dayData) return "none"

      const hasPartner1Answer = dayData.answers.some((a) => a.userId === "partner1")
      const hasPartner2Answer = dayData.answers.some((a) => a.userId === "partner2")

      if (hasPartner1Answer && hasPartner2Answer) return "both"
      if (hasPartner1Answer || hasPartner2Answer) return "partial"
      return "question-only"
    } catch (error) {
      console.error("Error in getDayStatus:", error)
      return "none"
    }
  }

  const navigateMonth = (direction: "prev" | "next") => {
    if (isNavigating) return // Empêcher les clics multiples

    setIsNavigating(true)
    setSelectedDate(null)

    setCurrentDate((prev) => {
      const newDate = new Date(prev)
      if (direction === "prev") {
        newDate.setMonth(newDate.getMonth() - 1)
      } else {
        newDate.setMonth(newDate.getMonth() + 1)
      }
      return newDate
    })
  }

  const handleDayClick = (day: number) => {
    const dateKey = formatDateKey(currentDate.getFullYear(), currentDate.getMonth(), day)
    if (calendarData[dateKey]) {
      setSelectedDate(dateKey)
    }
  }

  const selectedDayData = selectedDate ? calendarData[selectedDate] : null

  if (!currentUser) {
    return null
  }

  const days = getDaysInMonth(currentDate)
  const monthNames = [
    "Janvier",
    "Février",
    "Mars",
    "Avril",
    "Mai",
    "Juin",
    "Juillet",
    "Août",
    "Septembre",
    "Octobre",
    "Novembre",
    "Décembre",
  ]
  const dayNames = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"]

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-red-950">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/">
            <Button variant="outline" size="sm" className="border-red-800/50 text-white hover:bg-red-950/30">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <Heart className="w-8 h-8 text-red-500" />
            <h1 className="text-3xl font-bold text-white">Calendrier des Questions</h1>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Calendar */}
          <div className="lg:col-span-2">
            <Card className="bg-black/60 backdrop-blur-md border-red-900/30">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigateMonth("prev")}
                    disabled={isNavigating}
                    className="text-white hover:bg-red-950/30 disabled:opacity-50"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <CardTitle className="text-white text-xl">
                    {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigateMonth("next")}
                    disabled={isNavigating}
                    className="text-white hover:bg-red-950/30 disabled:opacity-50"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Day headers */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {dayNames.map((day) => (
                    <div key={day} className="text-center text-gray-400 text-sm font-medium py-2">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar grid */}
                <div className="grid grid-cols-7 gap-1">
                  {days.map((dayItem) => {
                    if (dayItem.type === "empty") {
                      return <div key={dayItem.key} className="aspect-square" />
                    }

                    const day = dayItem.day!
                    const status = getDayStatus(day)
                    const dateKey = formatDateKey(currentDate.getFullYear(), currentDate.getMonth(), day)
                    const isSelected = selectedDate === dateKey
                    const isToday =
                      new Date().toDateString() ===
                      new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString()

                    return (
                      <button
                        key={dayItem.key}
                        onClick={() => handleDayClick(day)}
                        disabled={status === "none"}
                        className={`aspect-square flex items-center justify-center text-sm font-medium rounded-lg transition-all relative ${
                          isSelected
                            ? "bg-red-700 text-white ring-2 ring-red-500"
                            : status === "none"
                              ? "text-gray-600 cursor-not-allowed"
                              : "text-white hover:bg-red-950/30"
                        } ${isToday ? "ring-2 ring-gray-400" : ""}`}
                      >
                        {day}
                        {status !== "none" && (
                          <div
                            className={`absolute bottom-1 right-1 w-2 h-2 rounded-full ${
                              status === "both"
                                ? "bg-green-400"
                                : status === "partial"
                                  ? "bg-yellow-400"
                                  : "bg-blue-400"
                            }`}
                          />
                        )}
                      </button>
                    )
                  })}
                </div>

                {/* Legend */}
                <div className="flex items-center justify-center gap-4 mt-6 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-400" />
                    <span className="text-gray-400">Tous les deux ont répondu</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-yellow-400" />
                    <span className="text-gray-400">Une personne a répondu</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-400" />
                    <span className="text-gray-400">Question posée</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Selected Day Details */}
          <div>
            {selectedDayData ? (
              <Card className="bg-black/60 backdrop-blur-md border-red-900/30">
                <CardHeader>
                  <CardTitle className="text-white">
                    {new Date(selectedDate!).toLocaleDateString("fr-FR", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Question */}
                  <div>
                    <h3 className="text-white font-medium mb-2">Question</h3>
                    <p className="text-gray-300 text-sm leading-relaxed">{selectedDayData.question.text}</p>
                  </div>

                  {/* Answers */}
                  {selectedDayData.answers.length > 0 ? (
                    <div>
                      <h3 className="text-white font-medium mb-3">Réponses</h3>
                      <div className="space-y-4">
                        {selectedDayData.answers.map((answer) => {
                          const authorName = answer.userId === "partner1" ? partner1Name : partner2Name
                          const isMyAnswer = answer.userId === currentUser
                          const answerReactions = selectedDayData.reactions.filter((r) => r.answerId === answer.id)

                          return (
                            <div
                              key={answer.id}
                              className={`p-3 rounded-lg ${
                                isMyAnswer ? "bg-red-800/20 border border-red-700/30" : "bg-black/20"
                              }`}
                            >
                              <div className="flex items-center gap-2 mb-2">
                                <User className="w-4 h-4 text-gray-400" />
                                <span className="text-white text-sm font-medium">{authorName}</span>
                                {isMyAnswer && <Badge className="bg-red-800 text-xs">Vous</Badge>}
                              </div>
                              <p className="text-gray-300 text-sm leading-relaxed mb-2">{answer.text}</p>

                              {/* Reactions */}
                              {answerReactions.length > 0 && (
                                <div className="flex items-center gap-1 flex-wrap">
                                  {["like", "love", "laugh", "surprise"].map((type) => {
                                    const count = answerReactions.filter((r) => r.type === type).length
                                    if (count === 0) return null

                                    return (
                                      <ReactionButton
                                        key={type}
                                        type={type as any}
                                        isActive={false}
                                        count={count}
                                        onClick={() => {}}
                                      />
                                    )
                                  })}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-gray-500 text-sm">Aucune réponse pour cette question</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-black/60 backdrop-blur-md border-red-900/30">
                <CardContent className="p-8 text-center">
                  <Heart className="w-12 h-12 text-red-500/50 mx-auto mb-4" />
                  <p className="text-gray-400">Sélectionnez une date pour voir les détails</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
