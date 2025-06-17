import type { Metadata } from "next";
import { Inter } from "next/font/google"; // Changed from Geist to Inter
import "./globals.css";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" }); // Using Inter

export const metadata: Metadata = {
  title: "Security Research Platform", // Updated title
  description: "Analyze video URLs for security vulnerabilities", // Updated description
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased dark", // Added dark theme, bg-background, font-sans
          inter.variable
        )}
      >
        {children}
      </body>
    </html>
  );
}
