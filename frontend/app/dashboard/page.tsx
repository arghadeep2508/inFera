"use client";

import { useEffect, useState, useRef } from "react";
import Navbar from "../components/Navbar";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

export default function Dashboard() {
  const API =
    process.env.NEXT_PUBLIC_API_URL
      ? `${process.env.NEXT_PUBLIC_API_URL}/api`
      : "";

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [columns, setColumns] = useState<string[]>([]);
  const [target, setTarget] = useState<string>("");

  const [inputData, setInputData] = useState<Record<string, string>>({});

  const [prediction, setPrediction] = useState<any>(null);
  const [forecast, setForecast] = useState<any>(null);

  const [aiInsights, setAIInsights] = useState<string>("");
  const [aiLoading, setAILoading] = useState(true);

  const [previewLimit, setPreviewLimit] = useState(20);

  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState<
    { role: string; text: string }[]
  >([]);
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // -----------------------------
  // FETCH
  // -----------------------------
  const fetchAll = async () => {
    try {
      setLoading(true);

      const vis = await fetch(`${API}/visualize/?limit=${previewLimit}`);
      const visData = await vis.json();
      setData(visData);

      const col = await fetch(`${API}/columns/`);
      const colData = await col.json();

      if (colData.status === "success") {
        setColumns(colData.columns);
        setTarget(colData.target);

        const obj: Record<string, string> = {};
        colData.columns.forEach((c: string) => {
          if (c !== colData.target) obj[c] = "";
        });

        setInputData(obj);
      }

      const ai = await fetch(`${API}/ai-insights/`);
      const aiData = await ai.json();
      setAIInsights(aiData.insights || "No insights available");
    } catch (err) {
      console.error(err);
      setAIInsights("❌ Failed to load AI insights");
    } finally {
      setLoading(false);
      setAILoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, [previewLimit]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  // -----------------------------
  // CHAT
  // -----------------------------
  const handleChat = async () => {
    if (!chatInput.trim()) return;

    const userMessage = chatInput;

    setChatHistory((prev) => [...prev, { role: "user", text: userMessage }]);
    setChatInput("");
    setChatLoading(true);

    try {
      const res = await fetch(`${API}/chat/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: userMessage }),
      });

      const json = await res.json();

      setChatHistory((prev) => [
        ...prev,
        { role: "ai", text: json.answer },
      ]);
    } catch {
      setChatHistory((prev) => [
        ...prev,
        { role: "ai", text: "❌ Error getting response" },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  // -----------------------------
  // DATA
  // -----------------------------
  const rows = data?.rows ?? 0;
  const cols = data?.columns ?? 0;
  const numeric = data?.numeric_columns ?? [];

  // -----------------------------
  // LOADING
  // -----------------------------
  if (loading) {
    return (
      <>
        <Navbar />
        <div className="p-10 text-center text-white">
          ⏳ Loading dashboard...
        </div>
      </>
    );
  }

  if (!data) {
    return (
      <>
        <Navbar />
        <div className="p-10 text-center text-white">
          ❌ No data found
        </div>
      </>
    );
  }

  // -----------------------------
  // UI
  // -----------------------------
  return (
    <>
      <Navbar />

      <div className="max-w-7xl mx-auto p-8 space-y-10 text-white">

        {/* HEADER */}
        <h1 className="text-4xl font-semibold tracking-tight">
          📊 Data Dashboard
        </h1>

        {/* STATS */}
        <div className="grid md:grid-cols-3 gap-6">
          <Stat title="Rows" value={rows} />
          <Stat title="Columns" value={cols} />
          <Stat title="Numeric Columns" value={numeric.length} />
        </div>

        {/* PREVIEW */}
        <Section title="📄 Dataset Preview">
          <div className="flex justify-end mb-3">
            <select
              value={previewLimit}
              onChange={(e) => setPreviewLimit(Number(e.target.value))}
              className="bg-gray-900 border px-3 py-1 rounded"
            >
              <option value={10}>10 rows</option>
              <option value={20}>20 rows</option>
              <option value={50}>50 rows</option>
            </select>
          </div>

          <div className="overflow-x-auto border border-gray-800 rounded-xl">
            <table className="w-full text-sm">
              <thead className="bg-gray-900">
                <tr>
                  {data?.preview?.[0] &&
                    Object.keys(data.preview[0]).map((col: string) => (
                      <th key={col} className="p-3 text-left">
                        {col}
                      </th>
                    ))}
                </tr>
              </thead>

              <tbody>
                {data?.preview?.map((row: any, idx: number) => (
                  <tr key={idx} className="border-t border-gray-800">
                    {Object.values(row).map((val: any, i: number) => (
                      <td key={i} className="p-3">
                        {String(val)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        {/* AI INSIGHTS */}
        <Section title="🤖 AI Insights">
          <div className="bg-gradient-to-br from-green-900/30 to-black p-5 rounded-xl border">
            <p className="whitespace-pre-wrap text-green-300 text-sm leading-relaxed">
              {aiInsights}
            </p>
          </div>
        </Section>

        {/* CHAT */}
        <Section title="💬 Chat with your Data">
          <div className="bg-black/40 border rounded-xl p-4 h-[350px] flex flex-col">

            <div className="flex-1 overflow-y-auto space-y-3 pr-2">
              {chatHistory.map((msg, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-xl max-w-[80%] text-sm ${
                    msg.role === "user"
                      ? "ml-auto bg-blue-600 text-white"
                      : "bg-gray-800 text-green-300"
                  }`}
                >
                  {msg.text}
                </div>
              ))}

              {chatLoading && (
                <p className="text-gray-400 text-sm">AI is thinking...</p>
              )}

              <div ref={chatEndRef} />
            </div>

            <div className="flex gap-2 mt-3">
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleChat()}
                className="flex-1 bg-black border px-3 py-2 rounded text-sm"
                placeholder="Ask about trends, patterns..."
              />
              <button
                onClick={handleChat}
                className="bg-green-600 px-4 rounded hover:bg-green-700"
              >
                Send
              </button>
            </div>
          </div>
        </Section>
      </div>
    </>
  );
}

// -----------------------------
// UI COMPONENTS
// -----------------------------

function Stat({ title, value }: { title: string; value: number }) {
  return (
    <div className="p-6 bg-black/40 border border-gray-800 rounded-xl">
      <p className="text-gray-400 text-sm">{title}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <h2 className="text-xl font-semibold">{title}</h2>
      {children}
    </div>
  );
}
