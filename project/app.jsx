/* APP — state, persistence, share-via-URL, devil crest, nav */
const { useState: uS, useEffect: uE, useCallback: uC, useMemo: uM } = React;

const ALL_STATIC = [...M.SQUAD, ...M.MARKET, ...M.WORLD, ...M.RELEGATED, ...M.ACADEMY];
const INDEX_STATIC = Object.fromEntries(ALL_STATIC.map(p => [p.id, p]));
const SQUAD_IDS = M.SQUAD.map(p => p.id);
const STORE = "milan-transfer-dreams-v4";
const VOTE_WEIGHT = 1;
const BASE_CONTRIB = 0;
const buyHype = (p) => Math.round(p.value * 90) + 1200;

/* Firebase Realtime Database — paste your database URL from the Firebase console */
const FB_URL = "https://acmilan-c402b-default-rtdb.europe-west1.firebasedatabase.app";
const FB_READY = true;

/* Seed coach vote counts so they start from realistic numbers even before real votes accumulate */
const SEED_COACHES = { slot: 0, glasner: 0, pochettino: 0, jaissle: 0 };

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

/* Persistent session ID for vote deduplication */
function getSessionId(){
  let id = localStorage.getItem("milan-session-id");
  if (!id){
    id = crypto.randomUUID
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem("milan-session-id", id);
  }
  return id;
}
const SESSION_ID = getSessionId();

/* original rossoneri devil crest */
function Crest(){
  return (
    <svg className="crest" viewBox="0 0 48 52" aria-hidden="true">
      <path d="M4 4 H44 V28 C44 41 35 48 24 51 C13 48 4 41 4 28 Z" fill="#0B0B0E" stroke="#fff" strokeWidth="1.6"/>
      <path d="M24 4 H44 V28 C44 41 35 48 24 51 Z" fill="#E2001A"/>
      <path d="M24 4 V51" stroke="#fff" strokeWidth="1" opacity=".5"/>
      <path d="M17.5 19 L11.5 8 Q14 12 18.5 15 Z" fill="#fff"/>
      <path d="M30.5 19 L36.5 8 Q34 12 29.5 15 Z" fill="#fff"/>
      <path d="M16 21 C16 15 20 12.5 24 12.5 C28 12.5 32 15 32 21 C32 30 28 36 24 40 C20 36 16 30 16 21 Z" fill="#fff"/>
      <path d="M19.6 23.4 L23 25 L20 26.6 Z" fill="#0B0B0E"/>
      <path d="M28.4 23.4 L25 25 L28 26.6 Z" fill="#0B0B0E"/>
      <path d="M20.5 30 Q24 33 27.5 30" stroke="#0B0B0E" strokeWidth="1.4" fill="none" strokeLinecap="round"/>
    </svg>
  );
}

