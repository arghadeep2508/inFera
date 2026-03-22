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
  const API = "http://127.0.0.1:8000/api";

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [columns, setColumns] = useState<string[]>([]);
  const [target, setTarget] = useState<string>("");

  const [inputData, setInputData] = useState<any>({});

  const [prediction, setPrediction] = useState<any>(null);
  const [forecast, setForecast] = useState<any>(null);

  const [aiInsights, setAIInsights] = useState<string>("");
  const [aiLoading, setAILoading] = useState(true);

  const [previewLimit, setPreviewLimit] = useState(20);

  // 🔥 CHAT STATE (UPGRADED)
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState<any[]>([]);
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

        const obj: any = {};
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

  // 🔥 AUTO SCROLL CHAT
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
  // 🔥 CHAT FUNCTION (UPGRADED)
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

        {/* STATS */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card title="Rows" value={rows} />
          <Card title="Columns" value={cols} />
          <Card title="Numeric Columns" value={numeric.length} />
        </div>

        {/* PREVIEW CONTROL */}
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

        {/* DATA PREVIEW */}
        <Section title={`📄 Data Preview (${data.preview_count} rows)`}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-gray-700">
              <thead className="bg-gray-800">
                <tr>
                  {data?.preview?.[0] &&
                    Object.keys(data.preview[0]).map((col: string) => (
                      <th key={col} className="p-2 border">
                        {col}
                      </th>
                    ))}
                </tr>
              </thead>

              <tbody>
                {data?.preview?.map((row: any, idx: number) => (
                  <tr key={idx} className="hover:bg-gray-900">
                    {Object.values(row).map((val: any, i: number) => (
                      <td key={i} className="p-2 border">
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
          {aiLoading ? (
            <p>Generating insights...</p>
          ) : (
            <pre className="whitespace-pre-wrap text-sm text-green-400">
              {aiInsights}
            </pre>
          )}
        </Section>

        {/* 🔥 PROFESSIONAL CHAT */}
        <Section title="💬 Chat with your Data">
          <div className="bg-black/30 border rounded-xl p-4 h-[350px] flex flex-col">

            {/* CHAT MESSAGES */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-2">
              {chatHistory.map((msg, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-xl max-w-[80%] text-sm ${
                    msg.role === "user"
                      ? "ml-auto bg-blue-600/80 text-white"
                      : "bg-gray-800 text-green-300"
                  }`}
                >
                  {msg.text}
                </div>
              ))}

              {chatLoading && (
                <div className="text-gray-400 text-sm">AI is thinking...</div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* INPUT */}
            <div className="flex gap-2 mt-3">
              <input
                type="text"
                placeholder="Ask anything about your data..."
                className="flex-1 bg-black border rounded px-3 py-2 text-sm"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleChat()}
              />

              <button
                onClick={handleChat}
                className="bg-green-600 px-4 rounded text-sm hover:bg-green-700"
              >
                Send
              </button>
            </div>
          </div>
        </Section>

        {/* SUMMARY */}
        <Section title="📈 Summary">
          <div className="grid md:grid-cols-3 gap-4">
            {Object.entries(data.summary || {}).map(([col, stats]: any) => (
              <div key={col} className="p-4 bg-gray-900 rounded-xl">
                <h3 className="font-bold mb-2">{col}</h3>

                {stats.mean !== undefined ? (
                  <div className="text-sm space-y-1">
                    <p>Mean: {stats.mean?.toFixed(2)}</p>
                    <p>Min: {stats.min}</p>
                    <p>Max: {stats.max}</p>
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm">
                    Categorical feature
                  </p>
                )}
              </div>
            ))}
          </div>
        </Section>

        {/* CHART */}
        <Section title="📊 Feature Overview">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={summaryChartData}>
                <CartesianGrid stroke="#444" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line dataKey="value" stroke="#00ffcc" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Section>

        {/* PREDICTION */}
        <Section title="🔮 Prediction">
          <div className="grid md:grid-cols-3 gap-3">
            {Object.keys(inputData).map((col) => (
              <input
                key={col}
                placeholder={col}
                className="input"
                value={inputData[col] || ""}
                onChange={(e) => handleChange(col, e.target.value)}
              />
            ))}
          </div>

          <div className="flex gap-3 mt-4">
            <button onClick={handlePredict} className="btn-green">
              Predict
            </button>

            <button onClick={handleForecast} className="btn-blue">
              Forecast
            </button>
          </div>

          {prediction && (
            <div className="mt-4 text-green-400">
              Result: {JSON.stringify(prediction)}
            </div>
          )}

          {forecastChart && (
            <div className="mt-6 h-80 bg-black/40 p-4 rounded-xl border">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={forecastChart}>
                  <CartesianGrid stroke="#444" />
                  <XAxis dataKey="year" />
                  <YAxis />
                  <Tooltip />
                  <Line dataKey="value" stroke="#00ffcc" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </Section>
      </div>
    </>
  );
}

// UI COMPONENTS

function Card({ title, value }: any) {
  return (
    <div className="p-6 bg-black/40 border rounded-xl">
      <h3 className="text-gray-400">{title}</h3>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
}

function Section({ title, children }: any) {
  return (
    <div className="p-6 bg-black/40 border rounded-xl">
      <h2 className="text-lg font-semibold mb-3">{title}</h2>
      {children}
    </div>
  );
}