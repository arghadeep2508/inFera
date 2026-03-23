"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-white/10 text-gray-400 text-sm">
      <div className="max-w-7xl mx-auto p-6 space-y-4">

        <p className="text-center text-red-400 text-xs">
          ⚠️ inFera provides AI-generated insights for educational purposes only.
          We do NOT provide financial, investment, or legal advice.
        </p>

        <div className="flex flex-wrap justify-center gap-6 text-gray-300">
          <Link href="/how-to-use">How to Use</Link>
          <Link href="/privacy-policy">Privacy Policy</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/contact">Contact</Link>
        </div>

        <p className="text-center text-gray-500">
          © {new Date().getFullYear()} inFera. All rights reserved.
        </p>

      </div>
    </footer>
  );
}
