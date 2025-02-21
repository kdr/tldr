'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ThemeToggle } from '@/components/theme-toggle'
import { LengthSelector, type SummaryLength } from '@/components/length-selector'
import { ArticleMetaCard } from '@/components/article-meta'

export default function Home() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [summary, setSummary] = useState<string | null>(null)
  const [metadata, setMetadata] = useState<any>(null)
  const [length, setLength] = useState<SummaryLength>('brief')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
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
            } catch (e) {
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
    <main className="min-h-screen p-4 md:p-24">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold">TLDR</h1>
            <p className="text-lg text-muted-foreground">
              Instant AI-powered article summaries
            </p>
          </div>
          <ThemeToggle />
        </div>

        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-2">
              <Input
                type="url"
                placeholder="Enter article URL..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
                className="flex-1"
              />
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                ) : (
                  <ArrowRight className="h-5 w-5" />
                )}
                <span className="sr-only">Summarize</span>
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
                    <h2 className="text-xl font-semibold mb-4">TL;DR</h2>
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
    </main>
  )
}
