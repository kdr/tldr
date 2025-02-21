import { OpenAI } from 'openai'
import { NextRequest } from 'next/server'
import { type SummaryLength } from '@/components/length-selector'
import { type ArticleMeta } from '@/components/article-meta'
import { CheerioAPI, load } from 'cheerio'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const SUMMARY_PROMPTS: Record<SummaryLength, string> = {
  tweet: `You are a highly skilled AI that creates ultra-concise summaries.
Create a tweet-length summary (140 characters or less) that captures the essence of the article.
Focus on the most important point only.
Do not use hashtags or @mentions.`,

  two_sentences: `You are a highly skilled AI that creates concise summaries.
Summarize the article in exactly two clear, informative sentences.
Focus on the main point and one key supporting detail.`,

  bullets: `You are a highly skilled AI that creates bullet-point summaries.
Summarize the article in 3-5 bullet points.
Format in markdown with:
- Main point first
- Supporting points in order of importance
- Each point should be one line`,

  brief: `You are a highly skilled AI that creates concise summaries.
Summarize the article in two short paragraphs.
Format in markdown with:
- First paragraph: Overview and main point
- Second paragraph: Key details and implications`,

  detailed: `You are a highly skilled AI that creates detailed summaries.
Create a one-page summary of the article.
Format in markdown with:
## Key Points
- 3-4 main takeaways

## Summary
A few paragraphs providing a detailed summary

## Context & Implications
Brief discussion of broader context and implications`,
}

function estimateReadTime(text: string): string {
  const wordsPerMinute = 200
  const words = text.trim().split(/\s+/).length
  const minutes = Math.ceil(words / wordsPerMinute)
  return `${minutes} min`
}

function extractMetadata($: CheerioAPI): Partial<ArticleMeta> {
  const meta = {
    title: $('meta[property="og:title"]').attr('content') || $('title').text() || undefined,
    description: $('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content') || undefined,
    image: $('meta[property="og:image"]').attr('content') || undefined,
    siteName: $('meta[property="og:site_name"]').attr('content') || undefined,
    publishedTime: $('meta[property="article:published_time"]').attr('content') || undefined,
    author: $('meta[property="article:author"]').attr('content') || undefined,
  }

  // Clean up empty values
  return Object.fromEntries(
    Object.entries(meta).filter(([, value]) => value !== undefined)
  )
}

export async function POST(req: NextRequest) {
  try {
    const { url, length = 'brief' } = await req.json()

    if (!url) {
      return new Response('URL is required', { status: 400 })
    }

    // Validate URL
    try {
      new URL(url)
    } catch {
      return new Response('Invalid URL', { status: 400 })
    }

    // Fetch article content
    const response = await fetch(url)
    if (!response.ok) {
      return new Response('Failed to fetch article', { status: 400 })
    }
    const html = await response.text()

    // Parse HTML and extract metadata
    const $ = load(html)
    const metadata: ArticleMeta = {
      url,
      ...extractMetadata($),
    }

    // Extract text content for summarization
    const textContent = $('body')
      .find('script, style, noscript, iframe').remove().end()
      .text()
      .replace(/\s+/g, ' ')
      .trim()

    // Add estimated read time
    metadata.estimatedReadTime = estimateReadTime(textContent)

    // Create stream for summary
    const stream = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: SUMMARY_PROMPTS[length as SummaryLength],
        },
        {
          role: 'user',
          content: `Please provide a summary of the following article:\n\n${textContent}`,
        },
      ],
      stream: true,
      temperature: 0.5,
      max_tokens: length === 'detailed' ? 1000 : 500,
    })

    // Send metadata first
    const encoder = new TextEncoder()
    const metadataChunk = encoder.encode(JSON.stringify({ metadata }) + '\n---\n')

    // Return streaming response
    return new Response(
      new ReadableStream({
        async start(controller) {
          // Send metadata first
          controller.enqueue(metadataChunk)

          // Stream summary
          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content || ''
            controller.enqueue(encoder.encode(text))
          }
          controller.close()
        },
      }),
      {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Transfer-Encoding': 'chunked',
        },
      }
    )
  } catch (error) {
    console.error('Summarization error:', error)
    return new Response('Failed to generate summary', { status: 500 })
  }
} 