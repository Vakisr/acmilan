/* PITCH VIEW — People's XI (crowd) vs My XI (build + share), bench, sheet */
const { useState: useStateP } = React;

function SubTok({ p, onClick }){
  return (
    <button className="subtok" onClick={onClick}>
      <span className={"sj" + (p.pos === "GK" ? " gk" : "")}><span className="num">{p.num}</span></span>
      <span className="sn">{p.short}</span>
      <span className="sp">{p.roles.map(roleLabel).filter((v,i,a)=>a.indexOf(v)===i).slice(0,2).join("/")}</span>
    </button>
  );
}

function Pitch(props){
  const {
    mode, setMode, peopleSquad, mySquad, coaches, communityCoach, myCoach, onVoteCoach,
    votesOf, myVotes, onVotePlayer, myLineup, onStart, onBuy, onPromote, onSell, ownedIds, budget,
    contributors, contributed, apiReady, onShare, sharedView, onClaimShared, goMercato, allBuy,
  } = props;

  const isMine = mode === "mine";
  const coachId = isMine ? (myCoach || communityCoach) : communityCoach;
  const formation = M.FORMATIONS[coachId];
  const squad = isMine ? mySquad : peopleSquad;
  const overrides = isMine ? (myLineup[coachId] || {}) : null;
  const xi = isMine
    ? computeXIOverride(formation, squad, votesOf, overrides)
    : computeXI(formation, squad, votesOf);
  const bench = benchOf(xi, squad);

  const [slot, setSlot] = useStateP(null);
  const close = () => setSlot(null);
  const activeSlot = slot ? formation.slots.find(s => s.id === slot) : null;
  const role = activeSlot ? activeSlot.role : null;
  const ownedCands = activeSlot ? candidatesFor(role, squad, votesOf) : [];
  const starterId = activeSlot ? (xi[activeSlot.id] && xi[activeSlot.id].id) : null;
  const signCands = activeSlot
    ? (allBuy || []).filter(p => !ownedIds.includes(p.id) && p.roles.includes(role))
            .sort((a,b)=> b.value - a.value).slice(0, 40)
    : [];

  const totalCoachVotes = coaches.reduce((s,c)=> s + c.liveVotes, 0);
  const curCoach = coaches.find(c => c.id === coachId);

  const openBench = (p) => {
    const s = formation.order.find(id => {
      const sl = formation.slots.find(x => x.id === id);
      return p.roles.includes(sl.role);
    });
    if (s) setSlot(s);
  };
  const signHere = (p) => {
    const ok = p.tags.includes("academy") ? onPromote(p) : onBuy(p);
    if (ok !== false && activeSlot) onStart(coachId, activeSlot.id, p.id);
  };

  return (
    <React.Fragment>
    <div className="scroll" id="view-pitch">
      <div className="pitch-head">
        <div className="kicker">{isMine ? "Your rebuild · unique to you" : "Crowdsourced · the people's pick"}</div>
        <h1><span>WHAT DOES OUR LINEUP</span><span>LOOK LIKE IN <em>26/27?</em></span></h1>
      </div>

      <div className="modetog">
        <button className={!isMine ? "on" : ""} onClick={()=>setMode("people")}>
          The People's XI<span className="mt-sub">Most votes · live</span>
        </button>
        <button className={isMine ? "on" : ""} onClick={()=>setMode("mine")}>
          My XI<span className="mt-sub">Build &amp; share</span>
        </button>
      </div>

      <div className="pview">
        {/* coach */}
        <div className="coachbar">
          {coaches.map(c => {
            const pct = totalCoachVotes ? Math.round(c.liveVotes/totalCoachVotes*100) : 0;
            const on = c.id === coachId;
            return (
              <button key={c.id}
                className={"coachpick" + (on ? " on" : "") + (c.ruledOut ? " ruled-out" : "")}
                onClick={c.ruledOut ? undefined : ()=>onVoteCoach(c.id)}
                disabled={!!c.ruledOut}>
                <div className="role">{c.from} · {c.nat}</div>
                <div className="cname">{c.name}</div>
                <div className="shape">{c.shape}</div>
                <div className="cvotes">
                  <div className="vbar"><i style={{width:pct+"%"}}/></div>
                  <span className="pct">{pct}%</span>
                </div>
                <div className="cvotes" style={{marginTop:3}}>
                  <span>{fmtNum(c.liveVotes)} votes</span>
                </div>
                {c.ruledOut && <div className="ruled-out-badge">RULED OUT ✕</div>}
              </button>
            );
          })}
        </div>

        <div className="coach-blurb">
          {isMine
            ? <span><b>You're coaching {curCoach.name}'s {formation.name}.</b> Tap a position to pick who starts, or sign someone new straight onto the pitch. {curCoach.blurb}</span>
            : <span><b>{curCoach.name}</b> is winning the vote — the crowd lines up in a <b>{formation.name}</b>. {curCoach.blurb}</span>}
        </div>

        {/* field */}
        <div className="pitch-wrap">
          <div className="pitch">
            <svg className="lines" viewBox="0 0 100 140" preserveAspectRatio="none">
              <rect x="2" y="2" width="96" height="136"/>
              <line x1="2" y1="70" x2="98" y2="70"/>
              <circle cx="50" cy="70" r="13"/>
              <rect x="26" y="2" width="48" height="20"/>
              <rect x="38" y="2" width="24" height="9"/>
              <rect x="26" y="118" width="48" height="20"/>
              <rect x="38" y="129" width="24" height="9"/>
            </svg>
            <div className="glow"/>
            {formation.slots.map(s => {
              const p = xi[s.id];
              return (
                <div key={s.id} className={"tok" + (p ? "" : " empty")}
                     style={{ left:s.x+"%", top:s.y+"%" }} onClick={()=>setSlot(s.id)}>
                  <span className="slotlab">{roleLabel(s.role)}</span>
                  {p ? (
                    <React.Fragment>
                      <Jersey num={p.num} gk={s.role==="GK"} />
                      <div className="nm">{p.short}</div>
                      {isMine
                        ? <div className="vchip" style={{background:"rgba(0,0,0,.55)"}}>€{p.value}M</div>
                        : <div className="vchip"><Icon.up/>{fmtNum(votesOf(p))}</div>}
                    </React.Fragment>
                  ) : (
                    <React.Fragment>
                      <div className="jersey"><span className="num">+</span></div>
                      <div className="nm" style={{color:"rgba(255,255,255,.7)"}}>SIGN ONE</div>
                    </React.Fragment>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* contributor counter */}
        <div className="contrib">
          <span className="pulse"/>
          <div>
            <div className="big">{fmtNum(contributors)}</div>
            <div className="sub">Rossoneri picking the team{apiReady ? " · live" : ""}</div>
          </div>
          <div className="you">{contributed ? "You're in ✓" : "Vote to join"}</div>
        </div>

        {/* share (my XI) */}
        {isMine && (
          <div className="sharebar">
            <button className="btn btn-share" onClick={onShare}><Icon.share/> Share my XI</button>
            <button className="btn btn-ghost" onClick={goMercato}>Open Mercato</button>
          </div>
        )}
        {sharedView && (
          <div className="sharednote">
            <span><b>You're viewing a shared squad.</b> Tweak it and it becomes yours.</span>
            <button onClick={onClaimShared}>Make it mine</button>
          </div>
        )}
      </div>

      {/* candidate / sign sheet */}
      <div className={"scrim" + (slot ? " show" : "")} onClick={close}>
        <div className="sheet" onClick={e=>e.stopPropagation()}>
          <div className="grab"/>
          {activeSlot && (
            <React.Fragment>
              <div className="sheet-head">
                <div className="kicker">{roleLabel(role)} · {formation.name}</div>
                <h3>{isMine ? "Pick who plays here" : "Who should start?"}</h3>
                <p>{isMine
                  ? "Tap Start to lock a player in, or sign a new face straight onto the pitch."
                  : "Back a player — the most-backed name in each position takes the pitch."}</p>
              </div>
              <div className="sheet-list">
                {ownedCands.map(p => (
                  <PlayerRow key={p.id} p={p} votesOf={votesOf}
                    sub={<span>{p.nat} · {p.age} {p.id===starterId ? "· STARTING" : ""}</span>}
                    right={ isMine
                      ? <div style={{display:"flex",alignItems:"center",gap:7}}>
                          <button className={"startbtn" + (p.id===starterId ? " isstart" : "")}
                                  onClick={()=>onStart(coachId, activeSlot.id, p.id)}>
                            {p.id===starterId ? "Starting ✓" : "Start"}
                          </button>
                          <button className="btn btn-sell" onClick={()=>onSell(p)}>Sell €{p.value}M</button>
                        </div>
                      : <VoteBtn count={votesOf(p)} voted={myVotes.has(p.id)} onClick={()=>onVotePlayer(p.id)} />
                    }/>
                ))}
                {ownedCands.length===0 && !isMine && (
                  <div className="empty-note">No one in the squad can play here.</div>
                )}

                {isMine && (
                  <React.Fragment>
                    <div className="sheet-sign-lab">Sign a {roleLabel(role)}</div>
                    {signCands.map(p => {
                      const academy = p.tags.includes("academy");
                      const tooDear = !academy && p.value > budget;
                      return (
                        <PlayerRow key={p.id} p={p} votesOf={()=>0}
                          sub={<span>{p.nat} · {p.age} · {p.from}</span>}
                          right={
                            <div style={{display:"flex",alignItems:"center",gap:10}}>
                              <div className="pval"><div className="v">{fmtMoney(p.value)}</div><div className="vl">{academy?"promote":"value"}</div></div>
                              <button className={"btn " + (academy?"btn-promote":"btn-buy")} disabled={tooDear} onClick={()=>signHere(p)}>
                                {tooDear ? "—" : (academy ? "Promote" : "Sign")}
                              </button>
                            </div>
                          }/>
                      );
                    })}
                  </React.Fragment>
                )}
              </div>
            </React.Fragment>
          )}
        </div>
      </div>
      <div className="spacer"/>
    </div>

    {/* bench — always visible, outside scroll */}
    <div className="bench">
      <div className="bench-lab">Bench &amp; squad <b>· {bench.length}</b></div>
      {bench.length ? (
        <div className="bench-row">
          {bench.map(p => <SubTok key={p.id} p={p} onClick={()=>openBench(p)} />)}
        </div>
      ) : (
        <div className="bench-empty">No subs yet — sign more players in the Mercato.</div>
      )}
    </div>
    </React.Fragment>
  );
}
window.Pitch = Pitch;
