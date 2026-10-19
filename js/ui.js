document.addEventListener("DOMContentLoaded", async () => {
  const C = window.UFL_CONFIG;
  const D = window.UFL_DATA;

  function esc(s) {
    if (s === null || s === undefined) return "";
    return String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  }

  function findKey(row, candidates) {
    for (const k of Object.keys(row)) {
      const norm = k.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
      for (const c of candidates) {
        if (norm.includes(c)) return k;
      }
    }
    return null;
  }

  function normalizeRow(row) {
    return {
      equipo: row[findKey(row, ["equipo", "team", "club"])] || "",
      pj: D.toNum(row[findKey(row, ["pj", "jugados", "partidos"])]),
      pg: D.toNum(row[findKey(row, ["pg", "ganados", "victorias"])]),
      pe: D.toNum(row[findKey(row, ["pe", "empatados", "empates"])]),
      pp: D.toNum(row[findKey(row, ["pp", "perdidos", "derrotas"])]),
      gf: D.toNum(row[findKey(row, ["gf", "favor", "golesfavor"])]),
      gc: D.toNum(row[findKey(row, ["gc", "contra", "golescontra"])]),
      pts: D.toNum(row[findKey(row, ["pts", "puntos", "puntos"])])
    };
  }

  async function renderStandings() {
    const el = document.getElementById("standings");
    try {
      const rows = await D.fetchSheet(C.currentSheetId, "1_Liga_T3");
      const norm = rows.map(normalizeRow).filter(r => r.equipo);
      norm.sort((a, b) => b.pts - a.pts || (b.gf - b.gc) - (a.gf - a.gc) || b.gf - a.gf);

      let html = `<table><thead><tr><th>#</th><th>Equipo</th><th>PJ</th><th>PG</th><th>PE</th><th>PP</th><th>GF</th><th>GC</th><th>DIF</th><th>PTS</th></tr></thead><tbody>`;
      norm.forEach((r, i) => {
        const pos = i + 1;
        const cls = pos <= 12 ? "zone-ucl" : pos <= 24 ? "zone-uel" : "";
        html += `<tr class="${cls}"><td>${pos}</td><td>${esc(r.equipo)}</td><td>${r.pj}</td><td>${r.pg}</td><td>${r.pe}</td><td>${r.pp}</td><td>${r.gf}</td><td>${r.gc}</td><td>${r.gf - r.gc}</td><td><strong>${r.pts}</strong></td></tr>`;
      });
      html += `</tbody></table>`;
      el.innerHTML = html;
    } catch (e) {
      el.innerHTML = `<p style="color:#e74c3c;">Error al cargar Liga T3: ${esc(e.message)}</p>`;
    }
  }

  async function setupMarket() {
    const input = document.getElementById("market-search");
    const results = document.getElementById("market-results");
    let data = [];
    try {
      data = await D.fetchSheet(C.currentSheetId, "11_Mercado_Fichajes");
    } catch (e) {
      results.innerHTML = `<p style="color:#e74c3c;">Mercado no disponible: ${esc(e.message)}</p>`;
      return;
    }

    function filter(q) {
      const term = q.toLowerCase();
      const filtered = data.filter(row => {
        const jugador = String(row[findKey(row, ["jugador", "player", "nombre"])] || "").toLowerCase();
        return jugador.includes(term);
      });
      if (filtered.length === 0) { results.innerHTML = "<p>Sin resultados.</p>"; return; }
      results.innerHTML = filtered.slice(0, 20).map(row => {
        const jugador = row[findKey(row, ["jugador", "player"])] || "—";
        const equipo = row[findKey(row, ["equipo", "team", "asignado"])] || "—";
        const precio = row[findKey(row, ["precio", "price", "valor", "presupuesto"])] || "—";
        const ocupada = row[findKey(row, ["ocupada", "estado", "status", "vendido"])] || "";
        const isOccupied = /ocupad|vendid|s[ií]|true/i.test(String(ocupada));
        return `<div class="market-card"><strong>${esc(jugador)}</strong> — ${esc(equipo)}<br>Precio: ${esc(precio)} · <span class="${isOccupied ? "occupied" : "free"}">${isOccupied ? "Ocupada" : "Disponible"}</span></div>`;
      }).join("");
    }

    input.addEventListener("input", e => filter(e.target.value));
    filter("");
  }

  async function renderInternational() {
    const el = document.getElementById("international");
    const tryRender = async (sheetName, label) => {
      try {
        const rows = await D.fetchSheet(C.currentSheetId, sheetName);
        if (rows.length === 0) return `<p>${label}: sin datos.</p>`;
        return `<h3>${label}</h3><p>${rows.length} filas cargadas.</p>`;
      } catch (e) { return `<p>${label}: no disponible.</p>`; }
    };
    el.innerHTML = await tryRender("2_UCL_T3", "UCL") + await tryRender("3_UEL_T3", "UEL");
  }

  async function renderCopa() {
    const el = document.getElementById("copa");
    try {
      const rows = await D.fetchSheet(C.currentSheetId, "4_Copa_Nacional");
      el.innerHTML = rows.length ? `<p>${rows.length} filas cargadas de Copa Nacional.</p>` : "<p>Sin datos.</p>";
    } catch (e) { el.innerHTML = `<p style="color:#e74c3c;">Copa no disponible: ${esc(e.message)}</p>`; }
  }

  async function renderHistory() {
    const el = document.getElementById("history");
    const tabs = ["1_Palmares", "2_Managers", "3_Jugadores"];
    let html = "";
    for (const t of tabs) {
      try {
        const rows = await D.fetchSheet(C.historicalSheetId, t);
        html += `<h3>${esc(t)}</h3><p>${rows.length} registros.</p>`;
      } catch (e) { html += `<p>${esc(t)}: no disponible.</p>`; }
    }
    el.innerHTML = html;
  }

  // Arranque
  await renderStandings();
  await setupMarket();
  await renderInternational();
  await renderCopa();
  await renderHistory();
});