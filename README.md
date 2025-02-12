# TLDR - AI Article Summarizer

A Next.js application that provides AI-powered article summarization using OpenAI's GPT-4 model.

## Features

- Clean, minimal interface
- URL-based article summarization
- Real-time streaming responses
- Dark mode support
- Responsive design
- Error handling

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui components
- OpenAI API (GPT-4)

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/yourusername/tldr.git
cd tldr
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file in the root directory and add your OpenAI API key:
```
OPENAI_API_KEY=your-api-key-here
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Usage

1. Enter a URL of an article you want to summarize
2. Click the arrow button or press Enter
3. Wait for the AI to generate a concise summary
4. The summary will appear below the input field

## Deployment

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new).

## Environment Variables

Make sure to set the following environment variable in your deployment:

- `OPENAI_API_KEY`: Your OpenAI API key

## License

MIT
