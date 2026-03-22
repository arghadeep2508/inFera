"use client";

import { useState } from "react";
import Navbar from "../components/Navbar";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!file) {
      alert("Please select a file");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setLoading(true);

      const res = await fetch("http://127.0.0.1:8000/api/upload/", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Upload failed");
      }

      alert("✅ Upload successful");

      window.location.href = "/dashboard";

    } catch (err: any) {
      alert(err.message);
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
            className="bg-green-500 text-black px-6 py-2 rounded font-bold"
          >
            {loading ? "Uploading..." : "Upload"}
          </button>

        </div>

      </div>
    </div>
  );
}