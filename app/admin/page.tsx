"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Save, Key, Users, Bot, RefreshCw, Palette, Plus, Trash2, Clock, AlertTriangle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import {
  authenticateAdmin,
  loadSettingsForClient,
  saveSettings,
  regenerateTodaysQuestion,
  getTodaysQuestion,
  isOpenAiApiKeyConfigured,
} from "../actions"
import type { Settings, Question, QuestionTheme } from "@/lib/types"
import { defaultSettings } from "@/lib/settings"

const MASKED_PASSWORD_PLACEHOLDER = "********"

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [adminPasswordAttempt, setAdminPasswordAttempt] = useState("")

  // État pour les mots de passe et clé API saisis dans le formulaire
  const [formPasswords, setFormPasswords] = useState({
    partner1: "",
    partner2: "",
    admin: "",
  })
  const [formApiKey, setFormApiKey] = useState("")

  const [settings, setSettings] =
    useState<Omit<Settings, "partner1Password" | "partner2Password" | "adminPassword" | "openaiApiKey">>(
      defaultSettings,
    )
  const [isSaving, setIsSaving] = useState(false)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [todaysQuestion, setTodaysQuestion] = useState<Question | null>(null)
  const [simulatedDate, setSimulatedDate] = useState("")
  const [isApiKeyConfigured, setIsApiKeyConfigured] = useState<boolean | null>(null)

  useEffect(() => {
    if (isAuthenticated) {
      const fetchInitialData = async () => {
        try {
          const [clientSettings, question, apiKeyStatus] = await Promise.all([
            loadSettingsForClient(),
            getTodaysQuestion(),
            isOpenAiApiKeyConfigured(),
          ])
          setSettings(clientSettings)
          setTodaysQuestion(question)
          setIsApiKeyConfigured(apiKeyStatus)

          const now = new Date()
          setSimulatedDate(now.toISOString().split("T")[0])
        } catch (error) {
          console.error("Error fetching initial admin data:", error)
          alert("Erreur lors du chargement des données administrateur.")
        }
      }
      fetchInitialData()
    }
  }, [isAuthenticated])

  const handleLogin = async () => {
    try {
      const isValid = await authenticateAdmin(adminPasswordAttempt)
      if (isValid) {
        setIsAuthenticated(true)
      } else {
        alert("Mot de passe administrateur incorrect !")
      }
    } catch (error) {
      console.error("Admin login error:", error)
      alert("Erreur lors de l'authentification administrateur.")
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const settingsToSave: Partial<Settings> &
        Pick<Settings, "partner1Name" | "partner2Name" | "questionTime" | "relationshipStartDate" | "questionThemes"> =
        {
          ...settings,
          reunionDate: settings.reunionDate,
          quotes: settings.quotes,
          finalMessage: settings.finalMessage,
          likes: settings.likes,
        }

      // Ajouter les mots de passe du formulaire s'ils ont été saisis
      if (formPasswords.partner1) settingsToSave.partner1Password = formPasswords.partner1
      if (formPasswords.partner2) settingsToSave.partner2Password = formPasswords.partner2
      if (formPasswords.admin) settingsToSave.adminPassword = formPasswords.admin

      // Ajouter la clé API si elle a été saisie
      if (formApiKey) settingsToSave.openaiApiKey = formApiKey

      await saveSettings(settingsToSave)
      alert("Paramètres sauvegardés avec succès !")
      setFormPasswords({ partner1: "", partner2: "", admin: "" })
      setFormApiKey("")

      // Recharger le statut de la clé API
      const newApiKeyStatus = await isOpenAiApiKeyConfigured()
      setIsApiKeyConfigured(newApiKeyStatus)
    } catch (error) {
      alert(`Erreur lors de la sauvegarde: ${error.message}`)
      console.error("Save error details:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleRegenerateQuestion = async () => {
    if (!isApiKeyConfigured) {
      alert("La clé API OpenAI n'est pas configurée. Veuillez la configurer dans les paramètres.")
      return
    }
    const confirmRegenerate = confirm(
      "Êtes-vous sûr de vouloir régénérer la question du jour ? Cela supprimera toutes les réponses existantes pour aujourd'hui.",
    )
    if (!confirmRegenerate) return
    setIsRegenerating(true)
    try {
      const newQuestion = await regenerateTodaysQuestion()
      setTodaysQuestion(newQuestion)
      alert("Question régénérée avec succès !")
    } catch (error) {
      console.error("Regeneration error:", error)
      alert(`Erreur lors de la régénération: ${error.message}`)
    } finally {
      setIsRegenerating(false)
    }
  }

  const updateThemePercentage = (themeId: string, percentage: number) => {
    const updatedThemes = (settings.questionThemes || []).map((theme) =>
      theme.id === themeId ? { ...theme, percentage } : theme,
    )
    setSettings((s) => ({ ...s, questionThemes: updatedThemes }))
  }

  const addNewTheme = () => {
    const newTheme: QuestionTheme = {
      id: `custom_${Date.now()}`,
      name: "Nouveau Thème",
      description: "Description du nouveau thème",
      percentage: 0,
      color: "#dc2626",
    }
    setSettings((s) => ({ ...s, questionThemes: [...(s.questionThemes || []), newTheme] }))
  }

  const updateTheme = (themeId: string, updates: Partial<QuestionTheme>) => {
    const updatedThemes = (settings.questionThemes || []).map((theme) =>
      theme.id === themeId ? { ...theme, ...updates } : theme,
    )
    setSettings((s) => ({ ...s, questionThemes: updatedThemes }))
  }

  const deleteTheme = (themeId: string) => {
    if ((settings.questionThemes || []).length <= 1) {
      alert("Vous devez garder au moins un thème !")
      return
    }
    const updatedThemes = (settings.questionThemes || []).filter((theme) => theme.id !== themeId)
    setSettings((s) => ({ ...s, questionThemes: updatedThemes }))
  }

  const getTotalPercentage = () => {
    return (settings.questionThemes || []).reduce((sum, theme) => sum + theme.percentage, 0)
  }

  const getThemeForQuestion = (question: Question | null) => {
    if (!question?.theme || !settings.questionThemes) return null
    return settings.questionThemes.find((t) => t.id === question.theme)
  }

  const handleSimulateDate = async () => {
    if (!simulatedDate) {
      alert("Veuillez sélectionner une date !")
      return
    }
    const confirmSimulate = confirm(
      `Simuler la date : ${new Date(simulatedDate + "T00:00:00").toLocaleDateString("fr-FR")} ?\n\nCela va générer automatiquement une nouvelle question pour cette date.`,
    )
    if (confirmSimulate) {
      try {
        const { setSimulatedDate, checkAndGenerateQuestion } = await import("../actions")
        await setSimulatedDate(simulatedDate)
        const newQuestion = await checkAndGenerateQuestion(true)
        setTodaysQuestion(newQuestion)
        alert("Simulation activée ! Une nouvelle question a été générée pour cette date.")
      } catch (error) {
        alert("Erreur lors de l'activation de la simulation.")
        console.error(error)
      }
    }
  }

  const handleClearSimulation = async () => {
    try {
      const { clearSimulation, getTodaysQuestion } = await import("../actions")
      await clearSimulation()
      const realQuestion = await getTodaysQuestion()
      setTodaysQuestion(realQuestion)
      const now = new Date()
      setSimulatedDate(now.toISOString().split("T")[0])
      alert("Simulation désactivée ! Retour à la date réelle.")
    } catch (error) {
      alert("Erreur lors de la désactivation de la simulation.")
      console.error(error)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-red-950 flex items-center justify-center">
        <Card className="w-full max-w-md bg-black/70 backdrop-blur-md border-red-900/30">
          <CardHeader>
            <CardTitle className="text-center text-white">Administration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="admin-password-attempt" className="text-white">
                Mot de passe administrateur
              </Label>
              <Input
                id="admin-password-attempt"
                type="password"
                value={adminPasswordAttempt}
                onChange={(e) => setAdminPasswordAttempt(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleLogin()}
                placeholder="Entrez le mot de passe"
                className="bg-black/40 border-red-900/50 text-white placeholder-gray-400"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleLogin} className="flex-1 bg-red-700 hover:bg-red-800">
                Se connecter
              </Button>
              <Link href="/">
                <Button variant="outline" className="border-red-800/50 text-white hover:bg-red-950/30">
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const currentTheme = getThemeForQuestion(todaysQuestion)

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
          <h1 className="text-3xl font-bold text-white">Administration</h1>
          <Button onClick={handleSave} disabled={isSaving} className="ml-auto bg-red-700 hover:bg-red-800">
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? "Sauvegarde..." : "Sauvegarder"}
          </Button>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Today's Question Management */}
          <Card className="bg-black/60 backdrop-blur-md border-red-900/30 lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Bot className="w-5 h-5" /> Question du Jour
                {currentTheme && (
                  <Badge className="ml-2 text-white border-0" style={{ backgroundColor: currentTheme.color }}>
                    {currentTheme.name}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {todaysQuestion ? (
                <div className="space-y-4">
                  <div className="p-4 bg-black/30 rounded-lg border border-red-900/30">
                    <p className="text-white/90 leading-relaxed">{todaysQuestion.text}</p>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-white/50 text-sm">
                        Générée le {new Date(todaysQuestion.createdAt).toLocaleDateString("fr-FR")} à{" "}
                        {new Date(todaysQuestion.createdAt).toLocaleTimeString("fr-FR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                      {currentTheme && (
                        <Badge variant="outline" className="border-red-800/50 text-white/70">
                          Thème: {currentTheme.name}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button
                    onClick={handleRegenerateQuestion}
                    disabled={isRegenerating || !isApiKeyConfigured}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${isRegenerating ? "animate-spin" : ""}`} />
                    {isRegenerating ? "Régénération..." : "Régénérer la question"}
                  </Button>
                  {isApiKeyConfigured === false && (
                    <p className="text-yellow-400 text-sm flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" /> Clé API OpenAI non configurée. Configurez-la ci-dessous.
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-white/70 mb-4">Aucune question générée pour aujourd'hui.</p>
                  <Button
                    onClick={handleRegenerateQuestion}
                    disabled={isRegenerating || !isApiKeyConfigured}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Bot className={`w-4 h-4 mr-2 ${isRegenerating ? "animate-spin" : ""}`} />
                    {isRegenerating ? "Génération..." : "Générer une question"}
                  </Button>
                  {isApiKeyConfigured === false && (
                    <p className="text-yellow-400 text-sm mt-2 flex items-center justify-center gap-2">
                      <AlertTriangle className="w-4 h-4" /> Clé API OpenAI non configurée.
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Question Themes */}
          <Card className="bg-black/60 backdrop-blur-md border-red-900/30 lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-white">
                  <Palette className="w-5 h-5" />
                  Thèmes des Questions
                </CardTitle>
                <div className="flex items-center gap-4">
                  <div className="text-white/70 text-sm">
                    Total: {getTotalPercentage()}%{" "}
                    {getTotalPercentage() !== 100 && <span className="text-yellow-400 ml-2">⚠️ Doit être 100%</span>}
                  </div>
                  <Button onClick={addNewTheme} size="sm" className="bg-green-600 hover:bg-green-700">
                    <Plus className="w-4 h-4 mr-1" />
                    Ajouter
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {(settings.questionThemes || []).map((theme) => (
                <div key={theme.id} className="space-y-3 p-4 bg-black/30 rounded-lg border border-red-900/30">
                  <div className="flex items-center gap-4">
                    <div className="flex-1 grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-white text-sm">Nom du thème</Label>
                        <Input
                          value={theme.name}
                          onChange={(e) => updateTheme(theme.id, { name: e.target.value })}
                          className="bg-black/40 border-red-900/50 text-white"
                        />
                      </div>
                      <div>
                        <Label className="text-white text-sm">Couleur</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={theme.color}
                            onChange={(e) => updateTheme(theme.id, { color: e.target.value })}
                            className="w-12 h-10 bg-black/40 border-red-900/50"
                          />
                          <Badge className="flex-1 justify-center" style={{ backgroundColor: theme.color }}>
                            {theme.name}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    {(settings.questionThemes || []).length > 1 && (
                      <Button onClick={() => deleteTheme(theme.id)} size="sm" variant="destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  <div>
                    <Label className="text-white text-sm">Description</Label>
                    <Input
                      value={theme.description}
                      onChange={(e) => updateTheme(theme.id, { description: e.target.value })}
                      className="bg-black/40 border-red-900/50 text-white"
                      placeholder="Description du thème..."
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-white text-sm">Pourcentage</Label>
                      <span className="text-white/70 text-sm">{theme.percentage}%</span>
                    </div>
                    <Slider
                      value={[theme.percentage]}
                      onValueChange={(value) => updateThemePercentage(theme.id, value[0])}
                      max={100}
                      step={5}
                      className="w-full"
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Couple Settings */}
          <Card className="bg-black/60 backdrop-blur-md border-red-900/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Users className="w-5 h-5" />
                Configuration du Couple
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="partner1-name" className="text-white">
                    Nom Partenaire 1
                  </Label>
                  <Input
                    id="partner1-name"
                    value={settings.partner1Name}
                    onChange={(e) => setSettings((s) => ({ ...s, partner1Name: e.target.value }))}
                    className="bg-black/40 border-red-900/50 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="partner1-password-form" className="text-white">
                    Mot de passe P1
                  </Label>
                  <Input
                    id="partner1-password-form"
                    type="password"
                    placeholder={MASKED_PASSWORD_PLACEHOLDER}
                    value={formPasswords.partner1}
                    onChange={(e) => setFormPasswords((p) => ({ ...p, partner1: e.target.value }))}
                    className="bg-black/40 border-red-900/50 text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="partner2-name" className="text-white">
                    Nom Partenaire 2
                  </Label>
                  <Input
                    id="partner2-name"
                    value={settings.partner2Name}
                    onChange={(e) => setSettings((s) => ({ ...s, partner2Name: e.target.value }))}
                    className="bg-black/40 border-red-900/50 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="partner2-password-form" className="text-white">
                    Mot de passe P2
                  </Label>
                  <Input
                    id="partner2-password-form"
                    type="password"
                    placeholder={MASKED_PASSWORD_PLACEHOLDER}
                    value={formPasswords.partner2}
                    onChange={(e) => setFormPasswords((p) => ({ ...p, partner2: e.target.value }))}
                    className="bg-black/40 border-red-900/50 text-white"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="relationship-start" className="text-white">
                  Date de début de relation
                </Label>
                <Input
                  id="relationship-start"
                  type="date"
                  value={settings.relationshipStartDate}
                  onChange={(e) => setSettings((s) => ({ ...s, relationshipStartDate: e.target.value }))}
                  className="bg-black/40 border-red-900/50 text-white"
                />
              </div>
            </CardContent>
          </Card>

          {/* AI Settings */}
          <Card className="bg-black/60 backdrop-blur-md border-red-900/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Bot className="w-5 h-5" />
                Configuration IA
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="openai-api-key" className="text-white">
                  Clé API OpenAI
                </Label>
                <Input
                  id="openai-api-key"
                  type="password"
                  placeholder={isApiKeyConfigured ? "Clé API configurée" : "sk-..."}
                  value={formApiKey}
                  onChange={(e) => setFormApiKey(e.target.value)}
                  className="bg-black/40 border-red-900/50 text-white"
                />
                {isApiKeyConfigured === null && <p className="text-white/70 text-sm mt-1">Vérification du statut...</p>}
                {isApiKeyConfigured === true && <p className="text-green-400 text-sm mt-1">✓ Clé API configurée</p>}
                {isApiKeyConfigured === false && (
                  <p className="text-yellow-400 text-sm mt-1">⚠️ Clé API non configurée</p>
                )}
              </div>
              <div>
                <Label htmlFor="question-time" className="text-white">
                  Heure de génération des questions
                </Label>
                <Input
                  id="question-time"
                  type="time"
                  value={settings.questionTime}
                  onChange={(e) => setSettings((s) => ({ ...s, questionTime: e.target.value }))}
                  className="bg-black/40 border-red-900/50 text-white"
                />
                <p className="text-white/70 text-xs mt-1">
                  Heure locale à laquelle une nouvelle question sera disponible.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card className="bg-black/60 backdrop-blur-md border-red-900/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Key className="w-5 h-5" />
                Sécurité
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="admin-password-form" className="text-white">
                  Mot de passe administrateur
                </Label>
                <Input
                  id="admin-password-form"
                  type="password"
                  placeholder={MASKED_PASSWORD_PLACEHOLDER}
                  value={formPasswords.admin}
                  onChange={(e) => setFormPasswords((p) => ({ ...p, admin: e.target.value }))}
                  className="bg-black/40 border-red-900/50 text-white"
                />
              </div>
            </CardContent>
          </Card>

          {/* Testing & Simulation */}
          <Card className="bg-black/60 backdrop-blur-md border-red-900/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Clock className="w-5 h-5" />
                Simulation de Date
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="simulate-date" className="text-white">
                  Simuler une Date
                </Label>
                <Input
                  id="simulate-date"
                  type="date"
                  value={simulatedDate}
                  onChange={(e) => setSimulatedDate(e.target.value)}
                  className="bg-black/40 border-red-900/50 text-white"
                />
                <p className="text-white/70 text-xs mt-1">
                  Permet de tester en générant une question pour une date spécifique.
                </p>
              </div>
              <Button
                onClick={handleSimulateDate}
                disabled={!simulatedDate}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                <Clock className="w-4 h-4 mr-2" />
                Simuler cette date
              </Button>
              <Button onClick={handleClearSimulation} className="w-full bg-gray-600 hover:bg-gray-700 mt-2">
                <Clock className="w-4 h-4 mr-2" />
                Retour à la date réelle
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
