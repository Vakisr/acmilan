/* MERCATO (all players · search · filters) + SQUAD (roster, sell) */

const BUYPOOL = [...M.MARKET, ...M.WORLD, ...M.RELEGATED, ...M.ACADEMY];
const CATS = [
  { k:"all", label:"All" },
  { k:"target", label:"Targets" },
  { k:"relegated", label:"Relegation" },
  { k:"prospect", label:"Prospects" },
  { k:"free", label:"Free agents" },
  { k:"academy", label:"Academy" },
];
const POSF = [
  { k:"ALL", label:"All",  roles:null },
  { k:"GK",  label:"GK",   roles:["GK"] },
  { k:"CB",  label:"CB",   roles:["CB","RCB","LCB"] },
  { k:"FB",  label:"FB",   roles:["RB","LB","RWB","LWB"] },
  { k:"DM",  label:"DM",   roles:["DM"] },
  { k:"CM",  label:"CM",   roles:["CM","RCM","LCM"] },
  { k:"AM",  label:"AM",   roles:["RAM","LAM"] },
  { k:"LW",  label:"LW",   roles:["LW"] },
  { k:"RW",  label:"RW",   roles:["RW"] },
  { k:"ST",  label:"ST",   roles:["ST"] },
];
const POS_ROLES = Object.fromEntries(POSF.map(f => [f.k, f.roles]));

function Mercato(props){
  const { ownedIds, budget, onBuy, onPromote, squadSize } = props;
  const [cat, setCat] = React.useState("all");
  const [pos, setPos] = React.useState("ALL");
  const [q, setQ] = React.useState("");
  const [limit, setLimit] = React.useState(60);
  const has = (id) => ownedIds.includes(id);

  let list = BUYPOOL.filter(p => !has(p.id));
  if (cat === "target") list = list.filter(p => M.MARKET.indexOf(p) !== -1);
  else if (cat !== "all") list = list.filter(p => p.tags.indexOf(cat) !== -1);
  if (pos !== "ALL") {
    const rs = POS_ROLES[pos];
    list = list.filter(p => p.roles.some(r => rs.indexOf(r) !== -1));
  }
  const qq = q.trim().toLowerCase();
  if (qq) list = list.filter(p => (p.name + " " + (p.from||"") + " " + p.nat).toLowerCase().indexOf(qq) !== -1);
  list = list.slice().sort((a,b)=> b.value - a.value || a.short.localeCompare(b.short));

  React.useEffect(() => { setLimit(60); }, [cat, pos, q]);
  const shown = list.slice(0, limit);

  const act = (p) => p.tags.indexOf("academy") !== -1 ? onPromote(p) : onBuy(p);

  return (
    <div className="scroll" id="view-mercato">
      <div className="mkt-head">
        <div className="kicker">Summer 2026 · live market valuations</div>
        <h1>THE MERCATO</h1>
      </div>

      <div className="squadbar">
        <div className={"cell " + (budget<0?"warn":"good")}>
          <div className="n">€{budget}M</div><div className="l">War chest</div>
        </div>
        <div className={"cell " + (squadSize>=28?"good":"")}>
          <div className="n">{squadSize}</div><div className="l">Squad / 28</div>
        </div>
        <div className="cell">
          <div className="n">{30-squadSize<0?0:30-squadSize}</div><div className="l">Slots left</div>
        </div>
      </div>

      <div className="searchbar">
        <Icon.search/>
        <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search players, clubs, nations…" />
      </div>

      <div className="filters">
        {CATS.map(c => (
          <button key={c.k} className={"chip" + (cat===c.k?" on":"")} onClick={()=>setCat(c.k)}>{c.label}</button>
        ))}
      </div>
      <div className="filters" style={{paddingTop:6}}>
        {POSF.map(f => (
          <button key={f.k} className={"chip" + (pos===f.k?" on":"")} onClick={()=>setPos(f.k)}>{f.label}</button>
        ))}
      </div>

      <div className="section-lab">{fmtNum(list.length)} player{list.length!==1?"s":""} available</div>
      <div className="mlist">
        {shown.map(p => {
          const academy = p.tags.indexOf("academy") !== -1;
          const tooDear = !academy && p.value > budget;
          return (
            <PlayerRow key={p.id} p={p} votesOf={()=>0}
              sub={<span>{p.nat} · {p.age} · {p.from}</span>}
              right={
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <div className="pval"><div className="v">{fmtMoney(p.value)}</div><div className="vl">{academy?"promote":"value"}</div></div>
                  <button className={"btn " + (academy?"btn-promote":"btn-buy")} disabled={tooDear} onClick={()=>act(p)}>
                    {tooDear ? "—" : (academy ? "Promote" : (p.value===0?"Free":"Sign"))}
                  </button>
                </div>
              }/>
          );
        })}
        {list.length===0 && <div className="empty-note">No players match these filters.</div>}
      </div>
      {limit < list.length && (
        <div style={{padding:"6px 14px 0"}}>
          <button className="btn btn-ghost full btn-big" onClick={()=>setLimit(l=>l+120)}>
            Load more · {fmtNum(list.length - limit)} more
          </button>
        </div>
      )}
      <div className="spacer"/>
    </div>
  );
}

