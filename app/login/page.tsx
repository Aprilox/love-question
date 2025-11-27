"use client"

import { useState, useEffect } from "react"
import { Heart, User, Lock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { authenticateUser, loadSettingsForClient } from "../actions"
import { UserLoginSchema } from "@/lib/schemas"
import { ZodError } from "zod"

export default function LoginPage() {
  const [selectedUser, setSelectedUser] = useState<"partner1" | "partner2" | null>(null)
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingSettings, setIsLoadingSettings] = useState(false)
  const [partner1Name, setPartner1Name] = useState("Alex")
  const [partner2Name, setPartner2Name] = useState("Sam")
  const router = useRouter()

  // Load partner names with proper error handling and loading state
  useEffect(() => {
    let isMounted = true

    const loadPartnerNames = async () => {
      if (isLoadingSettings) return // Prevent multiple calls

      setIsLoadingSettings(true)
      try {
        const settings = await loadSettingsForClient()
        if (isMounted) {
          setPartner1Name(settings.partner1Name)
          setPartner2Name(settings.partner2Name)
        }
      } catch (error) {
        console.error("Error loading settings:", error)
        // Keep default names if loading fails
      } finally {
        if (isMounted) {
          setIsLoadingSettings(false)
        }
      }
    }

    loadPartnerNames()

    return () => {
      isMounted = false
    }
  }, []) // Empty dependency array, only run once

  const handleLogin = async () => {
    if (!selectedUser) {
      alert("Veuillez sélectionner un utilisateur.")
      return
    }

    try {
      UserLoginSchema.parse({ userId: selectedUser, password })
    } catch (error) {
      if (error instanceof ZodError) {
        alert(`Erreur de validation: ${error.errors[0]?.message}`)
      } else {
        alert("Erreur de validation inconnue.")
      }
      return
    }

    setIsLoading(true)
    try {
      const isValid = await authenticateUser(selectedUser, password)
      if (isValid) {
        localStorage.setItem("currentUser", selectedUser)
        localStorage.setItem("loginTime", new Date().toISOString())
        router.push("/")
      } else {
        alert("Identifiants incorrects !") // Message plus générique
      }
    } catch (error) {
      console.error("Login error:", error)
      alert("Erreur lors de la connexion. Veuillez réessayer.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-red-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-black/70 backdrop-blur-sm border-red-900/30 shadow-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Heart className="w-12 h-12 text-red-500 animate-pulse" />
          </div>
          <CardTitle className="text-2xl font-bold text-white">Questions de Couple</CardTitle>
          <p className="text-gray-300">Connectez-vous pour répondre à la question du jour</p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* User Selection */}
          <div className="space-y-3">
            <Label className="text-white font-medium">Qui êtes-vous ?</Label>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant={selectedUser === "partner1" ? "default" : "outline"}
                onClick={() => setSelectedUser("partner1")}
                disabled={isLoadingSettings}
                className={`h-16 flex flex-col gap-2 ${
                  selectedUser === "partner1"
                    ? "bg-gradient-to-r from-red-700 to-red-900 hover:from-red-800 hover:to-red-950 text-white"
                    : "bg-black/40 border-red-800/50 text-gray-300 hover:bg-red-950/30"
                }`}
              >
                <User className="w-5 h-5" />
                <span className="text-sm font-medium">{isLoadingSettings ? "..." : partner1Name}</span>
              </Button>
              <Button
                variant={selectedUser === "partner2" ? "default" : "outline"}
                onClick={() => setSelectedUser("partner2")}
                disabled={isLoadingSettings}
                className={`h-16 flex flex-col gap-2 ${
                  selectedUser === "partner2"
                    ? "bg-gradient-to-r from-red-700 to-red-900 hover:from-red-800 hover:to-red-950 text-white"
                    : "bg-black/40 border-red-800/50 text-gray-300 hover:bg-red-950/30"
                }`}
              >
                <User className="w-5 h-5" />
                <span className="text-sm font-medium">{isLoadingSettings ? "..." : partner2Name}</span>
              </Button>
            </div>
          </div>

          {/* Password Input */}
          {selectedUser && (
            <div className="space-y-2">
              <Label htmlFor="password" className="text-white font-medium">
                Mot de passe
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleLogin()}
                  placeholder="Entrez votre mot de passe"
                  className="pl-10 bg-black/40 border-red-900/50 text-white placeholder-gray-400 focus:border-red-600 focus:ring-red-600"
                />
              </div>
            </div>
          )}

          {/* Login Button */}
          <Button
            onClick={handleLogin}
            disabled={!selectedUser || !password || isLoading || isLoadingSettings}
            className="w-full bg-gradient-to-r from-red-700 to-red-900 hover:from-red-800 hover:to-red-950 text-white font-medium py-3"
          >
            {isLoading ? "Connexion..." : "Se connecter"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
