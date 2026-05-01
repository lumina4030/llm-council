"use client";

import { Lightbulb } from "lucide-react";
import Link from "next/link";

export function NavbarComponent() {
  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
      <div className="flex items-center gap-2">
        <Lightbulb className="w-6 h-6 text-warning" />
        <Link href="/" className="font-bold text-xl">LLM Council</Link>
      </div>
      <Link
        href="/"
        className="px-4 py-2 text-sm font-medium rounded-lg bg-warning-500 text-white hover:bg-warning-600 transition-colors"
      >
        Projects
      </Link>
    </header>
  );
}