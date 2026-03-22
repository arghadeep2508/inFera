"use client";

import { useState } from "react";
import Navbar from "../components/Navbar";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  // ✅ SAFE ENV HANDLING
  const API =
    process.env.NEXT_PUBLIC_API_URL
      ? `${process.env.NEXT_PUBLIC_API_URL}/api`
      : "";

  const handleUpload = async () => {
    if (!file) {
      alert("Please select a file");
      return;
    }

    if (!API) {
      alert("API URL not configured");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setLoading(true);

      const res = await fetch(`${API}/upload/`, {
        method: "POST",
        body: formData,
      });

      // ✅ SAFE RESPONSE PARSING
      let data: any = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }

      if (!res.ok) {
        throw new Error(
          data?.detail || data?.message || "Upload failed"
        );
      }

      alert("✅ Upload successful");

      // ✅ CLEAN NAVIGATION (no reload issue)
      window.location.href = "/dashboard";

    } catch (err: any) {
      console.error("Upload Error:", err);
      alert(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      <div className="flex justify-center items-center h-[80vh]">
        <div className="p-10 bg-black/40 border border-gray-800 rounded-xl text-center">

          <h2 className="text-2xl mb-6">Upload Dataset</h2>

          <input
            type="file"
            accept=".csv"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="mb-4"
          />

          <br />

          <button
            onClick={handleUpload}
            disabled={loading}
            className={`px-6 py-2 rounded font-bold transition ${
              loading
                ? "bg-gray-500 cursor-not-allowed"
                : "bg-green-500 hover:bg-green-600 text-black"
            }`}
          >
            {loading ? "Uploading..." : "Upload"}
          </button>

        </div>
      </div>
    </div>
  );
}
