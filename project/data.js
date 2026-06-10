/* ============================================================
   AC MILAN — TRANSFER DREAMS  ·  DATA
   Best-effort realistic data for the June 2026 window.
   Values in €M. Roles map players to formation pitch-slots.
   ============================================================ */
(function () {
  // ---- Formations -------------------------------------------------
  // slot = { id, role, x, y }   x,y in % of pitch (attack points UP, y=0 is the goal we attack)
  const FORMATIONS = {
    slot: {
      coach: "slot",
      name: "4-3-3",
      label: "Slot · 4-3-3",
      // back four, single pivot + two 8s, front three
      slots: [
        { id: "GK",  role: "GK",  x: 50, y: 92 },
        { id: "LB",  role: "LB",  x: 16, y: 72 },
        { id: "LCB", role: "LCB", x: 38, y: 78 },
        { id: "RCB", role: "RCB", x: 62, y: 78 },
        { id: "RB",  role: "RB",  x: 84, y: 72 },
        { id: "DM",  role: "DM",  x: 50, y: 58 },
        { id: "LCM", role: "LCM", x: 31, y: 44 },
        { id: "RCM", role: "RCM", x: 69, y: 44 },
        { id: "LW",  role: "LW",  x: 18, y: 22 },
        { id: "ST",  role: "ST",  x: 50, y: 14 },
        { id: "RW",  role: "RW",  x: 82, y: 22 },
      ],
      // priority order for greedy fill (spine first)
      order: ["GK", "DM", "LCB", "RCB", "LB", "RB", "LCM", "RCM", "ST", "LW", "RW"],
    },
    glasner: {
      coach: "glasner",
      name: "3-4-2-1",
      label: "Glasner · 3-4-2-1",
      slots: [
        { id: "GK",  role: "GK",  x: 50, y: 93 },
        { id: "LCB", role: "LCB", x: 28, y: 78 },
        { id: "CB",  role: "CB",  x: 50, y: 80 },
        { id: "RCB", role: "RCB", x: 72, y: 78 },
        { id: "LWB", role: "LWB", x: 12, y: 56 },
        { id: "LCM", role: "LCM", x: 38, y: 58 },
        { id: "RCM", role: "RCM", x: 62, y: 58 },
        { id: "RWB", role: "RWB", x: 88, y: 56 },
        { id: "LAM", role: "LAM", x: 33, y: 32 },
        { id: "RAM", role: "RAM", x: 67, y: 32 },
        { id: "ST",  role: "ST",  x: 50, y: 14 },
      ],
      order: ["GK", "CB", "LCB", "RCB", "LWB", "RWB", "LCM", "RCM", "ST", "LAM", "RAM"],
    },
    pochettino: {
      coach: "pochettino",
      name: "4-2-3-1",
      label: "Pochettino · 4-2-3-1",
      slots: [
        { id: "GK",  role: "GK",  x: 50, y: 92 },
        { id: "LB",  role: "LB",  x: 14, y: 74 },
        { id: "LCB", role: "LCB", x: 36, y: 80 },
        { id: "RCB", role: "RCB", x: 64, y: 80 },
        { id: "RB",  role: "RB",  x: 86, y: 74 },
        { id: "LDM", role: "DM",  x: 34, y: 60 },
        { id: "RDM", role: "DM",  x: 66, y: 60 },
        { id: "LW",  role: "LW",  x: 16, y: 33 },
        { id: "CAM", role: "LAM", x: 50, y: 30 },
        { id: "RW",  role: "RW",  x: 84, y: 33 },
        { id: "ST",  role: "ST",  x: 50, y: 13 },
      ],
      order: ["GK", "LCB", "RCB", "LB", "RB", "LDM", "RDM", "CAM", "LW", "RW", "ST"],
    },
    jaissle: {
      coach: "jaissle",
      name: "4-4-2",
      label: "Jaissle · 4-4-2",
      slots: [
        { id: "GK",  role: "GK",  x: 50, y: 92 },
        { id: "LB",  role: "LB",  x: 14, y: 74 },
        { id: "LCB", role: "LCB", x: 36, y: 80 },
        { id: "RCB", role: "RCB", x: 64, y: 80 },
        { id: "RB",  role: "RB",  x: 86, y: 74 },
        { id: "LM",  role: "LW",  x: 12, y: 52 },
        { id: "LCM", role: "LCM", x: 36, y: 57 },
        { id: "RCM", role: "RCM", x: 64, y: 57 },
        { id: "RM",  role: "RW",  x: 88, y: 52 },
        { id: "LST", role: "ST",  x: 36, y: 18 },
        { id: "RST", role: "ST",  x: 64, y: 18 },
      ],
      order: ["GK", "LCB", "RCB", "LB", "RB", "LCM", "RCM", "LM", "RM", "LST", "RST"],
    },
  };

  // ---- Coaches ----------------------------------------------------
  const COACHES = [
    {
      id: "slot",
      name: "Arne Slot",
      nat: "NED",
      from: "Liverpool",
      shape: "4-3-3",
      votes: 0,
      ruledOut: true,
      blurb: "Positional, high-pressing 4-3-3. Inverted full-backs, a lone pivot and two relentless No.8s. Wants Leão & Pulisic isolating fullbacks 1v1.",
      tags: ["Anfield exit talk", "Possession", "Gegen-light"],
    },
    {
      id: "glasner",
      name: "Oliver Glasner",
      nat: "AUT",
      from: "Crystal Palace",
      shape: "3-4-2-1",
      votes: 0,
      blurb: "Aggressive 3-4-2-1 with flying wing-backs and two free No.10s behind a target man. Had 'dinner with the Diavolo' — fans are buzzing.",
      tags: ["Dinner with Cardinale", "Wing-backs", "Transitions"],
    },
    {
      id: "pochettino",
      name: "Mauricio Pochettino",
      nat: "ARG",
      from: "Free agent",
      shape: "4-2-3-1",
      votes: 0,
      blurb: "Electric 4-2-3-1 with a double pivot that frees Leão and Pulisic to terrorise full-backs 1v1. A creative No.10 links the lines. Renowned for developing young talent and relentless pressing.",
      tags: ["High press", "4-2-3-1", "Youth dev"],
    },
    {
      id: "jaissle",
      name: "Matthias Jaissle",
      nat: "GER",
      from: "Al-Ahli",
      shape: "4-4-2",
      votes: 0,
      blurb: "Red Bull-school gegenpressing 4-4-2. Two strikers hunt in pairs and the pitch is compressed into zones. Hard-running wide midfielders instead of pure wingers — relentless from first minute.",
      tags: ["Gegenpress", "RB system", "Twin strikers"],
    },
  ];

  // ================================================================
  // SPORTING DIRECTOR  (the only real choice there ever was)
  // ================================================================
  const DIRECTORS = [
    { id: "maldini",   name: "Maldini",    nat: "ITA", from: "Milan legend",   role: "Sporting Director", votes: 0, blurb: "Bandiera. Won everything in red & black — the obvious choice." },
    { id: "paolo_m",   name: "Paolo M.",   nat: "ITA", from: "Milan legend",   role: "Sporting Director", votes: 0, blurb: "A visionary eye for talent. Built the 2022 Scudetto squad on a shoestring." },
    { id: "p_maldini", name: "P. Maldini", nat: "ITA", from: "Milan legend",   role: "Sporting Director", votes: 0, blurb: "Class on and off the pitch. The fans never wanted him to leave." },
  ];

  // ---- helper to make a player -----------------------------------
  let _id = 0;
  function P(o) {
    return Object.assign(
      { id: "p" + ++_id, votes: 0, tags: [] },
      o
    );
  }

  // ================================================================
  // CURRENT SQUAD  (sellable — selling frees cash)
  // ================================================================
  const SQUAD = [
    // -- Goalkeepers
    P({ name: "Mike Maignan", short: "Maignan", num: 16, nat: "FRA", age: 30, pos: "GK", roles: ["GK"], value: 28, votes: 8400, note: "Captain. Chelsea circling." }),
    P({ name: "Pietro Terracciano", short: "Terracciano", num: 1, nat: "ITA", age: 36, pos: "GK", roles: ["GK"], value: 1, votes: 420 }),
    P({ name: "Lorenzo Torriani", short: "Torriani", num: 96, nat: "ITA", age: 21, pos: "GK", roles: ["GK"], value: 3, votes: 360 }),
    // -- Defenders
    P({ name: "Fikayo Tomori", short: "Tomori", num: 23, nat: "ENG", age: 28, pos: "DF", roles: ["CB", "RCB", "LCB"], value: 24, votes: 6900 }),
    P({ name: "Strahinja Pavlović", short: "Pavlović", num: 31, nat: "SRB", age: 25, pos: "DF", roles: ["CB", "LCB", "RCB"], value: 26, votes: 7100, note: "Man Utd target." }),
    P({ name: "Matteo Gabbia", short: "Gabbia", num: 46, nat: "ITA", age: 26, pos: "DF", roles: ["CB", "RCB", "LCB"], value: 20, votes: 6200 }),
    P({ name: "Marco Pellegrino", short: "Pellegrino", num: 15, nat: "ARG", age: 24, pos: "DF", roles: ["CB", "LCB"], value: 4, votes: 480 }),
    P({ name: "Pervis Estupiñán", short: "Estupiñán", num: 2, nat: "ECU", age: 28, pos: "DF", roles: ["LB", "LWB"], value: 18, votes: 5200 }),
    P({ name: "Davide Bartesaghi", short: "Bartesaghi", num: 33, nat: "ITA", age: 20, pos: "DF", roles: ["LB", "LWB"], value: 9, votes: 5200, note: "Tight race with Estupiñán." }),
    P({ name: "Alexis Saelemaekers", short: "Saelemaekers", num: 56, nat: "BEL", age: 26, pos: "DF", roles: ["RB", "RWB", "RW"], value: 22, votes: 5400 }),
    P({ name: "Zachary Athekame", short: "Athekame", num: 24, nat: "SUI", age: 21, pos: "DF", roles: ["RB", "RWB"], value: 10, votes: 1900 }),
    P({ name: "Filippo Terracciano", short: "F. Terracciano", num: 42, nat: "ITA", age: 23, pos: "DF", roles: ["RB", "RWB", "RCB"], value: 6, votes: 700 }),
    P({ name: "Koni De Winter", short: "De Winter", num: 5, nat: "BEL", age: 23, pos: "DF", roles: ["CB", "RCB", "LCB", "RB"], value: 20, votes: 3800 }),
    // -- Midfielders
    P({ name: "Youssouf Fofana", short: "Fofana", num: 29, nat: "FRA", age: 27, pos: "MF", roles: ["DM", "LCM", "RCM", "CM"], value: 25, votes: 6600 }),
    P({ name: "Samuele Ricci", short: "Ricci", num: 4, nat: "ITA", age: 24, pos: "MF", roles: ["DM", "LCM", "RCM", "CM"], value: 28, votes: 3400, note: "Signed from Torino. The new regista." }),
    P({ name: "Ismaël Bennacer", short: "Bennacer", num: 6, nat: "ALG", age: 28, pos: "MF", roles: ["DM", "RCM", "LCM", "CM"], value: 2, votes: 4100, note: "Back from his Marseille loan." }),
    P({ name: "Ruben Loftus-Cheek", short: "Loftus-Cheek", num: 8, nat: "ENG", age: 30, pos: "MF", roles: ["RCM", "LCM", "CM", "DM"], value: 16, votes: 3600, note: "Injury-prone but a big-game body." }),
    P({ name: "Luka Modrić", short: "Modrić", num: 14, nat: "CRO", age: 40, pos: "MF", roles: ["LCM", "RCM", "CM"], value: 4, votes: 7800, note: "The maestro. Crowd favourite." }),
    P({ name: "Ardon Jashari", short: "Jashari", num: 19, nat: "SUI", age: 24, pos: "MF", roles: ["LCM", "RCM", "CM", "DM"], value: 28, votes: 5600 }),
    P({ name: "Adrien Rabiot", short: "Rabiot", num: 12, nat: "FRA", age: 31, pos: "MF", roles: ["LCM", "RCM", "CM"], value: 18, votes: 5600, note: "Future uncertain." }),
    P({ name: "Warren Bondo", short: "Bondo", num: 20, nat: "FRA", age: 22, pos: "MF", roles: ["DM", "RCM", "LCM", "CM"], value: 11, votes: 1600 }),
    P({ name: "Yunus Musah", short: "Musah", num: 80, nat: "USA", age: 23, pos: "MF", roles: ["RCM", "LCM", "CM", "RWB"], value: 18, votes: 2100 }),
    P({ name: "Kevin Zeroli", short: "Zeroli", num: 41, nat: "ITA", age: 21, pos: "MF", roles: ["RCM", "LCM", "CM"], value: 5, votes: 900 }),
    // -- Forwards
    P({ name: "Rafael Leão", short: "Leão", num: 10, nat: "POR", age: 27, pos: "FW", roles: ["LW", "LAM"], value: 50, votes: 7400, note: "€50M and Man Utd/Arsenal circling. Sell to fund the rebuild?" }),
    P({ name: "Christian Pulisic", short: "Pulisic", num: 11, nat: "USA", age: 28, pos: "FW", roles: ["RW", "RAM"], value: 52, votes: 7600 }),
    P({ name: "Santiago Giménez", short: "Giménez", num: 7, nat: "MEX", age: 25, pos: "FW", roles: ["ST"], value: 32, votes: 4200 }),
    P({ name: "Christopher Nkunku", short: "Nkunku", num: 18, nat: "FRA", age: 29, pos: "FW", roles: ["ST", "LAM", "RAM"], value: 36, votes: 4200, note: "Tight race with Giménez up top." }),
    P({ name: "Samuel Chukwueze", short: "Chukwueze", num: 21, nat: "NGA", age: 27, pos: "FW", roles: ["RW", "RAM"], value: 18, votes: 2400 }),
  ];

  // ================================================================
  // TRANSFER MARKET  (buyable, all ≤ €50M)
  // tags: "relegated" / "prospect" / "free" power the featured rails
  // ================================================================
  const MARKET = [
    // Strikers
    P({ name: "Dušan Vlahović", short: "Vlahović", num: 9, nat: "SRB", age: 26, pos: "FW", roles: ["ST"], value: 35, from: "Juventus", note: "Top of the front-office list." }),
    P({ name: "Moise Kean", short: "Kean", num: 18, nat: "ITA", age: 26, pos: "FW", roles: ["ST", "LAM"], value: 45, from: "Fiorentina" }),
    P({ name: "Alexander Sørloth", short: "Sørloth", num: 19, nat: "NOR", age: 30, pos: "FW", roles: ["ST"], value: 32, from: "Atlético Madrid" }),
    P({ name: "Joshua Zirkzee", short: "Zirkzee", num: 11, nat: "NED", age: 24, pos: "FW", roles: ["ST", "LAM"], value: 38, from: "Man Utd", note: "Floated in a Leão swap." }),
    P({ name: "Santiago Castro", short: "Castro", num: 9, nat: "ARG", age: 21, pos: "FW", roles: ["ST", "RAM"], value: 35, from: "Bologna", tags: ["prospect"] }),
    P({ name: "Lorenzo Lucca", short: "Lucca", num: 90, nat: "ITA", age: 25, pos: "FW", roles: ["ST"], value: 28, from: "Napoli" }),
    // Wingers / attacking mids
    P({ name: "Andreas Schjelderup", short: "Schjelderup", num: 30, nat: "NOR", age: 21, pos: "FW", roles: ["LW", "LAM", "RAM"], value: 30, from: "Benfica", tags: ["prospect"] }),
    P({ name: "Christian Kofane", short: "Kofane", num: 39, nat: "CMR", age: 19, pos: "FW", roles: ["ST", "LW"], value: 20, from: "Bayer Leverkusen", tags: ["prospect"] }),
    P({ name: "Carlos Espí", short: "Espí", num: 19, nat: "ESP", age: 20, pos: "FW", roles: ["ST", "RW"], value: 25, from: "Levante", tags: ["prospect"] }),
    P({ name: "Assane Diao", short: "Diao", num: 17, nat: "ESP", age: 20, pos: "FW", roles: ["RW", "LW", "RAM"], value: 26, from: "Como", tags: ["prospect"] }),
    P({ name: "Maghnes Akliouche", short: "Akliouche", num: 8, nat: "FRA", age: 24, pos: "FW", roles: ["RAM", "LAM", "RW"], value: 45, from: "Monaco" }),
    P({ name: "Eli Junior Kroupi", short: "Kroupi", num: 29, nat: "FRA", age: 19, pos: "FW", roles: ["ST", "LW"], value: 18, from: "Bournemouth", tags: ["prospect"] }),
    // Midfielders
    P({ name: "Manu Koné", short: "Koné", num: 17, nat: "FRA", age: 25, pos: "MF", roles: ["RCM", "LCM", "DM", "CM"], value: 45, from: "Roma" }),
    P({ name: "Morten Hjulmand", short: "Hjulmand", num: 42, nat: "DEN", age: 26, pos: "MF", roles: ["DM", "RCM", "LCM"], value: 45, from: "Sporting CP" }),
    P({ name: "Nicolò Rovella", short: "Rovella", num: 6, nat: "ITA", age: 24, pos: "MF", roles: ["DM", "RCM", "LCM"], value: 30, from: "Lazio" }),
    P({ name: "Frank Anguissa", short: "Anguissa", num: 99, nat: "CMR", age: 30, pos: "MF", roles: ["RCM", "LCM", "CM"], value: 22, from: "Napoli", note: "Longo: Napoli plotting a hijack." }),
    P({ name: "André", short: "André", num: 5, nat: "BRA", age: 24, pos: "MF", roles: ["DM", "RCM", "LCM"], value: 24, from: "Wolves" }),
    P({ name: "Hugo Larsson", short: "Larsson", num: 16, nat: "SWE", age: 21, pos: "MF", roles: ["RCM", "LCM", "CM"], value: 42, from: "Eintracht Frankfurt", tags: ["prospect"] }),
    // Defenders
    P({ name: "Radu Drăgușin", short: "Drăgușin", num: 6, nat: "ROU", age: 24, pos: "DF", roles: ["CB", "RCB", "LCB"], value: 25, from: "Tottenham" }),
    P({ name: "Ousmane Diomandé", short: "Diomandé", num: 3, nat: "CIV", age: 22, pos: "DF", roles: ["CB", "RCB", "LCB"], value: 45, from: "Sporting CP", tags: ["prospect"], note: "Milan's defensive priority. €80M release clause." }),
    P({ name: "David Affengruber", short: "Affengruber", num: 4, nat: "AUT", age: 25, pos: "DF", roles: ["CB", "RCB", "LCB"], value: 20, from: "Elche" }),
    P({ name: "Lorenzo Pirola", short: "Pirola", num: 29, nat: "ITA", age: 24, pos: "DF", roles: ["CB", "LCB"], value: 15, from: "Sassuolo" }),
    P({ name: "Gerard Martín", short: "G. Martín", num: 26, nat: "ESP", age: 23, pos: "DF", roles: ["LB", "LWB", "LCB"], value: 18, from: "Barcelona" }),
    P({ name: "Joe Gomez", short: "Gomez", num: 2, nat: "ENG", age: 28, pos: "DF", roles: ["CB", "RCB", "RB"], value: 18, from: "Liverpool" }),
    P({ name: "Nathan Aké", short: "Aké", num: 6, nat: "NED", age: 31, pos: "DF", roles: ["CB", "LCB", "LB"], value: 24, from: "Man City", note: "Versatile — high wages the hurdle." }),
    // Goalkeepers
    P({ name: "Elia Caprile", short: "Caprile", num: 25, nat: "ITA", age: 25, pos: "GK", roles: ["GK"], value: 15, from: "Cagliari", note: "If Maignan goes." }),
    P({ name: "Marco Carnesecchi", short: "Carnesecchi", num: 29, nat: "ITA", age: 26, pos: "GK", roles: ["GK"], value: 40, from: "Atalanta" }),
    // Free agents
    P({ name: "John Stones", short: "Stones", num: 5, nat: "ENG", age: 31, pos: "DF", roles: ["CB", "RCB", "RB"], value: 0, from: "Free agent", tags: ["free"], note: "Released by Man City." }),
    P({ name: "David Alaba", short: "Alaba", num: 4, nat: "AUT", age: 33, pos: "DF", roles: ["CB", "LCB", "LB"], value: 0, from: "Free agent", tags: ["free"], note: "Zahavi talks held." }),
  ];

  // ================================================================
  // RELEGATED BARGAINS  (top-flight talent dropping a division)
  // Serie A down: Verona, Pisa, Cremonese.  Plus EU strugglers.
  // ================================================================
  const RELEGATED = [
    P({ name: "Suat Serdar", short: "Serdar", num: 8, nat: "GER", age: 29, pos: "MF", roles: ["RCM", "LCM", "CM"], value: 6, from: "Hellas Verona ↓", tags: ["relegated"] }),
    P({ name: "Daniel Mosquera", short: "Mosquera", num: 9, nat: "COL", age: 26, pos: "FW", roles: ["ST", "LW"], value: 8, from: "Hellas Verona ↓", tags: ["relegated"] }),
    P({ name: "Matteo Tramoni", short: "Tramoni", num: 10, nat: "FRA", age: 26, pos: "FW", roles: ["RAM", "LAM", "RW"], value: 9, from: "Pisa ↓", tags: ["relegated"] }),
    P({ name: "Idrissa Touré", short: "Touré", num: 5, nat: "GUI", age: 27, pos: "DF", roles: ["RB", "RWB", "RCB"], value: 5, from: "Pisa ↓", tags: ["relegated"] }),
    P({ name: "Federico Bonazzoli", short: "Bonazzoli", num: 9, nat: "ITA", age: 29, pos: "FW", roles: ["ST", "LAM"], value: 6, from: "Cremonese ↓", tags: ["relegated"] }),
    P({ name: "Franco Vázquez", short: "Vázquez", num: 10, nat: "ARG", age: 37, pos: "MF", roles: ["RAM", "LAM", "RCM"], value: 1, from: "Cremonese ↓", tags: ["relegated"], note: "Veteran bargain." }),
    P({ name: "Antoine Leautey", short: "Leautey", num: 7, nat: "FRA", age: 28, pos: "FW", roles: ["RW", "LW", "RAM"], value: 4, from: "Cremonese ↓", tags: ["relegated"] }),
    P({ name: "Tijjani Noslin", short: "Noslin", num: 11, nat: "NED", age: 27, pos: "FW", roles: ["ST", "RW", "LW"], value: 7, from: "Hellas Verona ↓", tags: ["relegated"] }),
    // -- Premier League ↓ (West Ham, Wolves, Burnley)
    P({ name: "Lucas Paquetá", short: "Paquetá", num: 10, nat: "BRA", age: 28, pos: "MF", roles: ["RAM", "LAM", "RCM"], value: 38, from: "West Ham ↓", tags: ["relegated"], note: "Premier League quality going cheap." }),
    P({ name: "Jarrod Bowen", short: "Bowen", num: 20, nat: "ENG", age: 29, pos: "FW", roles: ["RW", "RAM", "ST"], value: 40, from: "West Ham ↓", tags: ["relegated"] }),
    P({ name: "Edson Álvarez", short: "Álvarez", num: 19, nat: "MEX", age: 28, pos: "MF", roles: ["DM", "RCM", "CB"], value: 26, from: "West Ham ↓", tags: ["relegated"] }),
    P({ name: "Niclas Füllkrug", short: "Füllkrug", num: 9, nat: "GER", age: 33, pos: "FW", roles: ["ST"], value: 11, from: "West Ham ↓", tags: ["relegated"] }),
    P({ name: "João Gomes", short: "J. Gomes", num: 8, nat: "BRA", age: 25, pos: "MF", roles: ["DM", "RCM", "LCM"], value: 40, from: "Wolves ↓", tags: ["relegated"], note: "Engine the midfield's been crying out for." }),
    P({ name: "Jørgen Strand Larsen", short: "Strand Larsen", num: 9, nat: "NOR", age: 26, pos: "FW", roles: ["ST"], value: 32, from: "Wolves ↓", tags: ["relegated"] }),
    P({ name: "Rodrigo Gomes", short: "R. Gomes", num: 17, nat: "POR", age: 22, pos: "FW", roles: ["RW", "RWB", "RAM"], value: 18, from: "Wolves ↓", tags: ["relegated", "prospect"] }),
    P({ name: "Toti Gomes", short: "Toti", num: 24, nat: "POR", age: 27, pos: "DF", roles: ["CB", "LCB"], value: 17, from: "Wolves ↓", tags: ["relegated"] }),
    P({ name: "Zian Flemming", short: "Flemming", num: 10, nat: "NED", age: 28, pos: "FW", roles: ["LAM", "RAM", "ST"], value: 10, from: "Burnley ↓", tags: ["relegated"] }),
    // -- Ligue 1 ↓ (Nice via playoff)
    P({ name: "Terem Moffi", short: "Moffi", num: 11, nat: "NGA", age: 27, pos: "FW", roles: ["ST", "LW"], value: 22, from: "Nice ↓", tags: ["relegated"] }),
    P({ name: "Sofiane Diop", short: "Diop", num: 10, nat: "MAR", age: 26, pos: "FW", roles: ["RAM", "LAM", "RW"], value: 16, from: "Nice ↓", tags: ["relegated"] }),
    P({ name: "Jérémie Boga", short: "Boga", num: 21, nat: "CIV", age: 29, pos: "FW", roles: ["LW", "LAM"], value: 10, from: "Nice ↓", tags: ["relegated"] }),
    // -- Bundesliga ↓ (Wolfsburg via playoff)
    P({ name: "Lovro Majer", short: "Majer", num: 18, nat: "CRO", age: 28, pos: "MF", roles: ["RAM", "LAM", "RCM"], value: 22, from: "Wolfsburg ↓", tags: ["relegated"] }),
    P({ name: "Jonas Wind", short: "Wind", num: 23, nat: "DEN", age: 27, pos: "FW", roles: ["ST"], value: 20, from: "Wolfsburg ↓", tags: ["relegated"] }),
    P({ name: "Mattias Svanberg", short: "Svanberg", num: 8, nat: "SWE", age: 27, pos: "MF", roles: ["RCM", "LCM", "DM"], value: 16, from: "Wolfsburg ↓", tags: ["relegated"] }),
    // -- La Liga ↓ (Real Oviedo)
    P({ name: "Santi Cazorla", short: "Cazorla", num: 8, nat: "ESP", age: 41, pos: "MF", roles: ["RAM", "LAM", "RCM"], value: 0, from: "Real Oviedo ↓", tags: ["relegated", "free"], note: "41, free, still magic." }),
  ];

  // ================================================================
  // PRIMAVERA & MILAN FUTURO  (promote for free)
  // ================================================================
  const ACADEMY = [
    P({ name: "Francesco Camarda", short: "Camarda", num: 73, nat: "ITA", age: 18, pos: "FW", roles: ["ST"], value: 12, from: "Milan Futuro", tags: ["academy"], note: "The next great No.9 hope." }),
    P({ name: "Christian Comotto", short: "Comotto", num: 70, nat: "ITA", age: 18, pos: "MF", roles: ["DM", "RCM", "LCM"], value: 6, from: "Primavera", tags: ["academy"] }),
    P({ name: "Hugo Cuenca", short: "Cuenca", num: 79, nat: "PAR", age: 19, pos: "FW", roles: ["LW", "LAM"], value: 4, from: "Milan Futuro", tags: ["academy"] }),
    P({ name: "Vittorio Magni", short: "Magni", num: 75, nat: "ITA", age: 19, pos: "DF", roles: ["LB", "LWB"], value: 3, from: "Milan Futuro", tags: ["academy"] }),
    P({ name: "Silvano Vos", short: "Vos", num: 74, nat: "NED", age: 20, pos: "MF", roles: ["DM", "RCM", "LCM"], value: 4, from: "Milan Futuro", tags: ["academy"] }),
    P({ name: "Victor Eletu", short: "Eletu", num: 76, nat: "ITA", age: 20, pos: "MF", roles: ["DM", "RCM", "CM"], value: 3, from: "Milan Futuro", tags: ["academy"] }),
    P({ name: "Adam Bakoune", short: "Bakoune", num: 78, nat: "ITA", age: 18, pos: "DF", roles: ["RB", "RWB"], value: 3, from: "Primavera", tags: ["academy"] }),
    P({ name: "Mattia Sandri", short: "Sandri", num: 80, nat: "ITA", age: 19, pos: "MF", roles: ["DM", "RCM"], value: 2, from: "Primavera", tags: ["academy"] }),
    P({ name: "Noah Raveyre", short: "Raveyre", num: 97, nat: "FRA", age: 20, pos: "GK", roles: ["GK"], value: 3, from: "Milan Futuro", tags: ["academy"] }),
    P({ name: "Alessandro Di Siena", short: "Di Siena", num: 88, nat: "ITA", age: 19, pos: "FW", roles: ["ST", "LW"], value: 2, from: "Primavera", tags: ["academy"] }),
    P({ name: "Filippo Scotti", short: "Scotti", num: 84, nat: "ITA", age: 19, pos: "FW", roles: ["RAM", "LAM", "RW"], value: 2, from: "Primavera", tags: ["academy"] }),
    P({ name: "Lapo Nava", short: "Nava", num: 71, nat: "ITA", age: 21, pos: "GK", roles: ["GK"], value: 2, from: "Milan Futuro", tags: ["academy"] }),
    P({ name: "Diego Sia", short: "Sia", num: 72, nat: "ITA", age: 18, pos: "FW", roles: ["RW", "RAM"], value: 3, from: "Primavera", tags: ["academy"] }),
  ];

  // ---- Starting budget & salary cap -------------------------------
  const START_BUDGET = 20;   // €M transfer kitty; grows with sales
  const WAGE_CAP = 110;      // €M gross/year — Milan's wage ceiling for this exercise

  // ---- Squad economics: gross annual wage (€M), EU eligibility, homegrown ----
  // hg: "club" = Milan-trained, "assoc" = Italy-trained elsewhere, null = neither.
  // euEligible decoupled from nationality (post-Brexit English = non-EU here).
  const SQUAD_META = {
    Maignan:{wage:5.0,eu:true},        Terracciano:{wage:0.8,eu:true,hg:"assoc"}, Torriani:{wage:0.4,eu:true,hg:"club"},
    Tomori:{wage:4.2,eu:false},        Pavlović:{wage:2.6,eu:true},        Gabbia:{wage:1.8,eu:true,hg:"club"},
    Pellegrino:{wage:0.7,eu:true},     Estupiñán:{wage:2.4,eu:false},      Bartesaghi:{wage:0.5,eu:true,hg:"club"},
    Saelemaekers:{wage:2.2,eu:true,hg:"assoc"}, Athekame:{wage:0.9,eu:true}, "F. Terracciano":{wage:0.5,eu:true,hg:"assoc"},
    "De Winter":{wage:2.2,eu:true},
    Fofana:{wage:3.0,eu:true},         Bennacer:{wage:4.0,eu:true,hg:"club"}, "Loftus-Cheek":{wage:4.5,eu:false},
    Ricci:{wage:2.5,eu:true,hg:"assoc"},
    Modrić:{wage:3.5,eu:true},         Jashari:{wage:2.2,eu:true},         Rabiot:{wage:4.0,eu:true},
    Bondo:{wage:0.9,eu:true},          Musah:{wage:2.0,eu:false},          Zeroli:{wage:0.5,eu:true,hg:"club"},
    Leão:{wage:7.0,eu:true},           Pulisic:{wage:5.0,eu:false},        Giménez:{wage:3.5,eu:false},
    Nkunku:{wage:5.0,eu:true},         Chukwueze:{wage:2.6,eu:false},
  };
  SQUAD.forEach(function (p) {
    var m = SQUAD_META[p.short] || {};
    p.wage = m.wage != null ? m.wage : Math.max(0.4, Math.round(p.value * 0.12 * 10) / 10);
    p.euEligible = m.eu != null ? m.eu : true;
    p.hg = m.hg || null;
    p.atMilan = true; // marks Milan-grown academy eligibility context
  });
  // Academy graduates are Milan club-trained by definition
  ACADEMY.forEach(function (p) { p.hg = "club"; if (p.euEligible == null) p.euEligible = p.nat !== "ENG"; });

  window.MILAN = {
    FORMATIONS, COACHES, DIRECTORS, SQUAD, MARKET, RELEGATED, ACADEMY, START_BUDGET, WAGE_CAP,
    // role -> human label
    ROLE_LABEL: {
      GK: "GK", LB: "LB", RB: "RB", LCB: "CB", RCB: "CB", CB: "CB",
      DM: "DM", LCM: "CM", RCM: "CM", CM: "CM",
      LWB: "LWB", RWB: "RWB", LAM: "AM", RAM: "AM",
      LW: "LW", RW: "RW", ST: "ST",
    },
    POS_GROUP: { GK: "Goalkeepers", DF: "Defenders", MF: "Midfielders", FW: "Forwards" },
  };
})();
