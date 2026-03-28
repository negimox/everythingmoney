import React from "react";
import { Google_Sans_Flex, Source_Serif_4 } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { shadcn } from "@clerk/ui/themes";
import "./globals.css";
import { Metadata } from "next";

const googleSans = Google_Sans_Flex({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
});

const merriweather = Source_Serif_4({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-display',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: {
    template: "Everything Money",
    default: "Everything Money - Indian Stock Market Analysis",
  },
  description:
    "Investment analysis platform for Indian stocks, mutual funds, and ETFs. Research, analyze portfolios, and track market sentiment in real-time.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${googleSans.className} ${merriweather.variable} antialiased`}
      >
        <ClerkProvider 
          afterSignOutUrl="/"
          appearance={{ theme: shadcn }}
        >
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
