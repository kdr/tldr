'use client'

import { useState, useEffect, Suspense } from 'react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ArrowRight, Share2, Check } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ThemeToggle } from '@/components/theme-toggle'
import { LengthSelector, type SummaryLength } from '@/components/length-selector'
import { ArticleMetaCard } from '@/components/article-meta'
import type { ArticleMeta } from '@/components/article-meta'
import { useSearchParams } from 'next/navigation'
import { useToast } from "@/hooks/use-toast"

function MainContent() {
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [summary, setSummary] = useState<string | null>(null)
  const [metadata, setMetadata] = useState<ArticleMeta | null>(null)
  const [length, setLength] = useState<SummaryLength>('brief')
  const [isSharing, setIsSharing] = useState(false)

  useEffect(() => {
    const urlParam = searchParams.get('url')
    if (urlParam) {
      setUrl(urlParam)
    }
  }, [searchParams])

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/?url=${encodeURIComponent(url)}`
    
    try {
      setIsSharing(true)
      await navigator.clipboard.writeText(shareUrl)
      toast({
        description: "Share link copied to clipboard!",
        duration: 3000,
      })
    } catch {
      toast({
        description: "Failed to copy link",
        variant: "destructive",
      })
    } finally {
      setIsSharing(false)
    }
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError(null)
    setSummary(null)
    setMetadata(null)

    try {
      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url, length }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate summary')
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let result = ''
      let metadataReceived = false

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          
          if (!metadataReceived) {
            const [metadataStr, ...contentParts] = chunk.split('\n---\n')
            try {
              const { metadata } = JSON.parse(metadataStr)
              setMetadata(metadata)
              result = contentParts.join('\n---\n')
              metadataReceived = true
            } catch {
              result += chunk
            }
          } else {
            result += chunk
          }
          
          setSummary(result)
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex flex-col">
      <div className="flex-1 p-4 md:p-24">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold">TLDR</h1>
          </div>

          <Card className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex gap-2">
                <Input
                  type="url"
                  placeholder="Enter article URL..."
                  value={url}
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) => setUrl(event.target.value)}
                  required
                  className="flex-1"
                />
                <Button type="submit" disabled={loading} className="min-w-24">
                  {loading ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  ) : (
                    <>
                      <span>TL;DR</span>
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">Summary length:</span>
                <LengthSelector value={length} onChange={setLength} />
              </div>
            </form>
          </Card>

          {error && (
            <Card className="p-6 border-destructive">
              <p className="text-destructive">{error}</p>
            </Card>
          )}

          {(summary || metadata) && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                {summary && (
                  <Card className="p-6">
                    <div className="prose dark:prose-invert max-w-none">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold m-0">TL;DR</h2>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleShare}
                          className="h-8"
                        >
                          {isSharing ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <>
                              <Share2 className="h-4 w-4 mr-2" />
                              <span>Share</span>
                            </>
                          )}
                        </Button>
                      </div>
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        className="whitespace-pre-wrap [&_a]:text-primary [&_a]:hover:underline [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm [&_pre]:bg-muted [&_pre]:p-4 [&_pre]:rounded-lg"
                      >
                        {summary}
                      </ReactMarkdown>
                    </div>
                  </Card>
                )}
              </div>
              <div>
                {metadata && <ArticleMetaCard meta={metadata} />}
              </div>
            </div>
          )}
        </div>
      </div>
      <footer className="border-t py-4">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">AI-powered article summaries</p>
          <ThemeToggle />
        </div>
      </footer>
    </main>
  )
}

export default function Home() {
  return (
    <Suspense>
      <MainContent />
    </Suspense>
  )
}
