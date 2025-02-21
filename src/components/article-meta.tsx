"use client"

import * as React from "react"
import { Card } from "@/components/ui/card"
import { CalendarIcon, ClockIcon, GlobeIcon } from "lucide-react"

interface ArticleMeta {
  title?: string
  description?: string
  image?: string
  siteName?: string
  publishedTime?: string
  author?: string
  url: string
  estimatedReadTime?: string
}

interface ArticleMetaCardProps {
  meta: ArticleMeta
}

export function ArticleMetaCard({ meta }: ArticleMetaCardProps) {
  const domain = React.useMemo(() => {
    try {
      return new URL(meta.url).hostname.replace('www.', '')
    } catch {
      return ''
    }
  }, [meta.url])

  return (
    <Card className="p-4 space-y-4">
      {meta.image && (
        <div className="aspect-[1200/630] relative overflow-hidden rounded-lg">
          <img
            src={meta.image}
            alt={meta.title || 'Article thumbnail'}
            className="object-cover w-full h-full"
          />
        </div>
      )}
      <div className="space-y-2">
        {meta.title && (
          <h3 className="font-semibold line-clamp-2">{meta.title}</h3>
        )}
        {meta.description && (
          <p className="text-sm text-muted-foreground line-clamp-3">
            {meta.description}
          </p>
        )}
      </div>
      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <GlobeIcon className="h-4 w-4" />
          <span>{domain}</span>
        </div>
        {meta.publishedTime && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <CalendarIcon className="h-4 w-4" />
            <time dateTime={meta.publishedTime}>
              {new Date(meta.publishedTime).toLocaleDateString()}
            </time>
          </div>
        )}
        {meta.estimatedReadTime && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <ClockIcon className="h-4 w-4" />
            <span>{meta.estimatedReadTime} read</span>
          </div>
        )}
      </div>
    </Card>
  )
} 