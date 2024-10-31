import type { Metadata } from "next";
import { Press_Start_2P } from 'next/font/google';
import "./globals.css";
import { Providers } from './providers';

const pressStart2P = Press_Start_2P({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-press-start',
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Terminal",
  description: "Who are you?",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body 
        className={`bg-black min-h-screen ${pressStart2P.className} scanline`}
        suppressHydrationWarning
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
