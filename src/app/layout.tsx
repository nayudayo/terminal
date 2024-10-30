import type { Metadata } from "next";
import { Press_Start_2P } from 'next/font/google';
import "./globals.css";

const pressStart2P = Press_Start_2P({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-press-start',
});

export const metadata: Metadata = {
  title: "Terminal",
  description: "Who are you?",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${pressStart2P.variable} bg-black text-[#FF0000] overflow-x-hidden`}>
        {children}
      </body>
    </html>
  );
}
