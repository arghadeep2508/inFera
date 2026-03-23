"use client";

import { useEffect, useState, useRef } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
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
  const API = process.env.NEXT_PUBLIC_API_URL
    ? `${process.env.NEXT_PUBLIC_API_URL}/api`
    : "";

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [forecast, setForecast] = useState<any>(null);
  const [prediction, setPrediction] = useState<any>(null);

  const [columns, setColumns] = useState<string[]>([]);
  const [target, setTarget] = useState<string>("");
  const [inputData, setInputData] = useState<Record<string, string>>({});

  const [aiInsights, setAIInsights] = useState("");

  const [previewLimit, setPreviewLimit] = useState(20);

  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [chatLoading, setChatLoading] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // ✅ FORMAT AI TEXT INTO SECTIONS
  const formatInsights = (text: string) => {
    if (!text) return {
      insights: [],
      patterns: [],
      issues: [],
      suggestions: [],
    };

    const clean = text.replace(/\*\*/g, "").replace(/-\s/g, "");

    const sections = {
      insights: [] as string[],
      patterns: [] as string[],
      issues: [] as string[],
      suggestions: [] as string[],
    };

    let current: keyof typeof sections | "" = "";

    clean.split("\n").forEach((line) => {
      const l = line.toLowerCase();

      if (l.includes("key insights")) current = "insights";
      else if (l.includes("patterns")) current = "patterns";
      else if (l.includes("issues")) current = "issues";
      else if (l.includes("suggestions")) current = "suggestions";
      else if (current && line.trim()) {
        sections[current].push(line.trim());
      }
    });

    return sections;
  };

  // ---------------- FETCH ----------------
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
      setAIInsights(aiData.insights || "No insights");
    } catch {
      setAIInsights("❌ Failed to load insights");
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

  const formatted = formatInsights(aiInsights);

  // ---------------- PREDICT ----------------
  const handlePredict = async () => {
    try {
      const res = await fetch(`${API}/predict/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: inputData }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.detail || "Prediction failed");

      setPrediction(json);
    } catch (e: any) {
      alert(e.message);
    }
  };

  // ---------------- FORECAST ----------------
  const handleForecast = async () => {
    try {
      const res = await fetch(`${API}/forecast/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: {
            ...inputData,
            Year: Number(inputData["Year"]) || 2020,
          },
          years_ahead: 5,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.detail || "Forecast failed");

      setForecast(json.forecast);
    } catch (e: any) {
      alert(e.message);
    }
  };

  // ---------------- CHAT ----------------
  const handleChat = async () => {
    if (!chatInput.trim()) return;

    const userMsg = chatInput;
    setChatHistory((p) => [...p, { role: "user", text: userMsg }]);
    setChatInput("");
    setChatLoading(true);

    try {
      const res = await fetch(`${API}/chat/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: userMsg }),
      });

      const json = await res.json();

      setChatHistory((p) => [
        ...p,
        { role: "ai", text: json.answer },
      ]);
    } catch {
      setChatHistory((p) => [
        ...p,
        { role: "ai", text: "❌ Error" },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const rows = data?.rows ?? 0;
  const cols = data?.columns ?? 0;
  const numeric = data?.numeric_columns ?? [];

  const summaryChartData = numeric.map((c: string) => ({
    name: c,
    value: data?.summary?.[c]?.mean || 0,
  }));

  const forecastChart =
    forecast &&
    Object.entries(forecast).map(([year, val]) => ({
      year,
      value: Number(val),
    }));

  if (loading)
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center text-gray-300">
          Loading...
        </div>
      </>
    );

  return (
    <>
      <Navbar />

      <div className="min-h-screen flex flex-col bg-[#0B0F14] text-gray-200">

        <div className="flex-1 max-w-7xl mx-auto p-8 space-y-10 w-full">

          <h1 className="text-3xl font-semibold">📊 Data Dashboard</h1>

          {/* STATS */}
          <div className="grid md:grid-cols-3 gap-6">
            <Stat title="Rows" value={rows} />
            <Stat title="Columns" value={cols} />
            <Stat title="Numeric Columns" value={numeric.length} />
          </div>

          {/* DATASET */}
          <Section title="📄 Dataset Preview">
            <div className="flex justify-end mb-2">
              <select
                value={previewLimit}
                onChange={(e) => setPreviewLimit(Number(e.target.value))}
                className="bg-[#0F172A] border border-white/5 px-3 py-1 rounded"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>

            <div className="overflow-x-auto rounded-xl border border-white/5">
              <table className="w-full text-sm">
                <thead className="bg-[#0F172A]">
                  <tr>
                    {data?.preview?.[0] &&
                      Object.keys(data.preview[0]).map((c: string) => (
                        <th key={c} className="p-2 text-gray-400">{c}</th>
                      ))}
                  </tr>
                </thead>
                <tbody>
                  {data?.preview?.map((row: any, i: number) => (
                    <tr key={i} className="border-t border-white/5">
                      {Object.values(row).map((v: any, j: number) => (
                        <td key={j} className="p-2 text-gray-300">{String(v)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          {/* AI INSIGHTS */}
          <Section title="🤖 AI Insights">
            <div className="grid md:grid-cols-2 gap-4">

              {formatted.insights.length > 0 && (
                <Card title="📊 Key Insights" color="text-blue-400" data={formatted.insights} />
              )}

              {formatted.patterns.length > 0 && (
                <Card title="📈 Patterns" color="text-purple-400" data={formatted.patterns} />
              )}

              {formatted.issues.length > 0 && (
                <Card title="⚠️ Issues" color="text-red-400" data={formatted.issues} />
              )}

              {formatted.suggestions.length > 0 && (
                <Card title="💡 Suggestions" color="text-green-400" data={formatted.suggestions} />
              )}

            </div>
          </Section>

          {/* CHART */}
          <Section title="📊 Data Overview">
            <div className="h-[300px] bg-[#0F172A] rounded-xl p-4 border border-white/5">
              <ResponsiveContainer>
                <LineChart data={summaryChartData}>
                  <CartesianGrid stroke="#1f2937" />
                  <XAxis dataKey="name" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip />
                  <Line dataKey="value" stroke="#6366F1" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Section>

          {/* PREDICT */}
          <Section title="🎯 Prediction">
            <div className="grid md:grid-cols-3 gap-3">
              {Object.keys(inputData).map((c) => (
                <input
                  key={c}
                  placeholder={c}
                  className="bg-[#0F172A] border border-white/5 p-2 rounded-xl"
                  value={inputData[c]}
                  onChange={(e) =>
                    setInputData({ ...inputData, [c]: e.target.value })
                  }
                />
              ))}
            </div>

            <button
              onClick={handlePredict}
              className="mt-3 bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-xl"
            >
              Predict
            </button>

            {prediction && (
              <div className="mt-3 p-4 bg-[#0F172A] border border-white/5 rounded-xl">
                <p className="text-sm text-gray-400">Prediction Result</p>
                <p className="text-indigo-400 text-2xl font-semibold">
                  {typeof prediction.prediction === "number"
                    ? prediction.prediction.toFixed(2)
                    : String(prediction.prediction)}
                </p>
              </div>
            )}
          </Section>

          {/* FORECAST */}
          <Section title="📈 Forecast">
            <button
              onClick={handleForecast}
              className="bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-xl"
            >
              Generate Forecast
            </button>

            {forecastChart && (
              <div className="h-[300px] mt-3 bg-[#0F172A] border border-white/5 rounded-xl p-4">
                <ResponsiveContainer>
                  <LineChart data={forecastChart}>
                    <CartesianGrid stroke="#1f2937" />
                    <XAxis dataKey="year" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip />
                    <Line dataKey="value" stroke="#6366F1" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </Section>

          {/* CHAT */}
          <Section title="💬 Chat with your Data">
            <div className="bg-[#0F172A] border border-white/5 rounded-xl p-4 flex flex-col h-[350px]">
              <div className="flex-1 overflow-y-auto space-y-3">
                {chatHistory.map((m, i) => (
                  <div
                    key={i}
                    className={`p-2 rounded-xl max-w-[70%] ${
                      m.role === "user"
                        ? "bg-indigo-600 ml-auto"
                        : "bg-[#1F2937]"
                    }`}
                  >
                    {m.text}
                  </div>
                ))}
                {chatLoading && <p>Thinking...</p>}
                <div ref={chatEndRef} />
              </div>

              <div className="flex mt-3 gap-2">
                <input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="flex-1 bg-[#0F172A] border border-white/5 p-2 rounded-xl"
                  placeholder="Ask about your data..."
                />
                <button
                  onClick={handleChat}
                  className="bg-indigo-600 px-4 rounded-xl"
                >
                  Send
                </button>
              </div>
            </div>
          </Section>

        </div>

        <Footer />
      </div>
    </>
  );
}

// UI
function Stat({ title, value }: any) {
  return (
    <div className="p-6 rounded-2xl bg-[#111827] border border-white/5 shadow">
      <p className="text-gray-400 text-sm">{title}</p>
      <h2 className="text-2xl font-semibold mt-1">{value}</h2>
    </div>
  );
}

function Section({ title, children }: any) {
  return (
    <div className="space-y-4 p-6 rounded-2xl bg-[#111827] border border-white/5 shadow">
      <h2 className="text-lg font-medium">{title}</h2>
      {children}
    </div>
  );
}

function Card({ title, color, data }: any) {
  return (
    <div className="p-4 rounded-xl bg-[#0F172A] border border-white/5">
      <h3 className={`font-semibold mb-2 ${color}`}>{title}</h3>
      <ul className="text-sm text-gray-300 space-y-1">
        {data.map((d: string, i: number) => (
          <li key={i}>{d}</li>
        ))}
      </ul>
    </div>
  );
}
