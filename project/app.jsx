/* APP — state, persistence, share-via-URL, devil crest, nav */
const { useState: uS, useEffect: uE, useCallback: uC, useMemo: uM } = React;

const ALL = [...M.SQUAD, ...M.MARKET, ...M.WORLD, ...M.RELEGATED, ...M.ACADEMY];
const INDEX = Object.fromEntries(ALL.map(p => [p.id, p]));
const SQUAD_IDS = M.SQUAD.map(p => p.id);
const STORE = "milan-transfer-dreams-v3";
const VOTE_WEIGHT = 1;
const BASE_CONTRIB = 14207;
const buyHype = (p) => Math.round(p.value * 90) + 1200;

function load(){
  try { return JSON.parse(localStorage.getItem(STORE)) || {}; } catch(e){ return {}; }
}
function readShared(){
  try {
    const m = (location.hash || "").match(/team=([^&]+)/);
    if (!m) return null;
    return JSON.parse(decodeURIComponent(escape(atob(decodeURIComponent(m[1])))));
  } catch(e){ return null; }
}

/* original rossoneri devil crest */
function Crest(){
  return (
    <svg className="crest" viewBox="0 0 48 52" aria-hidden="true">
      <path d="M4 4 H44 V28 C44 41 35 48 24 51 C13 48 4 41 4 28 Z" fill="#0B0B0E" stroke="#fff" strokeWidth="1.6"/>
      <path d="M24 4 H44 V28 C44 41 35 48 24 51 Z" fill="#E2001A"/>
      <path d="M24 4 V51" stroke="#fff" strokeWidth="1" opacity=".5"/>
      {/* horns */}
      <path d="M17.5 19 L11.5 8 Q14 12 18.5 15 Z" fill="#fff"/>
      <path d="M30.5 19 L36.5 8 Q34 12 29.5 15 Z" fill="#fff"/>
      {/* devil head */}
      <path d="M16 21 C16 15 20 12.5 24 12.5 C28 12.5 32 15 32 21 C32 30 28 36 24 40 C20 36 16 30 16 21 Z" fill="#fff"/>
      {/* angry eyes */}
      <path d="M19.6 23.4 L23 25 L20 26.6 Z" fill="#0B0B0E"/>
      <path d="M28.4 23.4 L25 25 L28 26.6 Z" fill="#0B0B0E"/>
      {/* grin */}
      <path d="M20.5 30 Q24 33 27.5 30" stroke="#0B0B0E" strokeWidth="1.4" fill="none" strokeLinecap="round"/>
    </svg>
  );
}

