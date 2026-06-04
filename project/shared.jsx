/* Shared UI: icons, player rows/cards, helpers — exported to window */
const { useState, useEffect, useRef, useCallback } = React;

/* ---------------- icons ---------------- */
const Icon = {
  pitch: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}>
      <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 12h18M12 3v18"/>
      <circle cx="12" cy="12" r="3"/><path d="M3 8h3v8H3M21 8h-3v8h3"/>
    </svg>
  ),
  cart: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}>
      <path d="M3 4h2l2.4 12.5a2 2 0 0 0 2 1.5h7.7a2 2 0 0 0 2-1.6L21 8H6"/>
      <circle cx="10" cy="20.5" r="1.3" fill="currentColor" stroke="none"/>
      <circle cx="18" cy="20.5" r="1.3" fill="currentColor" stroke="none"/>
    </svg>
  ),
  squad: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}>
      <circle cx="9" cy="8" r="3.2"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0"/>
      <circle cx="17" cy="9" r="2.6"/><path d="M15 19a4.5 4.5 0 0 1 6.5-4"/>
    </svg>
  ),
  up: (p) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
      <path d="M12 4l7 8h-4v8H9v-8H5z"/>
    </svg>
  ),
  whistle: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}>
      <path d="M11 9h10a0 0 0 0 1 0 0v3a6 6 0 1 1-6-6h-4z"/><circle cx="15" cy="12" r="1.6" fill="currentColor" stroke="none"/>
    </svg>
  ),
  check: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" {...p}><path d="M5 13l4 4L19 7"/></svg>),
  plus:  (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" {...p}><path d="M12 5v14M5 12h14"/></svg>),
  euro:  (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><path d="M17 6a6 6 0 1 0 0 12M4 10h9M4 14h8"/></svg>),
  search:(p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>),
  share: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}><circle cx="6" cy="12" r="2.4"/><circle cx="18" cy="6" r="2.4"/><circle cx="18" cy="18" r="2.4"/><path d="M8.1 10.9l7.8-3.8M8.1 13.1l7.8 3.8"/></svg>),
  reset: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></svg>),
};

/* ---------------- helpers ---------------- */
const M = window.MILAN;
const roleLabel = (r) => M.ROLE_LABEL[r] || r;
const groupOf = (p) => p.pos;
function fmtMoney(v){
  if (v === 0) return "FREE";
  return "€" + v + "M";
}
function fmtNum(n){ return n.toLocaleString("en-US"); }

/* Gross annual wage (€M). Real squad wages live on the player; otherwise estimate
   from market value + age (a rough but sane scout's heuristic). */
function wageOf(p){
  if (p.wage != null) return p.wage;
  var base = p.value * 0.11 + (p.age <= 22 ? 0.4 : p.age >= 32 ? 1.4 : 0.9);
  return Math.max(0.3, Math.round(base * 10) / 10);
}
/* EU eligibility — provided per player; default by nationality (English = non-EU). */
function isEu(p){
  if (p.euEligible != null) return p.euEligible;
  return p.nat !== "ENG";
}

/* compute the starting XI for a formation from owned players + vote map */
function computeXI(formation, owned, votesOf){
  const used = new Set();
  const placed = {}; // slotId -> player
  // build candidate index by role
  for (const slotId of formation.order){
    const slot = formation.slots.find(s => s.id === slotId);
    const cands = owned
      .filter(p => !used.has(p.id) && p.roles.includes(slot.role))
      .sort((a,b) => votesOf(b) - votesOf(a));
    if (cands.length){
      placed[slotId] = cands[0];
      used.add(cands[0].id);
    } else {
      placed[slotId] = null;
    }
  }
  return placed;
}

/* candidates eligible for a given slot role, sorted by votes */
function candidatesFor(role, owned, votesOf){
  return owned.filter(p => p.roles.includes(role)).sort((a,b)=> votesOf(b)-votesOf(a));
}

/* XI with manual slot overrides applied first, then greedy by votes */
function computeXIOverride(formation, owned, votesOf, overrides){
  const used = new Set();
  const placed = {};
  if (overrides){
    for (const slotId of formation.order){
      const slot = formation.slots.find(s => s.id === slotId);
      const pid = overrides[slotId];
      if (!pid) continue;
      const p = owned.find(o => o.id === pid);
      if (p && !used.has(p.id) && p.roles.includes(slot.role)){
        placed[slotId] = p; used.add(p.id);
      }
    }
  }
  for (const slotId of formation.order){
    if (placed[slotId]) continue;
    const slot = formation.slots.find(s => s.id === slotId);
    const cands = owned.filter(p => !used.has(p.id) && p.roles.includes(slot.role))
                       .sort((a,b)=> votesOf(b)-votesOf(a));
    if (cands.length){ placed[slotId] = cands[0]; used.add(cands[0].id); }
    else placed[slotId] = null;
  }
  return placed;
}

/* players in squad not in the XI */
function benchOf(xi, squad){
  const onPitch = new Set(Object.values(xi).filter(Boolean).map(p=>p.id));
  return squad.filter(p => !onPitch.has(p.id));
}

/* ---------------- jersey token ---------------- */
function Jersey({ num, gk, className="" }){
  return (
    <div className={"jersey " + (gk ? "gk " : "") + className}>
      <span className="num">{num}</span>
    </div>
  );
}

/* ---------------- player list row ---------------- */
function PlayerRow({ p, votesOf, right, flat, sub }){
  return (
    <div className={"prow" + (flat ? " flat" : "")}>
      <div className="pnum">{p.num}</div>
      <div className="pmeta">
        <div className="pn">{p.short}</div>
        <div className="psub">
          <span className="pos-pill">{p.roles.map(roleLabel).filter((v,i,a)=>a.indexOf(v)===i).slice(0,2).join("/")}</span>
          {sub || (<span>{p.nat} · {p.age} {p.from ? "· "+p.from : ""}</span>)}
        </div>
        {p.note && <div className="psub pnote">{p.note}</div>}
      </div>
      {right}
    </div>
  );
}

/* vote button */
function VoteBtn({ count, voted, onClick }){
  return (
    <button className={"votebtn" + (voted ? " voted" : "")} onClick={onClick}>
      <Icon.up />
      <span className="vc">{fmtNum(count)}</span>
    </button>
  );
}

Object.assign(window, {
  Icon, M, roleLabel, groupOf, fmtMoney, fmtNum, wageOf, isEu,
  computeXI, computeXIOverride, benchOf, candidatesFor, Jersey, PlayerRow, VoteBtn,
});