/* ---------------- SQUAD ---------------- */
function SquadView(props){
  const { owned, budget, votesOf, onSell, squadValue, onReset } = props;
  const order = ["GK","DF","MF","FW"];
  const byGroup = {};
  order.forEach(g => byGroup[g] = owned.filter(p=>p.pos===g));

  // --- salary cap ---
  const totalWages = Math.round(owned.reduce((s,p)=> s + wageOf(p), 0) * 10) / 10;
  const cap = M.WAGE_CAP;
  const overWage = Math.round((totalWages - cap) * 10) / 10;
  const capPct = Math.min(140, Math.round(totalWages / cap * 100));

  // --- lightweight Serie A registration readout (rules baked into the squad) ---
  const listB = owned.filter(p => p.age <= 21);          // U22 → List B, outside the 25
  const listA = owned.filter(p => p.age > 21);
  const clubTrained = listA.filter(p => p.hg === "club").length;
  const assocTrained = listA.filter(p => p.hg === "club" || p.hg === "assoc").length;
  const effectiveMax = Math.min(25, 17 + Math.min(clubTrained,4) + Math.min(assocTrained,4));
  const nonEu = owned.filter(p => !isEu(p)).length;
  const overList = listA.length - effectiveMax;

  return (
    <div className="scroll" id="view-squad">
      <div className="mkt-head">
        <div className="squad-head-row">
          <div>
            <div className="kicker">Your rebuild · sell to free up cash</div>
            <h1>THE SQUAD</h1>
          </div>
          <button className="resetbtn" onClick={onReset} title="Reset to Milan's real squad">
            <Icon.reset/> Reset
          </button>
        </div>
      </div>

      <div className="squadbar">
        <div className="cell"><div className="n">{owned.length}</div><div className="l">Players</div></div>
        <div className={"cell " + (budget<0?"warn":"good")}><div className="n">€{budget}M</div><div className="l">War chest</div></div>
        <div className="cell"><div className="n">€{squadValue}M</div><div className="l">Squad value</div></div>
      </div>

      {/* salary cap */}
      <div className="capwrap">
        <div className="caphead">
          <span className="capttl">Wage bill</span>
          <span className={"capval" + (overWage>0?" over":"")}>€{totalWages}M <small>/ €{cap}M cap</small></span>
        </div>
        <div className="capbar"><i className={overWage>0?"over":""} style={{width:capPct+"%"}}/></div>
        {overWage > 0
          ? <div className="capflag bad">⚠ Over the wage cap by <b>€{overWage}M/yr</b> — trim the bill before registering.</div>
          : <div className="capflag ok">€{Math.round((cap-totalWages)*10)/10}M of headroom under the cap.</div>}
      </div>

      {/* registration legality (Serie A List) */}
      <div className="legal">
        <div className="legal-cell">
          <div className={"lc-n " + (overList>0?"warn":"good")}>{listA.length}<small>/{effectiveMax}</small></div>
          <div className="lc-l">List A / max</div>
        </div>
        <div className="legal-cell">
          <div className={"lc-n " + (clubTrained<4?"warn":"good")}>{clubTrained}<small>/4</small></div>
          <div className="lc-l">Club-trained</div>
        </div>
        <div className="legal-cell">
          <div className={"lc-n " + (assocTrained<8?"warn":"good")}>{assocTrained}<small>/8</small></div>
          <div className="lc-l">Homegrown</div>
        </div>
        <div className="legal-cell">
          <div className="lc-n">{nonEu}</div>
          <div className="lc-l">Non-EU</div>
        </div>
        <div className="legal-cell">
          <div className="lc-n">{listB.length}</div>
          <div className="lc-l">U22 · List B</div>
        </div>
      </div>
      {overList > 0 && (
        <div className="capflag bad" style={{margin:"0 14px 4px"}}>⚠ List A is {overList} over the effective max — too few homegrown players to register {listA.length}.</div>
      )}

      {order.map(g => byGroup[g].length ? (
        <React.Fragment key={g}>
          <div className="section-lab">{M.POS_GROUP[g]} · {byGroup[g].length}</div>
          <div className="mlist">
            {byGroup[g].slice().sort((a,b)=>votesOf(b)-votesOf(a)).map(p => (
              <PlayerRow key={p.id} p={p} votesOf={votesOf}
                sub={<span>{p.nat}{!isEu(p) && <span className="noneu"> · non-EU</span>}{p.hg==="club" && <span className="hgtag"> · club-trained</span>}{p.hg==="assoc" && <span className="hgtag"> · IT-trained</span>} · €{wageOf(p)}M/yr</span>}
                right={
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <div className="pval"><div className="v">{fmtMoney(p.value)}</div><div className="vl">sell for</div></div>
                    <button className="btn btn-sell" onClick={()=>onSell(p)}>Sell</button>
                  </div>
                }/>
            ))}
          </div>
        </React.Fragment>
      ) : null)}
      <div className="spacer"/>
    </div>
  );
}

Object.assign(window, { Mercato, SquadView });
