import type { Metadata } from "next"
import { Geist, Geist_Mono, Inter } from "next/font/google"
import "@workspace/ui/globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@workspace/ui/components/sonner"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
})

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  title: "Slope | Master Competitive Coding",
  description:
    "The premium platform for technical interview preparation and competitive programming.",
  icons: {
    icon: [
      {
        url: "/favicon-io/favicon-16x16.png",
        sizes: "16x16",
        type: "image/png",
      },
      {
        url: "/favicon-io/favicon-32x32.png",
        sizes: "32x32",
        type: "image/png",
      },
      { url: "/favicon-io/favicon.ico", sizes: "any" },
    ],
    apple: [
      {
        url: "/favicon-io/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
    other: [
      { rel: "manifest", url: "/favicon-io/site.webmanifest" },
      {
        rel: "icon",
        type: "image/png",
        sizes: "192x192",
        url: "/favicon-io/android-chrome-192x192.png",
      },
      {
        rel: "icon",
        type: "image/png",
        sizes: "512x512",
        url: "/favicon-io/android-chrome-512x512.png",
      },
    ],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
