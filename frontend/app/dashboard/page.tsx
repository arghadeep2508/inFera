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
        <div className="p-10 text-white text-center">Loading...</div>
      </>
    );

  // ---------------- UI ----------------
  return (
    <>
      <Navbar />

      <div className="max-w-7xl mx-auto p-8 space-y-10 text-white">

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
              className="bg-black border px-3 py-1"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>

          <div className="overflow-x-auto border rounded-xl">
            <table className="w-full text-sm">
              <thead className="bg-gray-900">
                <tr>
                  {data?.preview?.[0] &&
                    Object.keys(data.preview[0]).map((c: string) => (
                      <th key={c} className="p-2">{c}</th>
                    ))}
                </tr>
              </thead>
              <tbody>
                {data?.preview?.map((row: any, i: number) => (
                  <tr key={i}>
                    {Object.values(row).map((v: any, j: number) => (
                      <td key={j} className="p-2">{String(v)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        {/* AI */}
        <Section title="🤖 AI Insights">
          <pre className="text-green-400 whitespace-pre-wrap">
            {aiInsights}
          </pre>
        </Section>

        {/* CHART */}
        <Section title="📊 Data Overview">
          <div className="h-[300px]">
            <ResponsiveContainer>
              <LineChart data={summaryChartData}>
                <CartesianGrid stroke="#333" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line dataKey="value" stroke="#22c55e" />
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
                className="bg-black border p-2"
                value={inputData[c]}
                onChange={(e) =>
                  setInputData({ ...inputData, [c]: e.target.value })
                }
              />
            ))}
          </div>

          <button
            onClick={handlePredict}
            className="mt-3 bg-green-600 px-4 py-2"
          >
            Predict
          </button>

          {prediction && (
            <p className="mt-2 text-green-400">
              Result: {JSON.stringify(prediction)}
            </p>
          )}
        </Section>

        {/* FORECAST */}
        <Section title="📈 Forecast">
          <button
            onClick={handleForecast}
            className="bg-blue-600 px-4 py-2"
          >
            Generate Forecast
          </button>

          {forecastChart && (
            <div className="h-[300px] mt-3">
              <ResponsiveContainer>
                <LineChart data={forecastChart}>
                  <CartesianGrid stroke="#333" />
                  <XAxis dataKey="year" />
                  <YAxis />
                  <Tooltip />
                  <Line dataKey="value" stroke="#3b82f6" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </Section>

        {/* CHAT */}
        <Section title="💬 Chat">
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {chatHistory.map((m, i) => (
              <div key={i}>{m.text}</div>
            ))}
            <div ref={chatEndRef} />
          </div>

          <div className="flex mt-2">
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              className="flex-1 bg-black border p-2"
            />
            <button onClick={handleChat} className="bg-green-600 px-4">
              Send
            </button>
          </div>
        </Section>

      </div>
    </>
  );
}

// UI
function Stat({ title, value }: any) {
  return (
    <div className="p-5 border rounded-xl">
      <p>{title}</p>
      <h2>{value}</h2>
    </div>
  );
}

function Section({ title, children }: any) {
  return (
    <div>
      <h2 className="text-xl mb-2">{title}</h2>
      {children}
    </div>
  );
}
