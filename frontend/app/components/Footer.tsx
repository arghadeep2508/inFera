"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-white/10 bg-black/40 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">

        <p className="text-center text-xs text-red-400 leading-relaxed">
          ⚠️ inFera provides AI-generated insights for educational purposes only.
          We do NOT provide financial, legal, or investment advice.
        </p>

        <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-300">
          <Link href="/how-to-use" className="hover:text-green-400">How to Use</Link>
          <Link href="/privacy-policy" className="hover:text-green-400">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-green-400">Terms</Link>
          <Link href="/contact" className="hover:text-green-400">Contact</Link>
        </div>

        <p className="text-center text-gray-500 text-xs">
          © {new Date().getFullYear()} inFera. All rights reserved.
        </p>

      </div>
    </footer>
  );
}
