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
  // ✅ FIXED: Use ENV instead of localhost
  const API = process.env.NEXT_PUBLIC_API_URL + "/api";

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

  // CHAT
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState<{ role: string; text: string }[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // -----------------------------
  // FETCH ALL DATA
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

  // AUTO SCROLL CHAT
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  // -----------------------------
  // INPUT
  // -----------------------------
  const handleChange = (col: string, value: string) => {
    setInputData({ ...inputData, [col]: value });
  };

  // -----------------------------
  // PREDICT
  // -----------------------------
  const handlePredict = async () => {
    try {
      const res = await fetch(`${API}/predict/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: inputData }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.detail);

      setPrediction(json);
    } catch (err: any) {
      alert(err.message);
    }
  };

  // -----------------------------
  // FORECAST
  // -----------------------------
  const handleForecast = async () => {
    try {
      const res = await fetch(`${API}/forecast/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: inputData,
          years_ahead: 5,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.detail);

      setForecast(json.forecast);
    } catch (err: any) {
      alert(err.message);
    }
  };

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
      if (!res.ok) throw new Error(json.detail);

      setChatHistory((prev) => [
        ...prev,
        { role: "ai", text: json.answer },
      ]);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setChatLoading(false);
    }
  };

  // -----------------------------
  // SAFE DATA
  // -----------------------------
  const rows = data?.rows ?? 0;
  const cols = data?.columns ?? 0;
  const numeric = data?.numeric_columns ?? [];

  const summaryChartData = (numeric || []).map((col: string) => ({
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
        <div className="p-10 text-center">⏳ Loading dashboard...</div>
      </>
    );
  }

  if (!data) {
    return (
      <>
        <Navbar />
        <div className="p-10 text-center">❌ No data found</div>
      </>
    );
  }

  // -----------------------------
  // UI
  // -----------------------------
  return (
    <>
      <Navbar />

      <div className="p-10 space-y-8 text-white">
        <h1 className="text-3xl font-bold">📊 Dashboard</h1>

        <div className="grid md:grid-cols-3 gap-6">
          <Card title="Rows" value={rows} />
          <Card title="Columns" value={cols} />
          <Card title="Numeric Columns" value={numeric.length} />
        </div>

        <div className="flex justify-end">
          <select
            value={previewLimit}
            onChange={(e) => setPreviewLimit(Number(e.target.value))}
            className="bg-black border p-2 rounded"
          >
            <option value={10}>10 rows</option>
            <option value={20}>20 rows</option>
            <option value={50}>50 rows</option>
          </select>
        </div>

        {/* DATA TABLE */}
        <div className="overflow-x-auto border rounded-xl">
          <table className="w-full text-sm">
            <thead className="bg-gray-800">
              <tr>
                {data?.preview?.[0] &&
                  Object.keys(data.preview[0]).map((col: string) => (
                    <th key={col} className="p-2 border">{col}</th>
                  ))}
              </tr>
            </thead>
            <tbody>
              {data?.preview?.map((row: any, idx: number) => (
                <tr key={idx}>
                  {Object.values(row).map((val: any, i: number) => (
                    <td key={i} className="p-2 border">{String(val)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* AI */}
        <div>
          <h2>🤖 AI Insights</h2>
          <pre className="text-green-400">{aiInsights}</pre>
        </div>

        {/* CHAT */}
        <div>
          <input
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Ask..."
            className="bg-black border px-3 py-2"
          />
          <button onClick={handleChat}>Send</button>
        </div>
      </div>
    </>
  );
}

// UI
function Card({ title, value }: { title: string; value: number }) {
  return (
    <div className="p-6 bg-black/40 border rounded-xl">
      <h3>{title}</h3>
      <p>{value}</p>
    </div>
  );
}
