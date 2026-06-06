#!/usr/bin/env node
// Regenerate project/players.json with live Transfermarkt data.
// Run: node scripts/fetch-players.js
// Requires Node 18+ (native fetch).

const fs = require("fs");
const path = require("path");

const TM_BASE = "https://transfermarkt-api.fly.dev";
const MILAN_ID = "5";
const OUT = path.join(__dirname, "../project/players.json");

const TOP_LEAGUES = [
  { id: "GB1",  name: "Premier League"      },
  { id: "ES1",  name: "La Liga"             },
  { id: "L1",   name: "Bundesliga"          },
  { id: "IT1",  name: "Serie A"             },
  { id: "FR1",  name: "Ligue 1"             },
  { id: "PO1",  name: "Primeira Liga"       },
  { id: "NL1",  name: "Eredivisie"          },
  { id: "TR1",  name: "Süper Lig"           },
  { id: "SA1",  name: "Saudi Pro League"    },
  { id: "BE1",  name: "Belgian Pro League"  },
  { id: "SC1",  name: "Scottish Prem"       },
  { id: "BRA1", name: "Brasileirão"         },
  { id: "ARPR", name: "Argentine Primera"   },
  { id: "MLS1", name: "MLS"                 },
  { id: "MEXA", name: "Liga MX"             },
  { id: "A1",   name: "Austrian Bundesliga" },
  { id: "JAP1", name: "J1 League"           },
  { id: "GR1",  name: "Super League Greece" },
  { id: "UKR1", name: "Ukrainian Premier"   },
  { id: "KOR1", name: "K League 1"          },
];

const TM_ROLES = {
  "Goalkeeper":         ["GK"],
  "Centre-Back":        ["CB", "LCB", "RCB"],
  "Left-Back":          ["LB", "LWB"],
  "Right-Back":         ["RB", "RWB"],
  "Left Wing-Back":     ["LWB", "LB"],
  "Right Wing-Back":    ["RWB", "RB"],
  "Defensive Midfield": ["DM", "LCM", "RCM"],
  "Central Midfield":   ["LCM", "RCM", "CM"],
  "Left Midfield":      ["LCM", "LW"],
  "Right Midfield":     ["RCM", "RW"],
  "Attacking Midfield": ["LAM", "RAM"],
  "Left Winger":        ["LW", "LAM"],
  "Right Winger":       ["RW", "RAM"],
  "Centre-Forward":     ["ST"],
  "Second Striker":     ["ST", "LAM", "RAM"],
};

const POS_GROUP = {
  "Goalkeeper": "GK",
  "Centre-Back": "DF", "Left-Back": "DF", "Right-Back": "DF",
  "Left Wing-Back": "DF", "Right Wing-Back": "DF",
  "Defensive Midfield": "MF", "Central Midfield": "MF",
  "Left Midfield": "MF", "Right Midfield": "MF", "Attacking Midfield": "MF",
  "Left Winger": "FW", "Right Winger": "FW",
  "Centre-Forward": "FW", "Second Striker": "FW",
};

const NAT_CODE = {
  "France": "FRA", "Italy": "ITA", "Germany": "GER", "Spain": "ESP",
  "England": "ENG", "Portugal": "POR", "Brazil": "BRA", "Argentina": "ARG",
  "Netherlands": "NED", "Belgium": "BEL", "Croatia": "CRO", "Serbia": "SRB",
  "Poland": "POL", "Denmark": "DEN", "Sweden": "SWE", "Norway": "NOR",
  "Switzerland": "SUI", "Austria": "AUT", "Morocco": "MAR", "Senegal": "SEN",
  "Nigeria": "NGA", "Ghana": "GHA", "Ivory Coast": "CIV", "Cameroon": "CMR",
  "Algeria": "ALG", "Egypt": "EGY", "Tunisia": "TUN", "Mali": "MLI",
  "Guinea": "GUI", "South Korea": "KOR", "Japan": "JPN", "Australia": "AUS",
  "United States": "USA", "Mexico": "MEX", "Colombia": "COL", "Ecuador": "ECU",
  "Uruguay": "URU", "Chile": "CHI", "Peru": "PER", "Venezuela": "VEN",
  "Turkey": "TUR", "Ukraine": "UKR", "Slovakia": "SVK", "Czech Republic": "CZE",
  "Hungary": "HUN", "Romania": "ROU", "Greece": "GRE", "Scotland": "SCO",
  "Wales": "WAL", "Ireland": "IRL", "Jamaica": "JAM", "Canada": "CAN",
  "Gabon": "GAB", "Guinea-Bissau": "GNB", "Cape Verde": "CPV", "DR Congo": "COD",
  "Côte d'Ivoire": "CIV", "United States of America": "USA",
  "Bosnia-Herzegovina": "BIH", "North Macedonia": "MKD", "Albania": "ALB",
  "Kosovo": "XKX", "Georgia": "GEO", "Azerbaijan": "AZE", "Finland": "FIN",
  "Iceland": "ISL", "Cyprus": "CYP", "Israel": "ISR", "Saudi Arabia": "KSA",
  "Iran": "IRN", "Burkina Faso": "BFA", "South Africa": "RSA", "Angola": "ANG",
  "Mozambique": "MOZ", "Zimbabwe": "ZIM", "New Zealand": "NZL",
  "China PR": "CHN", "Thailand": "THA", "Vietnam": "VIE", "Russia": "RUS",
  "Paraguay": "PAR", "Bolivia": "BOL", "Honduras": "HON", "Costa Rica": "CRC",
  "Panama": "PAN", "Dominican Republic": "DOM", "Haiti": "HAI",
  "Congo": "CGO", "Togo": "TOG", "Benin": "BEN",
  "Libya": "LBA", "Sudan": "SDN", "Ethiopia": "ETH",
};

