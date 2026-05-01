import type { Metadata } from "next";
import { Providers } from "./providers";
import { NavbarComponent } from "@/components/layout/Navbar";
import "./globals.css";

export const metadata: Metadata = {
  title: "LLM Council - AI PRD Copilot",
  description: "Multi-agent PRD/Spec generator with AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">
        <Providers>
          <NavbarComponent />
          <main className="flex-1">{children}</main>
        </Providers>
      </body>
    </html>
  );
}