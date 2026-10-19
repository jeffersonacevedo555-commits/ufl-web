(function() {
  const CACHE_PREFIX = "ufl_cache_";

  function toNum(v) {
    if (v === null || v === undefined || v === "") return 0;
    const n = Number(v);
    return isNaN(n) ? 0 : n;
  }

  function getCache(key) {
    try {
      const raw = localStorage.getItem(CACHE_PREFIX + key);
      if (!raw) return null;
      const { ts, data } = JSON.parse(raw);
      if (Date.now() - ts > window.UFL_CONFIG.cacheTTL) {
        localStorage.removeItem(CACHE_PREFIX + key);
        return null;
      }
      return data;
    } catch { return null; }
  }

  function setCache(key, data) {
    try {
      localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ ts: Date.now(), data }));
    } catch {}
  }

  function parseGvizResponse(text) {
    // gviz devuelve google.visualization.Query.setResponse({...});
    const match = text.match(/google\.visualization\.Query\.setResponse\(([\s\S]*)\);?\s*$/);
    if (!match) throw new Error("No se pudo extraer JSON del wrapper gviz");
    return JSON.parse(match[1]);
  }

  async function fetchSheet(sheetId, sheetName) {
    const cacheKey = sheetId + "_" + sheetName;
    const cached = getCache(cacheKey);
    if (cached) return cached;

    const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status} al leer ${sheetName}`);
    const text = await res.text();
    const json = parseGvizResponse(text);

    if (json.status === "error") {
      throw new Error(`Error de hoja ${sheetName}: ${JSON.stringify(json.errors)}`);
    }

    const cols = json.table.cols.map(c => c.label || c.id || "");
    const rows = json.table.rows.map(r =>
      r.c.map(cell => (cell && cell.v !== undefined && cell.v !== null) ? cell.v : "")
    );

    // Convertir a array de objetos con headers
    const result = rows.map(row => {
      const obj = {};
      cols.forEach((col, i) => { obj[col] = row[i] !== undefined ? row[i] : ""; });
      return obj;
    });

    setCache(cacheKey, result);
    return result;
  }

  async function fetchTabs(spreadsheetId) {
    // Intentar feed de worksheets (puede fallar por API obsoleta)
    try {
      const url = `https://spreadsheets.google.com/feeds/worksheets/${spreadsheetId}/public/full?alt=json`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const entries = json.feed?.entry || [];
      return entries.map(e => e.title.$t).filter(t => !window.UFL_CONFIG.excludeTabs.includes(t));
    } catch (e) {
      console.warn("Feed de worksheets no disponible, usando fallback:", e.message);
      return null;
    }
  }

  window.UFL_DATA = { fetchSheet, fetchTabs, toNum };
})();