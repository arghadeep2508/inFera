"use client";

import Navbar from "./components/Navbar";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const API = "http://127.0.0.1:8000/api";

  const handleUpload = async () => {
    if (!file) {
      setMessage("⚠️ Please select a CSV file");
      return;
    }

    if (loading) return;

    setLoading(true);
    setMessage("Uploading dataset...");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await fetch(`${API}/upload/`, {
        method: "POST",
        body: formData,
      });

      const uploadData = await uploadRes.json();

      if (!uploadRes.ok) {
        throw new Error(uploadData.detail || "Upload failed");
      }

      setMessage("Training model...");

      const trainRes = await fetch(`${API}/train/`, {
        method: "POST",
      });

      const trainData = await trainRes.json();

      if (!trainRes.ok) {
        throw new Error(trainData.detail || "Training failed");
      }

      setMessage("Ready. Redirecting...");

      setTimeout(() => {
        router.push("/dashboard");
      }, 600);

    } catch (err: any) {
      console.error(err);
      setMessage(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-white">
      <Navbar />

      {/* HERO */}
      <div className="flex flex-col items-center justify-center text-center py-24 px-6">

        <h1 className="text-5xl md:text-6xl font-semibold mb-6">
          Turn Data Into{" "}
          <span className="text-indigo-400">Decisions</span>
        </h1>

        <p className="text-gray-400 max-w-xl mb-10 text-lg">
          Upload your dataset and get instant analysis, predictions,
          and forecasting powered by AI.
        </p>

        {/* UPLOAD BOX */}
        <div className="w-full max-w-md bg-[#111827] border border-gray-700 rounded-xl p-6 space-y-4">

          <input
            type="file"
            accept=".csv"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="w-full text-sm text-gray-300"
          />

          <button
            onClick={handleUpload}
            disabled={loading}
            className={`w-full py-3 rounded-lg font-medium transition ${
              loading
                ? "bg-gray-600 cursor-not-allowed"
                : "bg-indigo-500 hover:bg-indigo-600"
            }`}
          >
            {loading ? "Processing..." : "Upload & Analyze"}
          </button>

          {message && (
            <p className="text-sm text-gray-400 text-center">
              {message}
            </p>
          )}
        </div>
      </div>

      {/* FEATURES */}
      <div className="grid md:grid-cols-3 gap-6 px-10 pb-20">

        <div className="bg-[#111827] border border-gray-700 rounded-xl p-6">
          <h3 className="font-semibold mb-2">Auto Analysis</h3>
          <p className="text-gray-400 text-sm">
            Automatic EDA, insights and missing value detection
          </p>
        </div>

        <div className="bg-[#111827] border border-gray-700 rounded-xl p-6">
          <h3 className="font-semibold mb-2">ML Predictions</h3>
          <p className="text-gray-400 text-sm">
            Train models and generate predictions instantly
          </p>
        </div>

        <div className="bg-[#111827] border border-gray-700 rounded-xl p-6">
          <h3 className="font-semibold mb-2">Forecasting</h3>
          <p className="text-gray-400 text-sm">
            Predict future trends with AI models
          </p>
        </div>

      </div>
    </div>
  );
}