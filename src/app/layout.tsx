import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Brightloop · Subscription Management",
  description: "Brightloop subscription management system (Phase 1 prototype)",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
