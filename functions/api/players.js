const TM_BASE = "https://transfermarkt-api.fly.dev";
const MILAN_ID = "5";
const CACHE_KEY = "tm:players:v1";
const CACHE_TTL = 60 * 60 * 24; // 24 hours

// Top European clubs to pull transfer targets from
const MARKET_CLUBS = [
  { id: "46",  name: "Inter Milan" },
  { id: "506", name: "Juventus" },
  { id: "6",   name: "Napoli" },
  { id: "12",  name: "Roma" },
  { id: "281", name: "Man City" },
  { id: "11",  name: "Arsenal" },
  { id: "31",  name: "Liverpool" },
  { id: "583", name: "PSG" },
  { id: "27",  name: "Bayern Munich" },
  { id: "15",  name: "Leverkusen" },
  { id: "418", name: "Real Madrid" },
  { id: "131", name: "Barcelona" },
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
  "Iceland": "ISL", "Cyprus": "CYP", "Malta": "MLT", "Luxembourg": "LUX",
  "Israel": "ISR", "Saudi Arabia": "KSA", "Iran": "IRN", "Burkina Faso": "BFA",
  "Mozambique": "MOZ", "Zimbabwe": "ZIM", "Tanzania": "TAN", "Uganda": "UGA",
  "South Africa": "RSA", "Kenya": "KEN", "Zambia": "ZAM", "Angola": "ANG",
  "New Zealand": "NZL", "China PR": "CHN", "Thailand": "THA", "Vietnam": "VIE",
  "Russia": "RUS",
};

function parseTMValue(v) {
  if (!v || v === "-" || v === "€-") return 0;
  const s = String(v).replace(/,/g, ".");
  const m = s.match(/([\d.]+)\s*(bn|m|k)/i);
  if (!m) return 0;
  const n = parseFloat(m[1]);
  const unit = m[2].toLowerCase();
  if (unit === "bn") return Math.round(n * 1000);
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
  const name = Array.isArray(nat) ? (nat[0]?.name || nat[0] || "") : (nat?.name || nat || "");
  return NAT_CODE[String(name)] || String(name).slice(0, 3).toUpperCase();
}

function shortName(full) {
  if (!full) return "Unknown";
  const parts = full.trim().split(/\s+/);
  // Use last word unless it's a suffix
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

async function fetchClub(id, from) {
  try {
    const res = await fetch(`${TM_BASE}/clubs/${id}/players`, {
      headers: { "User-Agent": "TransferDreams/1.0 (fan app)" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.players || []).map(p => mapPlayer(p, from));
  } catch {
    return [];
  }
}

export async function onRequestGet({ env }) {
  // Serve from cache if fresh
  const cached = await env.VOTES.get(CACHE_KEY);
  if (cached) {
    return Response.json(JSON.parse(cached), {
      headers: { "Cache-Control": "public, max-age=3600" },
    });
  }

  // Parallel fetch: Milan squad + all market clubs
  const [milanPlayers, ...marketGroups] = await Promise.all([
    fetchClub(MILAN_ID, "AC Milan"),
    ...MARKET_CLUBS.map(c => fetchClub(c.id, c.name)),
  ]);

  // Build set of Milan player names to exclude from market
  const milanNames = new Set(milanPlayers.map(p => p.name.toLowerCase()));

  // Deduplicate market pool by TM id, exclude Milan players, require value ≥ 3M
  const marketMap = new Map();
  for (const group of marketGroups) {
    for (const p of group) {
      if (milanNames.has(p.name.toLowerCase())) continue;
      if (p.value < 3) continue;
      if (!marketMap.has(p.id)) marketMap.set(p.id, p);
    }
  }

  const market = [...marketMap.values()].sort((a, b) => b.value - a.value);

  const result = { squad: milanPlayers, market };
  await env.VOTES.put(CACHE_KEY, JSON.stringify(result), { expirationTtl: CACHE_TTL });

  return Response.json(result, {
    headers: { "Cache-Control": "public, max-age=3600" },
  });
}