function parseTMValue(v) {
  if (!v || v === "-" || v === "€-") return 0;
  const s = String(v).replace(/,/g, ".");
  const m = s.match(/([\d.]+)\s*(bn|bil|m|k)/i);
  if (!m) return 0;
  const n = parseFloat(m[1]);
  const unit = m[2].toLowerCase();
  if (unit === "bn" || unit === "bil") return Math.round(n * 1000);
  if (unit === "m") return Math.round(n * 10) / 10;
  if (unit === "k") return Math.round(n / 100) / 10;
  return 0;
}

function parseAge(p) {
  if (p.age != null) return parseInt(p.age) || 0;
  if (p.dateOfBirth) {
    const y = new Date(p.dateOfBirth).getFullYear();
    return new Date().getFullYear() - y;
  }
  return 0;
}

function parseNat(p) {
  const nat = p.nationality;
  if (!nat) return "---";
  const name = Array.isArray(nat) ? (nat[0]?.name || nat[0] || "") : (nat?.name || String(nat) || "");
  return NAT_CODE[String(name)] || String(name).slice(0, 3).toUpperCase();
}

function shortName(full) {
  if (!full) return "Unknown";
  const parts = full.trim().split(/\s+/);
  return parts[parts.length - 1];
}

function mapPlayer(p, from) {
  const pos = String(p.position?.main || p.position || "");
  return {
    id: "tm:" + p.id,
    name: p.name || "Unknown",
    short: shortName(p.name),
    num: parseInt(p.shirtNumber) || 0,
    nat: parseNat(p),
    age: parseAge(p),
    pos: POS_GROUP[pos] || "MF",
    roles: TM_ROLES[pos] || ["LCM", "RCM"],
    value: parseTMValue(p.marketValue),
    votes: 0,
    from,
    tags: [],
  };
}

async function tmFetch(urlPath, retries = 2) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(`${TM_BASE}${urlPath}`, {
        headers: { "User-Agent": "TransferDreams/1.0 (fan app)" },
        signal: AbortSignal.timeout(15000),
      });
      if (res.ok) return await res.json();
      if (res.status === 429 && attempt < retries) {
        await sleep(2000 * (attempt + 1));
        continue;
      }
      return null;
    } catch {
      if (attempt < retries) await sleep(1000);
    }
  }
  return null;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function batch(items, fn, size, delayMs = 400) {
  const results = [];
  for (let i = 0; i < items.length; i += size) {
    const chunk = items.slice(i, i + size);
    const chunkResults = await Promise.all(chunk.map(fn));
    results.push(...chunkResults);
    if (i + size < items.length) await sleep(delayMs);
    process.stdout.write(`\r  ${Math.min(i + size, items.length)}/${items.length}`);
  }
  process.stdout.write("\n");
  return results;
}

async function fetchLeagueClubs(leagueId) {
  const data = await tmFetch(`/competitions/${leagueId}/clubs`);
  if (!data || !Array.isArray(data.clubs)) return [];
  return data.clubs.map(c => ({ id: c.id, name: c.name }));
}

async function fetchClubPlayers(clubId, clubName) {
  const data = await tmFetch(`/clubs/${clubId}/players`);
  if (!data) return [];
  return (data.players || []).map(p => mapPlayer(p, clubName));
}

async function main() {
  console.log("Phase 1: fetching league club lists…");
  const leagueClubLists = await batch(
    TOP_LEAGUES,
    l => fetchLeagueClubs(l.id).then(clubs => ({ league: l.name, clubs })),
    5, 300
  );

  const clubMap = new Map();
  for (const { league, clubs } of leagueClubLists) {
    for (const c of clubs) {
      if (c.id && c.id !== MILAN_ID && !clubMap.has(c.id)) {
        clubMap.set(c.id, { id: c.id, name: c.name, league });
      }
    }
  }

  const allClubs = [...clubMap.values()];
  console.log(`Found ${allClubs.length} clubs across ${TOP_LEAGUES.length} leagues.`);
  console.log("Phase 2: fetching club squads…");

  const [milanData, ...marketGroups] = await Promise.all([
    tmFetch(`/clubs/${MILAN_ID}/players`),
    ...await (async () => {
      // Batch club squad fetches to avoid rate limiting
      const groups = [];
      for (let i = 0; i < allClubs.length; i += 25) {
        const chunk = allClubs.slice(i, i + 25);
        const results = await Promise.all(
          chunk.map(c => fetchClubPlayers(c.id, `${c.name} · ${c.league}`))
        );
        groups.push(...results);
        if (i + 25 < allClubs.length) await sleep(500);
        process.stdout.write(`\r  ${Math.min(i + 25, allClubs.length)}/${allClubs.length}`);
      }
      process.stdout.write("\n");
      return groups;
    })(),
  ]);

  const milanPlayers = (milanData?.players || []).map(p => mapPlayer(p, "AC Milan"));
  const milanNames = new Set(milanPlayers.map(p => p.name.toLowerCase()));

  const marketMap = new Map();
  for (const group of marketGroups) {
    for (const p of group) {
      if (milanNames.has(p.name.toLowerCase())) continue;
      if (p.value < 3) continue;
      if (!marketMap.has(p.id)) marketMap.set(p.id, p);
    }
  }

  const market = [...marketMap.values()].sort((a, b) => b.value - a.value);
  const result = {
    generated: new Date().toISOString(),
    squad: milanPlayers,
    market,
    clubs: allClubs.length,
  };

  fs.writeFileSync(OUT, JSON.stringify(result));
  console.log(`\nDone! ${market.length} market players · ${milanPlayers.length} Milan squad`);
  console.log(`Written to: ${OUT}`);
}

main().catch(err => { console.error(err); process.exit(1); });
