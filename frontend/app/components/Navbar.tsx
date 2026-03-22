"use client";

import Link from "next/link";
import Image from "next/image";

export default function Navbar() {
  return (
    <div className="w-full flex items-center justify-between px-8 py-4 border-b border-gray-800">

      {/* LEFT: LOGO + NAME */}
      <Link href="/" className="flex items-center gap-3">
        
        {/* LOGO IMAGE */}
        <Image
        src="/logo.png"
        alt="inFera Logo"
        width={50}
        height={50}
        className="rounded-full neon-logo object-cover"
      />

        {/* BRAND NAME */}
        <span className="text-xl font-bold text-glow">
          inFera
        </span>

      </Link>

      {/* RIGHT: NAV LINKS */}
      <div className="flex gap-6 text-sm text-gray-300">
        <Link href="/" className="hover:text-white">
          Home
        </Link>

        <Link href="/dashboard" className="hover:text-white">
          Dashboard
        </Link>
      </div>

    </div>
  );
}