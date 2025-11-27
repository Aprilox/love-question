"use client"

import { Button } from "@/components/ui/button"
import type { Reaction } from "@/lib/types"

interface ReactionButtonProps {
  type: Reaction["type"]
  isActive: boolean
  count: number
  onClick: () => void
}

const reactionEmojis = {
  like: "👍",
  love: "❤️",
  laugh: "😂",
  surprise: "😮",
  sad: "😢",
  angry: "😠",
}

export function ReactionButton({ type, isActive, count, onClick }: ReactionButtonProps) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      className={`flex items-center gap-1 h-8 px-2 rounded-full transition-all ${
        isActive
          ? "bg-red-800/60 text-white scale-110"
          : "bg-black/30 text-gray-300 hover:bg-red-950/40 hover:text-white"
      }`}
    >
      <span className="text-sm">{reactionEmojis[type]}</span>
      {count > 0 && <span className="text-xs font-medium">{count}</span>}
    </Button>
  )
}
