"use client";

import { useEffect, useState } from "react";
import { getAIInsights } from "../lib/api";

export default function AIInsights() {
  const [insights, setInsights] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        const data = await getAIInsights();
        setInsights(data.insights);
      } catch (err) {
        setInsights("Failed to load AI insights");
      } finally {
        setLoading(false);
      }
    };

    fetchInsights();
  }, []);

  return (
    <div className="bg-white text-black p-6 rounded-xl shadow-md mt-6">
      <h2 className="text-xl font-bold mb-3">🤖 AI Insights</h2>

      {loading ? (
        <p>Generating insights...</p>
      ) : (
        <pre className="whitespace-pre-wrap text-sm">{insights}</pre>
      )}
    </div>
  );
}