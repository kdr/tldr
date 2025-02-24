import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TLDR - AI Article Summarizer",
  description: "Instant AI-powered article summaries",
  metadataBase: new URL('https://tldr.kdr.dev'),
  viewport: {
    width: 'device-width',
    initialScale: 1,
  },
  openGraph: {
    type: 'website',
    title: 'TLDR - AI Article Summarizer',
    description: 'Instant AI-powered article summaries',
    siteName: 'TLDR',
    locale: 'en_US',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'TLDR - AI Article Summarizer',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TLDR - AI Article Summarizer',
    description: 'Instant AI-powered article summaries',
    images: ['/og-image.png'],
    creator: '@kdrag0n',
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [
      { url: '/favicon.png', sizes: '32x32', type: 'image/png' }
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