function App(){
  const shared = readShared();
  const saved = load();
  const init = shared || saved;

  const [tab, setTab] = uS(saved.tab || "pitch");
  const [mode, setMode] = uS(shared ? "mine" : (saved.mode || "people"));
  const [sharedView, setSharedView] = uS(!!shared);
  const [ownedIds, setOwnedIds] = uS(init.ownedIds || init.o || SQUAD_IDS.slice());
  const [budget, setBudget] = uS((init.budget != null ? init.budget : (init.b != null ? init.b : M.START_BUDGET)));
  const [seeds, setSeeds] = uS(init.seeds || init.s || {});
  const [myLineup, setMyLineup] = uS(init.myLineup || init.l || {});
  const [myCoach, setMyCoach] = uS(init.myCoach || init.c || (saved.myCoach || null));
  const [myVotes, setMyVotes] = uS(new Set(saved.myVotes || []));
  const [contributed, setContributed] = uS(!!saved.contributed);
  const [toast, setToast] = uS(null);
  const toastT = React.useRef(null);

  uE(() => {
    localStorage.setItem(STORE, JSON.stringify({
      tab, mode, ownedIds, budget, seeds, myLineup,
      myVotes: [...myVotes], myCoach, contributed,
    }));
  }, [tab, mode, ownedIds, budget, seeds, myLineup, myVotes, myCoach, contributed]);

  const owned = uM(() => ownedIds.map(id => INDEX[id]).filter(Boolean), [ownedIds]);
  const squadValue = owned.reduce((s,p)=> s + p.value, 0);

  const votesOf = uC((p) => {
    const base = seeds[p.id] != null ? seeds[p.id] : p.votes;
    return base + (myVotes.has(p.id) ? VOTE_WEIGHT : 0);
  }, [seeds, myVotes]);

  const coaches = M.COACHES.map(c => ({ ...c, liveVotes: c.votes + (myCoach === c.id ? VOTE_WEIGHT : 0) }));
  const sortedCoach = [...coaches].sort((a,b)=> b.liveVotes - a.liveVotes);
  const communityCoach = sortedCoach[0].id;
  const contributors = BASE_CONTRIB + (contributed ? 1 : 0);

  const flash = (msg, bad) => {
    setToast({ msg, bad });
    clearTimeout(toastT.current);
    toastT.current = setTimeout(()=> setToast(null), 2000);
  };
  const markContributed = () => { if (!contributed) setContributed(true); };

  // Wage-cap impact of adding player p: returns a toast suffix + whether it breaches.
  const wageFlash = (p) => {
    const current = owned.reduce((s, q) => s + wageOf(q), 0);
    const after = current + wageOf(p);
    const cap = M.WAGE_CAP;
    if (after > cap) {
      const over = Math.round((after - cap) * 10) / 10;
      return { msg: " · ⚠ wage bill €" + over + "M over cap", bad: true };
    }
    return { msg: " · €" + wageOf(p) + "M/yr wages", bad: false };
  };

  // ---- handlers ----
  const onVotePlayer = (id) => {
    setMyVotes(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
    markContributed();
  };
  const onVoteCoach = (id) => {
    setMyCoach(prev => prev === id ? id : id); // picking always sets (also drives My XI shape)
    markContributed();
    flash("Lined up in " + M.FORMATIONS[id].name);
  };
  const onBuy = (p) => {
    if (p.value > budget) { flash("Not enough in the war chest", true); return false; }
    if (ownedIds.includes(p.id)) return false;
    if (ownedIds.length >= 30) { flash("Squad is full (30 max)", true); return false; }
    setBudget(b => b - p.value);
    setSeeds(s => ({ ...s, [p.id]: buyHype(p) }));
    setOwnedIds(ids => [...ids, p.id]);
    const wf = wageFlash(p);
    flash(p.short + " signed · " + fmtMoney(p.value) + wf.msg, wf.bad);
    markContributed();
    return true;
  };
  const onPromote = (p) => {
    if (ownedIds.includes(p.id)) return false;
    if (ownedIds.length >= 30) { flash("Squad is full (30 max)", true); return false; }
    setSeeds(s => ({ ...s, [p.id]: buyHype(p) }));
    setOwnedIds(ids => [...ids, p.id]);
    flash(p.short + " promoted from the academy");
    markContributed();
    return true;
  };
  const onSell = (p) => {
    setBudget(b => b + p.value);
    setOwnedIds(ids => ids.filter(id => id !== p.id));
    // clean lineup overrides referencing this player
    setMyLineup(ml => {
      const n = {}; for (const c in ml){ n[c] = {}; for (const s in ml[c]) if (ml[c][s] !== p.id) n[c][s] = ml[c][s]; }
      return n;
    });
    flash(p.short + " sold · +" + fmtMoney(p.value === 0 ? 0 : p.value));
    markContributed();
  };
  const onStart = (coachId, slotId, pid) => {
    setMyLineup(ml => ({ ...ml, [coachId]: { ...(ml[coachId]||{}), [slotId]: pid } }));
    markContributed();
  };
  const onShare = () => {
    const payload = btoa(unescape(encodeURIComponent(JSON.stringify({
      o: ownedIds, c: myCoach, l: myLineup, b: budget, s: seeds,
    }))));
    const url = location.origin + location.pathname + "#team=" + encodeURIComponent(payload);
    try { history.replaceState(null, "", url); } catch(e){}
    const done = () => flash("Link copied — share your XI!");
    if (navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(url).then(done).catch(()=>{
        try { const t=document.createElement("textarea"); t.value=url; document.body.appendChild(t); t.select(); document.execCommand("copy"); t.remove(); done(); }
        catch(e2){ flash("Shareable link is in your address bar"); }
      });
    } else {
      try { const t=document.createElement("textarea"); t.value=url; document.body.appendChild(t); t.select(); document.execCommand("copy"); t.remove(); done(); }
      catch(e2){ flash("Shareable link is in your address bar"); }
    }
  };
  const onClaimShared = () => {
    setSharedView(false);
    try { history.replaceState(null, "", location.origin + location.pathname); } catch(e){}
    flash("This squad is now yours");
  };
  const resetAll = () => {
    if (typeof window !== "undefined" && window.confirm &&
        !window.confirm("Reset everything back to Milan's real squad and a €20M war chest? Your signings, sales and lineup will be wiped.")) return;
    localStorage.removeItem(STORE);
    try { history.replaceState(null, "", location.origin + location.pathname); } catch(e){}
    setOwnedIds(SQUAD_IDS.slice()); setBudget(M.START_BUDGET); setSeeds({}); setMyLineup({});
    setMyVotes(new Set()); setMyCoach(null); setContributed(false); setSharedView(false); setMode("people");
    flash("Rebuild reset");
  };

  return (
    <div className="shell">
      <div className="topbar">
        <Crest/>
        <div className="brand-txt">
          <b>Transfer Dreams</b>
          <span>Build the Diavolo · r/ACMilan</span>
        </div>
        <div className={"budget" + (budget<0 ? " neg" : "")} onDoubleClick={resetAll} title="Double-tap to reset">
          <div className="lab">War chest</div>
          <div className="amt">€{budget}<small>M</small></div>
        </div>
      </div>

      {tab === "pitch" && (
        <Pitch
          mode={mode} setMode={setMode}
          peopleSquad={M.SQUAD} mySquad={owned}
          coaches={sortedCoach} communityCoach={communityCoach}
          myCoach={myCoach} onVoteCoach={onVoteCoach}
          votesOf={votesOf} myVotes={myVotes} onVotePlayer={onVotePlayer}
          myLineup={myLineup} onStart={onStart}
          onBuy={onBuy} onPromote={onPromote} onSell={onSell} ownedIds={ownedIds} budget={budget}
          contributors={contributors} contributed={contributed}
          onShare={onShare} sharedView={sharedView} onClaimShared={onClaimShared}
          goMercato={()=>setTab("mercato")}
        />
      )}
      {tab === "mercato" && (
        <Mercato ownedIds={ownedIds} budget={budget} squadSize={owned.length} onBuy={onBuy} onPromote={onPromote} />
      )}
      {tab === "squad" && (
        <SquadView owned={owned} budget={budget} squadValue={squadValue} votesOf={votesOf} onSell={onSell} onReset={resetAll} />
      )}

      <div className="nav">
        <button className={tab==="pitch"?"on":""} onClick={()=>setTab("pitch")}>
          <Icon.pitch/><span className="nlab">The XI</span>
        </button>
        <button className={tab==="mercato"?"on":""} onClick={()=>setTab("mercato")}>
          <Icon.cart/><span className="nlab">Mercato</span>
        </button>
        <button className={tab==="squad"?"on":""} onClick={()=>setTab("squad")}>
          <Icon.squad/><span className="nlab">Squad</span>
          <span className="badge">{owned.length}</span>
        </button>
      </div>

      <div className={"toast" + (toast ? " show" : "") + (toast && toast.bad ? " bad" : "")}>
        {toast ? toast.msg : ""}
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App/>);