function App(){
  const shared = readShared();
  const saved = load();
  const init = shared ? { ...saved, ...shared } : saved;

  const [tab, setTab] = uS(saved.tab || "pitch");
  const [mode, setMode] = uS(shared ? "mine" : (saved.mode || "people"));
  const [sharedView, setSharedView] = uS(!!shared);
  const [ownedIds, setOwnedIds] = uS(init.ownedIds || init.o || SQUAD_IDS.slice());
  const [budget, setBudget] = uS(shared ? M.START_BUDGET : (saved.budget != null ? saved.budget : M.START_BUDGET));
  const [seeds, setSeeds] = uS(init.seeds || init.s || {});
  const [myLineup, setMyLineup] = uS(init.myLineup || init.l || {});
  const [myCoach, setMyCoach] = uS(init.myCoach || init.c || (saved.myCoach || null));
  const [myVotes, setMyVotes] = uS(new Set(saved.myVotes || []));
  const [contributed, setContributed] = uS(!!saved.contributed);
  const [toast, setToast] = uS(null);
  const toastT = React.useRef(null);

  const [serverState, setServerState] = uS({
    votes: {},
    coaches: { ...SEED_COACHES },
    directors: {},
    contributors: BASE_CONTRIB,
  });
  const [apiReady, setApiReady] = uS(false);
  const [myDirector, setMyDirector] = uS(saved.myDirector || null);

  /* Live player index — starts with static data, enriched by players.json */
  const [liveIndex, setLiveIndex] = uS(INDEX_STATIC);
  /* Dynamic buy pool — starts static, replaced by players.json market data when available */
  const [allBuy, setAllBuy] = uS([...M.MARKET, ...M.WORLD, ...M.RELEGATED, ...M.ACADEMY]);

  /* Fetch votes from Firebase + player data from static JSON once on mount */
  uE(() => {
    if (FB_READY) {
      Promise.all([
        fetch(`${FB_URL}/lineup_votes.json`).then(r => r.ok ? r.json() : null),
        fetch(`${FB_URL}/coach_votes.json`).then(r => r.ok ? r.json() : null),
        fetch(`${FB_URL}/director_votes.json`).then(r => r.ok ? r.json() : null),
      ])
        .then(([lvData, cvData, dvData]) => {
          /* Entries are keyed by session id (PUT), so each user counts once.
             Own entries are skipped — local state (myVotes/myCoach/myDirector)
             supplies them, so switching a pick never double-counts. */
          const votes = {};
          const sessions = new Set();
          for (const [key, entry] of Object.entries(lvData || {})) {
            if (!entry?.lineup || key !== entry.session_id) continue;
            sessions.add(key);
            if (key === SESSION_ID) continue;
            for (const pid of Object.values(entry.lineup)) {
              if (pid) votes[pid] = (votes[pid] || 0) + 1;
            }
          }
          const coaches = { ...SEED_COACHES };
          for (const [key, entry] of Object.entries(cvData || {})) {
            if (!entry || !entry.coach_id || key !== entry.session_id) continue;
            sessions.add(key);
            if (key === SESSION_ID) continue;
            coaches[entry.coach_id] = (coaches[entry.coach_id] || 0) + 1;
          }
          const directors = {};
          for (const [key, entry] of Object.entries(dvData || {})) {
            if (!entry || !entry.director_id || key !== entry.session_id) continue;
            sessions.add(key);
            if (key === SESSION_ID) continue;
            directors[entry.director_id] = (directors[entry.director_id] || 0) + 1;
          }
          setServerState({ votes, coaches, directors, contributors: BASE_CONTRIB + sessions.size });
          setApiReady(true);
        })
        .catch(() => {});
    }

    fetch("/players.json")
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) return;
        const enriched = { ...INDEX_STATIC };
        for (const tmP of (data.squad || [])) {
          const key = tmP.name.toLowerCase();
          const match = M.SQUAD.find(p => p.name.toLowerCase() === key);
          if (match) {
            enriched[match.id] = {
              ...match,
              value: tmP.value || match.value,
              age: tmP.age || match.age,
              num: tmP.num || match.num,
            };
          }
        }
        for (const p of (data.market || [])) enriched[p.id] = p;
        setLiveIndex(enriched);
        if (data.market && data.market.length > 0) {
          // Curated static entries win over generated tm: entries — dedupe by accent-normalised name
          const norm = s => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
          const staticPool = [...M.MARKET, ...M.WORLD, ...M.RELEGATED, ...M.ACADEMY];
          const staticNames = new Set(staticPool.map(p => norm(p.name)));
          const freshMarket = data.market.filter(p => !staticNames.has(norm(p.name)));
          setAllBuy([...staticPool, ...freshMarket]);
        }
      })
      .catch(() => {});
  }, []);

  uE(() => {
    localStorage.setItem(STORE, JSON.stringify({
      tab, mode, ownedIds, budget, seeds, myLineup,
      myVotes: [...myVotes], myCoach, myDirector, contributed,
    }));
  }, [tab, mode, ownedIds, budget, seeds, myLineup, myVotes, myCoach, myDirector, contributed]);

  const owned = uM(() => ownedIds.map(id => liveIndex[id]).filter(Boolean), [ownedIds, liveIndex]);
  const squadValue = owned.reduce((s,p)=> s + p.value, 0);

  /* votesOf: Firebase count is source of truth once live; seeds (buy hype) override locally */
  // My XI ranking: local buy-hype wins so signings slot in; otherwise live aggregate votes
  const votesOf = uC((p) => {
    if (seeds[p.id] != null) return seeds[p.id];
    const server = serverState.votes[p.id];
    return server != null ? server : (apiReady ? 0 : p.votes);
  }, [seeds, serverState, apiReady]);

  // People's XI: aggregated lineup votes (others) + my own submitted lineup
  const peopleVotesOf = uC((p) => {
    if (!apiReady) return p.votes;
    return (serverState.votes[p.id] || 0) + (myVotes.has(p.id) ? VOTE_WEIGHT : 0);
  }, [serverState, apiReady, myVotes]);

  // People's XI candidate pool = squad + anyone who's received lineup votes (incl. signings)
  const peopleSquad = uM(() => {
    const map = new Map(M.SQUAD.map(p => [p.id, p]));
    for (const id in serverState.votes) {
      if (!map.has(id) && liveIndex[id]) map.set(id, liveIndex[id]);
    }
    for (const id of myVotes) {
      if (!map.has(id) && liveIndex[id]) map.set(id, liveIndex[id]);
    }
    return [...map.values()];
  }, [serverState.votes, liveIndex, myVotes]);

  const coaches = M.COACHES.map(c => ({
    ...c,
    liveVotes: (serverState.coaches[c.id] ?? c.votes) + (myCoach === c.id ? VOTE_WEIGHT : 0),
  }));
  const sortedCoach = [...coaches].sort((a,b)=> b.liveVotes - a.liveVotes);
  const communityCoach = (sortedCoach.find(c => !c.ruledOut) || sortedCoach[0]).id;

  const directors = M.DIRECTORS.map(d => ({
    ...d,
    liveVotes: (serverState.directors[d.id] ?? d.votes) + (myDirector === d.id ? VOTE_WEIGHT : 0),
  }));

  const contributors = apiReady ? serverState.contributors : BASE_CONTRIB + (contributed ? 1 : 0);

  const flash = (msg, bad) => {
    setToast({ msg, bad });
    clearTimeout(toastT.current);
    toastT.current = setTimeout(()=> setToast(null), 2000);
  };
  const markContributed = () => { if (!contributed) setContributed(true); };

  const wageFlash = (p) => {
    const current = owned.reduce((s, q) => s + wageOf(q), 0);
    const after = current + wageOf(p);
    const cap = M.WAGE_CAP;
    if (after > cap){
      const over = Math.round((after - cap) * 10) / 10;
      return { msg: " · ⚠ wage bill €" + over + "M over cap", bad: true };
    }
    return { msg: " · €" + wageOf(p) + "M/yr wages", bad: false };
  };

  /* One vote per session — PUT to a session-keyed path replaces any previous vote */
  function postCoachVote(coachId){
    if (!FB_READY) return;
    fetch(`${FB_URL}/coach_votes/${SESSION_ID}.json`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ coach_id: coachId, session_id: SESSION_ID }),
    }).catch(() => {});
  }

  function postDirectorVote(directorId){
    if (!FB_READY) return;
    fetch(`${FB_URL}/director_votes/${SESSION_ID}.json`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ director_id: directorId, session_id: SESSION_ID }),
    }).catch(() => {});
  }

  // ---- handlers ----
  const onVoteCoach = (id) => {
    setMyCoach(() => id);
    setMode("mine");
    markContributed();
    flash("Lined up in " + M.FORMATIONS[id].name);
    postCoachVote(id);
  };

  const onVoteDirector = (id) => {
    setMyDirector(id);
    markContributed();
    flash("Maldini it is. Was there ever a doubt?");
    postDirectorVote(id);
  };

  const onVoteLineup = () => {
    const coachId = myCoach || communityCoach;
    const formation = M.FORMATIONS[coachId];
    const lineup = myLineup[coachId] || {};
    const filled = formation.slots.filter(s => lineup[s.id]).length;
    if (filled < formation.slots.length) {
      flash("Fill all " + formation.slots.length + " positions first", true); return;
    }
    if (budget < 0) { flash("Fix your squad budget before voting", true); return; }
    if (!FB_READY) return;
    fetch(`${FB_URL}/lineup_votes/${SESSION_ID}.json`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: SESSION_ID, coach_id: coachId, lineup }),
    }).then(r => {
      if (r.ok) {
        const submitted = new Set(Object.values(lineup).filter(Boolean));
        const firstVote = myVotes.size === 0;
        setMyVotes(submitted);
        markContributed();
        flash(firstVote ? "Your XI is in the vote! ✓" : "Your vote has been updated ✓");
        if (firstVote) {
          setServerState(prev => ({ ...prev, contributors: prev.contributors + 1 }));
        }
      }
    }).catch(() => {});
  };

  const onBuy = (p) => {
    if (p.value > budget){ flash("Not enough in the war chest", true); return false; }
    if (ownedIds.includes(p.id)) return false;
    if (ownedIds.length >= 30){ flash("Squad is full (30 max)", true); return false; }
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
    if (ownedIds.length >= 30){ flash("Squad is full (30 max)", true); return false; }
    setSeeds(s => ({ ...s, [p.id]: buyHype(p) }));
    setOwnedIds(ids => [...ids, p.id]);
    flash(p.short + " promoted from the academy");
    markContributed();
    return true;
  };
  const onSell = (p) => {
    setBudget(b => b + p.value);
    setOwnedIds(ids => ids.filter(id => id !== p.id));
    setMyLineup(ml => {
      const n = {};
      for (const c in ml){ n[c] = {}; for (const s in ml[c]) if (ml[c][s] !== p.id) n[c][s] = ml[c][s]; }
      return n;
    });
    setLiveIndex(idx => { const n = {...idx}; delete n[p.id]; return n; });
    flash(p.short + " sold · +" + fmtMoney(p.value === 0 ? 0 : p.value));
    markContributed();
  };
  const onStart = (coachId, slotId, pid) => {
    setMyLineup(ml => ({ ...ml, [coachId]: { ...(ml[coachId]||{}), [slotId]: pid } }));
    markContributed();
  };
  const onShare = () => {
    const payload = btoa(unescape(encodeURIComponent(JSON.stringify({
      o: ownedIds, c: myCoach, l: myLineup, s: seeds,
    }))));
    const url = location.origin + location.pathname + "#team=" + encodeURIComponent(payload);
    try { history.replaceState(null, "", url); } catch(e){}
    const done = () => flash("Link copied — share your XI!");
    if (navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(url).then(done).catch(()=>{
        try { const t=document.createElement("textarea"); t.value=url; document.body.appendChild(t); t.select(); document.execCommand("copy"); t.remove(); done(); } catch(e2){ flash("Shareable link is in your address bar"); }
      });
    } else {
      try { const t=document.createElement("textarea"); t.value=url; document.body.appendChild(t); t.select(); document.execCommand("copy"); t.remove(); done(); } catch(e2){ flash("Shareable link is in your address bar"); }
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
        <a className="brand-link" href="https://reddit.com/r/ACMilan" target="_blank" rel="noopener noreferrer">
          <Crest/>
          <div className="brand-txt">
            <b>Transfer Dreams</b>
            <span>Build the Diavolo · r/ACMilan</span>
          </div>
        </a>
        <div className={"budget" + (budget<0 ? " neg" : "")} onDoubleClick={resetAll} title="Double-tap to reset">
          <div className="lab">War chest</div>
          <div className="amt">€{budget}<small>M</small></div>
        </div>
      </div>

      {tab === "pitch" && (
        <Pitch
          mode={mode} setMode={setMode}
          peopleSquad={peopleSquad} mySquad={owned}
          coaches={coaches} communityCoach={communityCoach}
          myCoach={myCoach} onVoteCoach={onVoteCoach}
          directors={directors} myDirector={myDirector} onVoteDirector={onVoteDirector}
          votesOf={votesOf} peopleVotesOf={peopleVotesOf} onVoteLineup={onVoteLineup}
          myLineup={myLineup} onStart={onStart}
          onBuy={onBuy} onPromote={onPromote} onSell={onSell} ownedIds={ownedIds} budget={budget}
          contributors={contributors} contributed={contributed} apiReady={apiReady}
          onShare={onShare} sharedView={sharedView} onClaimShared={onClaimShared}
          goMercato={()=>setTab("mercato")} allBuy={allBuy}
        />
      )}
      {tab === "mercato" && (
        <Mercato ownedIds={ownedIds} budget={budget} squadSize={owned.length} onBuy={onBuy} onPromote={onPromote} allBuy={allBuy} goSquad={()=>setTab("squad")} />
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
