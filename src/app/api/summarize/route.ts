import { OpenAI } from 'openai'
import { NextRequest } from 'next/server'
import { type SummaryLength } from '@/components/length-selector'

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

    // Extract text content (basic implementation - you might want to use a proper HTML parser)
    const textContent = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim()

    // Create stream
    const stream = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
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

    // Return streaming response
    return new Response(
      new ReadableStream({
        async start(controller) {
          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content || ''
            controller.enqueue(text)
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