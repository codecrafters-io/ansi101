import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import PlausibleProvider from "next-plausible/dist/lib/PlausibleProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ANSI 101",
  description: "Learn and Debug ANSI Escape Sequences",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var storageKey = 'theme';
                  var className = 'dark';
                  var darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
                  var localStorageTheme = localStorage.getItem(storageKey);
                  var systemTheme = darkQuery.matches;
                  
                  // Use localStorage if it exists, otherwise use System Preference
                  var isDark = localStorageTheme === 'dark' || (!localStorageTheme && systemTheme);
                  
                  if (isDark) {
                    document.documentElement.classList.add(className);
                  } else {
                    document.documentElement.classList.remove(className);
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <PlausibleProvider domain="ansi101.com">{children}</PlausibleProvider>
        <Analytics />
      </body>
    </html>
  );
}
