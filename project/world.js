/* ============================================================
   WORLD POOL — a deep bench of signable players, all ≤ €50M.
   Compact rows expanded at load. Best-effort June 2026 values.
   row = [name, NAT, age, CODE, valueM, fromClub, tags?]
   tags: "free" | "prospect" | "relegated" (comma-sep)
   ============================================================ */
(function () {
  const M = window.MILAN;
  const RS = {
    GK: ["GK"],
    CB: ["CB", "RCB", "LCB"],
    RB: ["RB", "RWB"],
    LB: ["LB", "LWB"],
    FB: ["RB", "LB", "RWB", "LWB"],
    DM: ["DM", "RCM", "LCM", "CM"],
    CM: ["RCM", "LCM", "CM", "DM"],
    AM: ["RAM", "LAM", "RCM"],
    RW: ["RW", "RAM"],
    LW: ["LW", "LAM"],
    WF: ["RW", "LW", "RAM", "LAM"],
    ST: ["ST"],
  };
  const GRP = { GK:"GK", CB:"DF", RB:"DF", LB:"DF", FB:"DF", DM:"MF", CM:"MF", AM:"MF", RW:"FW", LW:"FW", WF:"FW", ST:"FW" };
  const PART = ["de","di","van","von","el","le","lo","da","dos","del","den","ten","ter","da"];
  let id = 2000;
  function mk(r){
    const code = r[3];
    const parts = r[0].split(" ");
    let short;
    if (parts.length > 1 && PART.indexOf(parts[parts.length-2].toLowerCase()) !== -1)
      short = parts.slice(-2).join(" ");
    else short = parts[parts.length-1];
    return {
      id: "w" + (++id), name: r[0], short, num: ((id % 30) + 1),
      nat: r[1], age: r[2], pos: GRP[code], roles: RS[code],
      value: r[4], from: r[5], tags: r[6] ? r[6].split(",") : [], votes: 0,
    };
  }

  const rows = [
    // ---- Free agents ----
    ["Christian Eriksen","DEN",34,"CM",0,"Free agent","free"],
    ["Alexandre Lacazette","FRA",35,"ST",0,"Free agent","free"],
    ["Jordan Henderson","ENG",36,"CM",0,"Free agent","free"],
    ["Hector Bellerín","ESP",31,"RB",0,"Free agent","free"],
    ["Sergio Ramos","ESP",40,"CB",0,"Free agent","free"],
    ["Paul Pogba","FRA",33,"CM",0,"Free agent","free"],
    ["Jesse Lingard","ENG",33,"AM",0,"Free agent","free"],
    ["Aaron Ramsey","WAL",35,"CM",0,"Free agent","free"],
    ["Memphis Depay","NED",32,"ST",6,"Corinthians"],
    // ---- Premier League ----
    ["James Maddison","ENG",29,"AM",45,"Tottenham"],
    ["Dominic Solanke","ENG",28,"ST",40,"Tottenham"],
    ["Dejan Kulusevski","SWE",26,"AM",50,"Tottenham"],
    ["Kieran Trippier","ENG",35,"RB",6,"Newcastle"],
    ["Sven Botman","NED",26,"CB",40,"Newcastle"],
    ["Joelinton","BRA",29,"CM",40,"Newcastle"],
    ["Harvey Barnes","ENG",28,"LW",30,"Newcastle"],
    ["Lewis Hall","ENG",21,"LB",35,"Newcastle","prospect"],
    ["Ollie Watkins","ENG",30,"ST",50,"Aston Villa"],
    ["Youri Tielemans","BEL",28,"CM",35,"Aston Villa"],
    ["Emiliano Martínez","ARG",33,"GK",22,"Aston Villa"],
    ["Jacob Ramsey","ENG",24,"CM",28,"Aston Villa"],
    ["Morgan Gibbs-White","ENG",26,"AM",50,"Nottm Forest"],
    ["Anthony Elanga","SWE",24,"RW",45,"Nottm Forest"],
    ["Murillo","BRA",24,"CB",48,"Nottm Forest"],
    ["Marc Guéhi","ENG",25,"CB",50,"Crystal Palace"],
    ["Eberechi Eze","ENG",27,"AM",50,"Crystal Palace"],
    ["Adam Wharton","ENG",21,"DM",45,"Crystal Palace","prospect"],
    ["Dominic Calvert-Lewin","ENG",29,"ST",18,"Everton"],
    ["Jordan Pickford","ENG",32,"GK",22,"Everton"],
    ["Jarrad Branthwaite","ENG",23,"CB",50,"Everton","prospect"],
    ["Iliman Ndiaye","SEN",26,"WF",28,"Everton"],
    ["Yoane Wissa","COD",29,"ST",30,"Brentford"],
    ["Nathan Collins","IRL",24,"CB",35,"Brentford"],
    ["Wataru Endo","JPN",33,"DM",8,"Liverpool"],
    ["Harvey Elliott","ENG",23,"AM",35,"Liverpool","prospect"],
    ["Manuel Akanji","SUI",31,"CB",30,"Man City"],
    ["Kalvin Phillips","ENG",30,"DM",10,"Man City"],
    ["Jadon Sancho","ENG",26,"LW",28,"Man Utd"],
    ["Antony","BRA",26,"RW",25,"Man Utd"],
    ["Casemiro","BRA",34,"DM",10,"Man Utd"],
    ["Luke Shaw","ENG",30,"LB",20,"Man Utd"],
    ["Kobbie Mainoo","ENG",21,"CM",50,"Man Utd","prospect"],
    ["Raheem Sterling","ENG",31,"WF",20,"Chelsea"],
    ["Ben Chilwell","ENG",29,"LB",14,"Chelsea"],
    ["Armando Broja","ALB",24,"ST",14,"Chelsea"],
    ["Carney Chukwuemeka","ENG",22,"CM",25,"Chelsea","prospect"],
    // ---- Serie A ----
    ["Teun Koopmeiners","NED",28,"CM",35,"Juventus"],
    ["Federico Gatti","ITA",28,"CB",30,"Juventus"],
    ["Manuel Locatelli","ITA",28,"DM",28,"Juventus"],
    ["Andrea Cambiaso","ITA",26,"FB",45,"Juventus"],
    ["Weston McKennie","USA",28,"CM",25,"Juventus"],
    ["Hakan Çalhanoğlu","TUR",32,"DM",32,"Inter"],
    ["Davide Frattesi","ITA",26,"CM",40,"Inter"],
    ["Yann Bisseck","GER",25,"CB",40,"Inter"],
    ["Carlos Augusto","BRA",27,"FB",28,"Inter"],
    ["Stefan de Vrij","NED",34,"CB",6,"Inter"],
    ["Mattia Zaccagni","ITA",31,"LW",25,"Lazio"],
    ["Gustav Isaksen","DEN",25,"RW",22,"Lazio"],
    ["Boulaye Dia","SEN",29,"ST",16,"Lazio"],
    ["Lorenzo Pellegrini","ITA",29,"AM",25,"Roma"],
    ["Gianluca Mancini","ITA",30,"CB",25,"Roma"],
    ["Bryan Cristante","ITA",31,"DM",16,"Roma"],
    ["Stephan El Shaarawy","ITA",33,"WF",6,"Roma"],
    ["Scott McTominay","SCO",29,"CM",60,"Napoli"],
    ["Giovanni Di Lorenzo","ITA",32,"RB",18,"Napoli"],
    ["Amir Rrahmani","KOS",32,"CB",14,"Napoli"],
    ["Matteo Politano","ITA",33,"RW",12,"Napoli"],
    ["Charles De Ketelaere","BEL",25,"AM",45,"Atalanta"],
    ["Ademola Lookman","NGA",28,"WF",50,"Atalanta"],
    ["Éderson","BRA",27,"CM",50,"Atalanta"],
    ["Mateo Retegui","ITA",27,"ST",60,"Al-Qadsiah"],
    ["Marten de Roon","NED",35,"DM",4,"Atalanta"],
    ["Albert Gudmundsson","ISL",28,"AM",30,"Fiorentina"],
    ["David de Gea","ESP",35,"GK",4,"Fiorentina"],
    // ---- La Liga ----
    ["Mikel Oyarzabal","ESP",29,"ST",40,"Real Sociedad"],
    ["Takefusa Kubo","JPN",25,"RW",50,"Real Sociedad"],
    ["Brais Méndez","ESP",28,"AM",28,"Real Sociedad"],
    ["Antoine Griezmann","FRA",35,"AM",18,"Atlético"],
    ["Marcos Llorente","ESP",31,"CM",35,"Atlético"],
    ["Koke","ESP",34,"CM",6,"Atlético"],
    ["Samuel Lino","BRA",26,"LW",35,"Atlético"],
    ["Iñaki Williams","GHA",31,"RW",28,"Athletic Club"],
    ["Oihan Sancet","ESP",26,"AM",40,"Athletic Club"],
    ["Isco","ESP",34,"AM",8,"Real Betis"],
    ["Giovani Lo Celso","ARG",30,"AM",18,"Real Betis"],
    ["Johnny Cardoso","USA",24,"DM",30,"Real Betis"],
    ["Álvaro Morata","ESP",33,"ST",10,"Como"],
    ["Iago Aspas","ESP",38,"ST",3,"Celta"],
    ["Yangel Herrera","VEN",28,"CM",18,"Girona"],
    // ---- Bundesliga ----
    ["Julian Brandt","GER",30,"AM",30,"Dortmund"],
    ["Emre Can","GER",32,"DM",10,"Dortmund"],
    ["Nico Schlotterbeck","GER",26,"CB",50,"Dortmund"],
    ["Pascal Groß","GER",35,"CM",5,"Dortmund"],
    ["Leon Goretzka","GER",31,"CM",24,"Bayern"],
    ["Serge Gnabry","GER",30,"WF",30,"Bayern"],
    ["Granit Xhaka","SUI",33,"DM",16,"Leverkusen"],
    ["Robert Andrich","GER",31,"DM",18,"Leverkusen"],
    ["Jonas Hofmann","GER",33,"WF",6,"Leverkusen"],
    ["Deniz Undav","GER",29,"ST",35,"Stuttgart"],
    ["Angelo Stiller","GER",24,"DM",45,"Stuttgart","prospect"],
    ["Chris Führich","GER",28,"WF",20,"Stuttgart"],
    ["Maximilian Mittelstädt","GER",28,"LB",24,"Stuttgart"],
    ["Tim Kleindienst","GER",30,"ST",22,"Gladbach"],
    // ---- Ligue 1 ----
    ["Pierre-Emerick Aubameyang","GAB",36,"ST",6,"Marseille"],
    ["Mason Greenwood","ENG",24,"WF",45,"Marseille"],
    ["Quentin Merlin","FRA",24,"LB",18,"Marseille"],
    ["Takumi Minamino","JPN",31,"AM",12,"Monaco"],
    ["Vanderson","BRA",24,"RB",30,"Monaco"],
    ["Lamine Camara","SEN",22,"CM",35,"Monaco","prospect"],
    ["Gaëtan Laborde","FRA",32,"ST",10,"Nice"],
    ["Jonathan Clauss","FRA",33,"RB",10,"Nice"],
    // ---- Eredivisie / Primeira / others ----
    ["Luuk de Jong","NED",35,"ST",4,"PSV"],
    ["Ismael Saibari","MAR",25,"AM",35,"PSV"],
    ["Jerdy Schouten","NED",29,"DM",26,"PSV"],
    ["Calvin Stengs","NED",27,"AM",16,"Feyenoord"],
    ["Quilindschy Hartman","NED",24,"LB",18,"Feyenoord"],
    ["Brian Brobbey","NED",24,"ST",24,"Ajax"],
    ["Kenneth Taylor","NED",24,"CM",26,"Ajax"],
    ["Jorthy Mokio","BEL",18,"CM",20,"Ajax","prospect"],
    ["Vangelis Pavlidis","GRE",27,"ST",35,"Benfica"],
    ["Ángel Di María","ARG",38,"RW",4,"Benfica"],
    ["Orkun Kökçü","TUR",25,"CM",30,"Benfica"],
    ["Galeno","BRA",28,"LW",30,"Porto"],
    ["Pepê","BRA",28,"RW",30,"Porto"],
    ["Samu Aghehowa","ESP",21,"ST",50,"Porto","prospect"],
    ["Mehdi Taremi","IRN",33,"ST",10,"Olympiacos"],
  ];

  M.WORLD = rows.map(mk);
})();
