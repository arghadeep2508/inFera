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

  // ---------------- PREDICT ----------------
  const handlePredict = async () => {
    try {
      const res = await fetch(`${API}/predict/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: inputData }),
      });

      const json = await res.json();
      setPrediction(json);
    } catch {
      alert("Prediction failed");
    }
  };

  // ---------------- FORECAST ----------------
  const handleForecast = async () => {
    try {
      const res = await fetch(`${API}/forecast/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: inputData, years_ahead: 5 }),
      });

      const json = await res.json();
      setForecast(json.forecast);
    } catch {
      alert("Forecast failed");
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

  // ---------------- DATA ----------------
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

  // ---------------- LOADING ----------------
  if (loading)
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center text-white">
          Loading...
        </div>
      </>
    );

  // ---------------- UI ----------------
  return (
    <>
      <Navbar />

      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white">
        <div className="max-w-7xl mx-auto p-8 space-y-10">

          <h1 className="text-4xl font-bold">📊 Data Dashboard</h1>

          {/* STATS */}
          <div className="grid md:grid-cols-3 gap-6">
            <Stat title="Rows" value={rows} />
            <Stat title="Columns" value={cols} />
            <Stat title="Numeric Columns" value={numeric.length} />
          </div>

          {/* TABLE */}
          <Section title="📄 Dataset Preview">
            <div className="flex justify-end mb-2">
              <select
                value={previewLimit}
                onChange={(e) => setPreviewLimit(Number(e.target.value))}
                className="bg-black border border-white/10 px-3 py-1 rounded"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>

            <div className="overflow-x-auto rounded-xl border border-white/10">
              <table className="w-full text-sm">
                <thead className="bg-gray-900 sticky top-0">
                  <tr>
                    {data?.preview?.[0] &&
                      Object.keys(data.preview[0]).map((c: string) => (
                        <th key={c} className="p-3 text-left text-gray-300">
                          {c}
                        </th>
                      ))}
                  </tr>
                </thead>
                <tbody>
                  {data?.preview?.map((row: any, i: number) => (
                    <tr
                      key={i}
                      className={`border-t border-white/5 ${
                        i % 2 === 0 ? "bg-white/5" : ""
                      } hover:bg-white/10 transition`}
                    >
                      {Object.values(row).map((v: any, j: number) => (
                        <td key={j} className="p-3">
                          {String(v)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          {/* AI */}
          <Section title="🤖 AI Insights">
            <div className="relative bg-gradient-to-br from-green-900/20 to-black border border-green-500/20 p-6 rounded-2xl">
              <div className="absolute top-2 right-3 text-xs text-green-400">
                AI GENERATED
              </div>

              <div className="text-green-300 text-sm space-y-2">
                {aiInsights.split("\n").map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
            </div>
          </Section>

          {/* CHART */}
          <Section title="📊 Data Overview">
            <div className="h-[300px] bg-black/40 border border-white/10 rounded-xl p-3">
              <ResponsiveContainer>
                <LineChart data={summaryChartData}>
                  <CartesianGrid stroke="#444" strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#111", border: "none" }}
                  />
                  <Line
                    dataKey="value"
                    stroke="#22c55e"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                  />
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
                  className="bg-black/50 border border-white/10 focus:border-green-400 focus:ring-1 focus:ring-green-400 p-2 rounded-xl outline-none"
                  value={inputData[c]}
                  onChange={(e) =>
                    setInputData({ ...inputData, [c]: e.target.value })
                  }
                />
              ))}
            </div>

            <button
              onClick={handlePredict}
              className="mt-3 bg-green-600 hover:bg-green-500 transition px-5 py-2 rounded-xl shadow-md active:scale-95"
            >
              Predict
            </button>

            {prediction && (
              <div className="mt-3 p-3 bg-green-900/30 border border-green-500/20 rounded-xl">
                <p className="font-semibold">Prediction Result:</p>
                <p className="text-green-400 text-xl">
                  {prediction.prediction?.toFixed(2)}
                </p>
              </div>
            )}
          </Section>

          {/* FORECAST */}
          <Section title="📈 Forecast">
            <button
              onClick={handleForecast}
              className="bg-blue-600 hover:bg-blue-500 transition px-5 py-2 rounded-xl shadow-md active:scale-95"
            >
              Generate Forecast
            </button>

            {forecastChart && (
              <div className="h-[300px] mt-3 bg-black/40 border border-white/10 rounded-xl p-3">
                <ResponsiveContainer>
                  <LineChart data={forecastChart}>
                    <CartesianGrid stroke="#444" strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#111", border: "none" }}
                    />
                    <Line
                      dataKey="value"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </Section>

          {/* CHAT */}
          <Section title="💬 Chat with your Data">
            <div className="bg-black/40 border border-white/10 rounded-xl p-4 flex flex-col h-[350px]">
              <div className="flex-1 overflow-y-auto space-y-3">
                {chatHistory.map((m, i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-xl max-w-[70%] ${
                      m.role === "user"
                        ? "bg-blue-600 ml-auto"
                        : "bg-gray-800 text-green-300"
                    }`}
                  >
                    {m.text}
                  </div>
                ))}
                {chatLoading && (
                  <p className="text-gray-400 animate-pulse">
                    AI is thinking...
                  </p>
                )}
                <div ref={chatEndRef} />
              </div>

              <div className="flex mt-3 gap-2">
                <input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="flex-1 bg-black border border-white/10 p-2 rounded-xl"
                  placeholder="Ask about your data..."
                />
                <button
                  onClick={handleChat}
                  className="bg-green-600 px-4 rounded-xl"
                >
                  Send
                </button>
              </div>
            </div>
          </Section>

        </div>
      </div>
    </>
  );
}

// UI
function Stat({ title, value }: any) {
  return (
    <div className="p-6 rounded-2xl bg-gradient-to-br from-gray-900 to-black border border-white/10 shadow-xl hover:-translate-y-1 transition">
      <p className="text-gray-400 text-sm">{title}</p>
      <h2 className="text-3xl font-bold text-green-400">{value}</h2>
    </div>
  );
}

function Section({ title, children }: any) {
  return (
    <div className="space-y-4 p-5 rounded-2xl bg-white/5 backdrop-blur-lg border border-white/10 shadow-lg">
      <h2 className="text-xl font-semibold">{title}</h2>
      {children}
    </div>
  );
}
