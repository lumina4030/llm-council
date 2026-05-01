"use client";

import { Lightbulb } from "lucide-react";
import Link from "next/link";

export function NavbarComponent() {
  return (
    <header className="sticky top-0 z-50 glass border-b border-white/10">
      <div className="container mx-auto px-6 py-4 max-w-6xl">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300">
              <Lightbulb className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl gradient-text">LLM Council</span>
          </Link>
          <Link
            href="/"
            className="px-5 py-2.5 text-sm font-semibold rounded-xl btn-gradient text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
          >
            Projects
          </Link>
        </div>
      </div>
    </header>
  );
}