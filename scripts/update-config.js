const https = require("https");
const fs = require("fs");
const path = require("path");

const CURRENT = process.env.CURRENT_SHEET_ID || "1PBjIHUdzUI0OgtVzLLFn1VF8AMAPR-om";
const HISTORICAL = process.env.HISTORICAL_SHEET_ID || "16GISCDk2X1i0_ytbfbp3uTuCjWrvGbiX";
const EXCLUDE = ["LEEME"];

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      let data = "";
      res.on("data", c => data += c);
      res.on("end", () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error("JSON inválido: " + data.slice(0, 200))); }
      });
    }).on("error", reject);
  });
}

async function getTabs(id) {
  try {
    const url = `https://spreadsheets.google.com/feeds/worksheets/${id}/public/full?alt=json`;
    const json = await fetchJson(url);
    const entries = json.feed?.entry || [];
    const tabs = entries.map(e => e.title.$t).filter(t => !EXCLUDE.includes(t));
    console.log(`[${id}] Tabs detectadas:`, tabs.join(", "));
    return tabs;
  } catch (e) {
    console.warn(`[${id}] Fallo feed worksheets: ${e.message}. Usando fallback.`);
    return null;
  }
}

(async () => {
  const currentTabs = await getTabs(CURRENT) || [
    "1_Liga_T3","2_UCL_T3","3_UEL_T3","4_Copa_Nacional","5_Lideres_T3",
    "7_Auditoria_Disciplina","9_Momentum_Forma","10_Entrenamientos","11_Mercado_Fichajes"
  ];
  const historicalTabs = await getTabs(HISTORICAL) || [
    "1_Palmares","2_Managers","3_Jugadores","4_Liga_T1","4_Liga_T2","5_Champions","6_Copa","7_Mercado"
  ];

  const config = `window.UFL_CONFIG = {
  currentSheetId: "${CURRENT}",
  historicalSheetId: "${HISTORICAL}",
  excludeTabs: ${JSON.stringify(EXCLUDE)},
  currentTabs: ${JSON.stringify(currentTabs, null, 2)},
  historicalTabs: ${JSON.stringify(historicalTabs, null, 2)},
  cacheTTL: 120000
};
`;
  const outPath = path.join(__dirname, "..", "js", "config.js");
  fs.writeFileSync(outPath, config);
  console.log("Escrito:", outPath);
  process.exit(0);
})();