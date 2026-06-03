/* ============================================================
   WORLD POOL · WAVE 4 — frequently-searched real names that were
   missing, with realistic June-2026 valuations (stars priced where
   they'd actually sit, even above €50M). → M.WORLD
   row = [name, NAT, age, CODE, valueM, fromClub, tags?]
   ============================================================ */
(function () {
  const M = window.MILAN;
  const RS = {
    GK:["GK"], CB:["CB","RCB","LCB"], RB:["RB","RWB"], LB:["LB","LWB"],
    FB:["RB","LB","RWB","LWB"], DM:["DM","RCM","LCM","CM"], CM:["RCM","LCM","CM","DM"],
    AM:["RAM","LAM","RCM"], RW:["RW","RAM"], LW:["LW","LAM"], WF:["RW","LW","RAM","LAM"], ST:["ST"],
  };
  const GRP = { GK:"GK", CB:"DF", RB:"DF", LB:"DF", FB:"DF", DM:"MF", CM:"MF", AM:"MF", RW:"FW", LW:"FW", WF:"FW", ST:"FW" };
  const PART = ["de","di","van","von","el","le","lo","da","dos","del","den","ten","ter"];
  let id = 9000;
  function mk(r){
    const code = r[3];
    const parts = r[0].split(" ");
    let short;
    if (parts.length > 1 && PART.indexOf(parts[parts.length-2].toLowerCase()) !== -1) short = parts.slice(-2).join(" ");
    else short = parts[parts.length-1];
    return { id:"w"+(++id), name:r[0], short, num:((id%30)+1), nat:r[1], age:r[2],
      pos:GRP[code], roles:RS[code], value:r[4], from:r[5], tags:r[6]?r[6].split(","):[], votes:0 };
  }

  const rows = [
    // ===== Sporting / Portugal (Trincão & co) =====
    ["Francisco Trincão","POR",26,"RW",38,"Sporting CP"],
    ["Geovany Quenda","POR",18,"RW",40,"Sporting CP","prospect"],
    ["Conrad Harder","DEN",20,"ST",30,"Sporting CP","prospect"],
    ["Morten Hjulmand","DEN",26,"DM",45,"Sporting CP"],
    ["Ousmane Diomande","CIV",22,"CB",45,"Sporting CP","prospect"],
    ["Maximiliano Araújo","URU",25,"LW",24,"Sporting CP"],
    ["Hidemasa Morita","JPN",30,"DM",16,"Sporting CP"],
    ["Zeno Debast","BEL",22,"CB",28,"Sporting CP","prospect"],
    ["Rodrigo Mora","POR",18,"AM",40,"Porto","prospect"],
    ["Alberto Costa","POR",22,"RB",20,"Juventus","prospect"],
    // ===== Ex-Milan now elsewhere (fans search these) =====
    ["Tijjani Reijnders","NED",27,"CM",60,"Man City"],
    ["Théo Hernández","FRA",28,"LB",30,"Al-Hilal"],
    ["Malick Thiaw","GER",24,"CB",30,"Newcastle"],
    ["Sandro Tonali","ITA",26,"DM",55,"Newcastle"],
    ["Charles De Ketelaere","BEL",25,"AM",45,"Atalanta"],
    ["Pierre Kalulu","FRA",26,"CB",35,"Juventus"],
    ["Yacine Adli","FRA",25,"CM",14,"Fiorentina"],
    ["Divock Origi","BEL",31,"ST",3,"Free agent","free"],
    // ===== Premier League names commonly searched =====
    ["Marc Cucurella","ESP",27,"LB",45,"Chelsea"],
    ["Moisés Caicedo","ECU",24,"DM",80,"Chelsea"],
    ["Cole Palmer","ENG",24,"AM",90,"Chelsea"],
    ["Nicolas Jackson","SEN",24,"ST",45,"Chelsea"],
    ["Christopher Nkunku","FRA",28,"ST",36,"Chelsea"],
    ["Conor Gallagher","ENG",26,"CM",40,"Atlético"],
    ["Harry Maguire","ENG",33,"CB",10,"Man Utd"],
    ["Bruno Fernandes","POR",31,"AM",55,"Man Utd"],
    ["Marcus Rashford","ENG",28,"WF",45,"Aston Villa"],
    ["Jacob Murphy","ENG",31,"RW",14,"Newcastle"],
    ["Eberechi Eze","ENG",27,"AM",55,"Arsenal"],
    ["Ivan Toney","ENG",30,"ST",35,"Al-Ahli"],
    // ===== Serie A real names still missing =====
    ["Nicolò Barella","ITA",29,"CM",70,"Inter"],
    ["Lautaro Martínez","ARG",28,"ST",85,"Inter"],
    ["Alessandro Bastoni","ITA",27,"CB",65,"Inter"],
    ["Marcus Thuram","FRA",28,"ST",60,"Inter"],
    ["Khvicha Kvaratskhelia","GEO",25,"LW",80,"PSG"],
    ["Paulo Dybala","ARG",32,"AM",18,"Roma"],
    ["Evan Ferguson","IRL",21,"ST",30,"Roma","prospect"],
    ["Riccardo Calafiori","ITA",24,"CB",45,"Arsenal"],
    ["Giorgio Scalvini","ITA",22,"CB",40,"Atalanta","prospect"],
    ["Gianluca Scamacca","ITA",27,"ST",30,"Atalanta"],
    ["Nicolò Zaniolo","ITA",26,"AM",18,"Udinese"],
    // ===== Other realistic mid-tier targets =====
    ["Hugo Ekitike","FRA",24,"ST",50,"Liverpool"],
    ["Rasmus Højlund","DEN",23,"ST",40,"Man Utd"],
    ["Randal Kolo Muani","FRA",27,"ST",45,"PSG"],
    ["Youssoufa Moukoko","GER",21,"ST",20,"Nice","prospect"],
    ["Karim Adeyemi","GER",24,"WF",35,"Dortmund"],
    ["Johan Bakayoko","BEL",23,"RW",40,"RB Leipzig"],
    ["Hugo Larsson","SWE",21,"CM",45,"Frankfurt","prospect"],
    ["Arthur Vermeeren","BEL",21,"DM",30,"RB Leipzig","prospect"],
    ["Désiré Doué","FRA",21,"AM",60,"PSG","prospect"],
  ];

  M.WORLD = (M.WORLD || []).concat(rows.map(mk));
})();
