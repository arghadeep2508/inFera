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

  const [forecast, setForecast] = useState<any>(null);

  const [aiInsights, setAIInsights] = useState<string>("");

  const [previewLimit, setPreviewLimit] = useState(20);

  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState<
    { role: string; text: string }[]
  >([]);
  const [chatLoading, setChatLoading] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // -----------------------------
  // FETCH DATA
  // -----------------------------
  const fetchAll = async () => {
    try {
      setLoading(true);

      const vis = await fetch(`${API}/visualize/?limit=${previewLimit}`);
      const visData = await vis.json();
      setData(visData);

      const ai = await fetch(`${API}/ai-insights/`);
      const aiData = await ai.json();
      setAIInsights(aiData.insights || "No insights available");
    } catch (err) {
      console.error(err);
      setAIInsights("❌ Failed to load AI insights");
    } finally {
      setLoading(false);
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
        headers: {
          "Content-Type": "application/json",
        },
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
  // FORECAST
  // -----------------------------
  const handleForecast = async () => {
    try {
      const res = await fetch(`${API}/forecast/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          years_ahead: 5,
        }),
      });

      const json = await res.json();
      setForecast(json.forecast);
    } catch {
      alert("Forecast failed");
    }
  };

  // -----------------------------
  // DATA SAFE
  // -----------------------------
  const rows = data?.rows ?? 0;
  const cols = data?.columns ?? 0;
  const numeric = data?.numeric_columns ?? [];

  const summaryChartData = numeric.map((col: string) => ({
    name: col,
    value: data?.summary?.[col]?.mean || 0,
  }));

  const forecastChart =
    forecast &&
    Object.entries(forecast).map(([year, value]) => ({
      year,
      value: Number(value),
    }));

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

        <h1 className="text-4xl font-semibold">
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

          <div className="overflow-x-auto border rounded-xl">
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
          <div className="bg-green-900/20 border p-4 rounded-xl">
            <p className="whitespace-pre-wrap text-green-300 text-sm">
              {aiInsights}
            </p>
          </div>
        </Section>

        {/* SUMMARY CHART */}
        <Section title="📊 Data Overview">
          <div className="bg-black/40 border rounded-xl p-4 h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={summaryChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="name" stroke="#aaa" />
                <YAxis stroke="#aaa" />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#22c55e"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Section>

        {/* FORECAST */}
        <Section title="📈 Forecast">
          <button
            onClick={handleForecast}
            className="mb-3 bg-blue-600 px-4 py-2 rounded"
          >
            Generate Forecast
          </button>

          {forecastChart && (
            <div className="bg-black/40 border rounded-xl p-4 h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={forecastChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="year" stroke="#aaa" />
                  <YAxis stroke="#aaa" />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#3b82f6"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </Section>

        {/* CHAT */}
        <Section title="💬 Chat with your Data">
          <div className="bg-black/40 border rounded-xl p-4 h-[350px] flex flex-col">

            <div className="flex-1 overflow-y-auto space-y-3">
              {chatHistory.map((msg, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-xl max-w-[80%] ${
                    msg.role === "user"
                      ? "ml-auto bg-blue-600"
                      : "bg-gray-800 text-green-300"
                  }`}
                >
                  {msg.text}
                </div>
              ))}

              {chatLoading && <p>Thinking...</p>}
              <div ref={chatEndRef} />
            </div>

            <div className="flex gap-2 mt-3">
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="flex-1 bg-black border px-3 py-2 rounded"
                placeholder="Ask something..."
              />
              <button
                onClick={handleChat}
                className="bg-green-600 px-4 rounded"
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

// UI COMPONENTS
function Stat({ title, value }: any) {
  return (
    <div className="p-6 bg-black/40 border rounded-xl">
      <p className="text-gray-400">{title}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

function Section({ title, children }: any) {
  return (
    <div className="space-y-3">
      <h2 className="text-xl font-semibold">{title}</h2>
      {children}
    </div>
  );
}
