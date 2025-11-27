"use server"

import { promises as fs } from "fs"
import path from "path"
import type { Settings } from "@/lib/settings"

const SETTINGS_FILE = path.join(process.cwd(), "data", "settings.json")

export async function loadSettings(): Promise<Settings> {
  try {
    const data = await fs.readFile(SETTINGS_FILE, "utf8")
    return JSON.parse(data)
  } catch (error) {
    console.error("Erreur lors du chargement:", error)
    throw new Error("Impossible de charger les paramètres")
  }
}

export async function saveSettings(settings: Settings): Promise<void> {
  try {
    await fs.writeFile(SETTINGS_FILE, JSON.stringify(settings, null, 2))
  } catch (error) {
    console.error("Erreur lors de la sauvegarde:", error)
    throw new Error("Impossible de sauvegarder les paramètres")
  }
}
