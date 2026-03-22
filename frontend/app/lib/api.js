const BASE_URL = "http://127.0.0.1:8000/api";

/* -----------------------------
   COMMON FETCH HANDLER (UPGRADED 🔥)
----------------------------- */
const handleResponse = async (res) => {
  let data;

  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    const errorMessage =
      data?.detail ||
      data?.message ||
      JSON.stringify(data) ||
      "API Error";

    throw new Error(errorMessage);
  }

  return data;
};

/* -----------------------------
   FETCH WITH TIMEOUT (NEW 🔥)
----------------------------- */
const fetchWithTimeout = async (url, options = {}, timeout = 15000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return res;
  } finally {
    clearTimeout(id);
  }
};

/* -----------------------------
   UPLOAD CSV
----------------------------- */
export const uploadFile = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetchWithTimeout(`${BASE_URL}/upload/`, {
    method: "POST",
    body: formData,
  });

  return handleResponse(res);
};

/* -----------------------------
   LOAD COLUMNS
----------------------------- */
export const getColumns = async () => {
  const res = await fetchWithTimeout(`${BASE_URL}/columns/`);
  return handleResponse(res);
};

/* -----------------------------
   TRAIN MODEL
----------------------------- */
export const trainModel = async () => {
  const res = await fetchWithTimeout(`${BASE_URL}/train/`, {
    method: "POST",
  });

  return handleResponse(res);
};

/* -----------------------------
   PREDICT
----------------------------- */
export const predict = async (data) => {
  const res = await fetchWithTimeout(`${BASE_URL}/predict/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ data }),
  });

  return handleResponse(res);
};

/* -----------------------------
   VISUALIZE
----------------------------- */
export const getVisualization = async () => {
  const res = await fetchWithTimeout(`${BASE_URL}/visualize/`);
  return handleResponse(res);
};

/* -----------------------------
   FORECAST
----------------------------- */
export const forecast = async (data, years_ahead) => {
  const res = await fetchWithTimeout(`${BASE_URL}/forecast/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ data, years_ahead }),
  });

  return handleResponse(res);
};

/* -----------------------------
   🤖 AI INSIGHTS (NEW 🔥🔥🔥)
----------------------------- */
export const getAIInsights = async () => {
  const res = await fetchWithTimeout(`${BASE_URL}/ai-insights/`);
  return handleResponse(res);
};