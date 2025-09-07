"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useMemo } from "react"

interface DynamicAvatarProps {
  name: string
  email: string
  profileImage?: string
  className?: string
}

export default function DynamicAvatar({ name, email, profileImage, className }: DynamicAvatarProps) {
  const avatarData = useMemo(() => {
    const initials = name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)

    // Generate consistent colors based on name and email
    const hash = (str: string) => {
      let hash = 0
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i)
        hash = (hash << 5) - hash + char
        hash = hash & hash // Convert to 32bit integer
      }
      return Math.abs(hash)
    }

    const nameHash = hash(name + email)
    const hue = nameHash % 360

    // Generate gradient colors
    const primaryColor = `hsl(${hue}, 70%, 60%)`
    const secondaryColor = `hsl(${(hue + 60) % 360}, 70%, 70%)`

    return {
      initials,
      primaryColor,
      secondaryColor,
      gradient: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
    }
  }, [name, email])

  return (
    <Avatar className={className}>
      {profileImage ? <AvatarImage src={profileImage || "/placeholder.svg"} alt={name} /> : null}
      <AvatarFallback
        className="text-white font-semibold text-sm border-2 border-white/20"
        style={{
          background: avatarData.gradient,
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
        }}
      >
        {avatarData.initials}
      </AvatarFallback>
    </Avatar>
  )
}
