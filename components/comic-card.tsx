"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Globe, Lock } from "lucide-react"

interface ComicCardProps {
  title: string
  image: string
  description: string
  type: string[]
  vibe: string[]
  inspirationStyle?: string[]
  charactersCount: number
  isPublic?: boolean
  onClick: () => void
}

export function ComicCard({ 
  title, 
  image, 
  description, 
  type, 
  vibe, 
  inspirationStyle, 
  charactersCount,
  isPublic = false,
  onClick 
}: ComicCardProps) {

  return (
    <Card 
      className="bg-background border border-border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="aspect-square mb-3 overflow-hidden rounded-md relative">
        <img 
          src={image} 
          alt={title}
          className="w-full h-full object-cover"
        />
        {/* Public/Private indicator */}
        <div className="absolute top-2 right-2">
          {isPublic ? (
            <div className="bg-green-500/90 text-white rounded-full p-1.5 shadow-sm">
              <Globe className="h-3 w-3" />
            </div>
          ) : (
            <div className="bg-gray-500/90 text-white rounded-full p-1.5 shadow-sm">
              <Lock className="h-3 w-3" />
            </div>
          )}
        </div>
      </div>
      
      <CardContent className="p-0">
        <h3 className="font-semibold text-sm text-foreground mb-2 line-clamp-2">
          {title}
        </h3>
        
        <div className="space-y-2">
          <div className="flex flex-wrap gap-1">
            {type.map((t, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {t === 'black-white' ? 'B&W' : t === 'color' ? 'Color' : t}
              </Badge>
            ))}
            {vibe.map((v, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </Badge>
            ))}
            {inspirationStyle && inspirationStyle.length > 0 && inspirationStyle.map((style, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {style.charAt(0).toUpperCase() + style.slice(1)}
              </Badge>
            ))}
          </div>
          
          <p className="text-xs text-muted-foreground line-clamp-2">
            {description}
          </p>
          
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{charactersCount} character{charactersCount !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
