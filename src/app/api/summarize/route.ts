import { OpenAI } from 'openai'
import { NextRequest } from 'next/server'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json()

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
          content: 'You are a highly skilled AI assistant that creates concise, accurate summaries of articles. Focus on the main points and key takeaways.',
        },
        {
          role: 'user',
          content: `Please provide a clear and concise summary of the following article:\n\n${textContent}`,
        },
      ],
      stream: true,
      temperature: 0.5,
      max_tokens: 500,
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