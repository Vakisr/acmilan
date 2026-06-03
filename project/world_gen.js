/* ============================================================
   WORLD GENERATOR — fills out full club rosters across every
   major league so the Mercato holds THOUSANDS of players (≤€50M).
   Deterministic (seeded) so player IDs are stable across reloads:
   saved squads + share links keep working.
   Curated real stars (world.js / world2.js) are untouched; this
   layers squad-depth players on top, tagged {generated:true}.
   ============================================================ */
(function () {
  const M = window.MILAN;

  // ---- seeded RNG (mulberry32) ----
  function rng(seed){ return function(){
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };}
  const R = rng(20262027);
  const pick = (a) => a[Math.floor(R() * a.length)];
  const irange = (lo, hi) => lo + Math.floor(R() * (hi - lo + 1));
  const chance = (p) => R() < p;

  // ---- name banks by nationality ----
  const NB = {
    ITA:{f:["Lorenzo","Matteo","Alessandro","Francesco","Andrea","Davide","Giacomo","Riccardo","Simone","Federico","Tommaso","Nicolò","Gabriele","Marco","Luca","Pietro","Antonio","Filippo","Samuele","Edoardo"],l:["Rossi","Esposito","Romano","Colombo","Ricci","Marino","Greco","Bruno","Gallo","Conti","De Luca","Mancini","Costa","Giordano","Rizzo","Lombardi","Moretti","Barbieri","Fontana","Caputo","Ferraro","Bianchi","Galli","Martinelli","Vitale","Longo","Serra","Marchetti"]},
    ESP:{f:["Sergio","Pablo","Álvaro","Marcos","Hugo","Javier","Carlos","Diego","Adrián","Mario","Iker","Rubén","Dani","Iván","Jorge","Marc","Pau","Gerard","Bryan","Nico"],l:["García","Martínez","López","Sánchez","Fernández","Gómez","Díaz","Hernández","Ruiz","Moreno","Romero","Torres","Navarro","Gil","Serrano","Castro","Ortega","Ramos","Vázquez","Iglesias","Molina","Delgado","Cano","Herrera","Soler","Riquelme","Vega"]},
    ENG:{f:["Jack","Harry","Callum","Ollie","Mason","Tyler","Conor","Reece","Dominic","Marcus","Phil","Jude","Bukayo","Cole","Ezri","Levi","Morgan","Archie","Noni","Jarrad"],l:["Smith","Jones","Taylor","Brown","Wilson","Walker","White","Green","Hall","Wood","Clarke","Hughes","Baker","Cooper","Ward","Watson","Reid","Murphy","Foster","Gallagher","Maddison","Bowen","Palmer","Rice","Saka","Eze","Branthwaite","Gibbs"]},
    FRA:{f:["Lucas","Hugo","Théo","Maxence","Enzo","Nathan","Mathys","Bradley","Wesley","Yacine","Rayan","Warren","Boubacar","Khéphren","Manu","Eduardo","Bilal","Quentin","Loïc","Téji"],l:["Martin","Bernard","Dubois","Thomas","Robert","Richard","Durand","Moreau","Lefebvre","Girard","Fofana","Camara","Diallo","Koné","Mendy","Sissoko","Doucouré","Aouar","Cherki","Barcola","Lacazette","Thuram","Saliba","Konaté","Disasi","Badé","Cissé"]},
    GER:{f:["Leon","Florian","Maximilian","Jonas","Niklas","Felix","Lukas","Tim","Jamal","Kai","Robin","Pascal","Marco","David","Julian","Benjamin","Nico","Angelo","Deniz","Chris"],l:["Müller","Schmidt","Schneider","Fischer","Weber","Wagner","Becker","Hoffmann","Koch","Bauer","Richter","Klein","Wolf","Schröder","Neumann","Schwarz","Krüger","Hofmann","Werner","Brandt","Füllkrug","Andrich","Stiller","Groß","Gosens","Raum"]},
    BRA:{f:["Gabriel","Lucas","Matheus","João","Pedro","Rafael","Bruno","Vinícius","Rodrygo","Endrick","Wesley","Igor","Danilo","Éderson","Murillo","Marquinhos","Andreas","Savinho","Estêvão","Luiz"],l:["Silva","Santos","Oliveira","Souza","Pereira","Lima","Carlos","Ferreira","Alves","Ribeiro","Rodrigues","Gomes","Martins","Araújo","Barbosa","Costa","Rocha","Dias","Nascimento","Moraes","Paquetá","Casemiro","Antony","Bremer","Beraldo"]},
    ARG:{f:["Lautaro","Julián","Enzo","Alexis","Nicolás","Thiago","Santiago","Franco","Valentín","Gonzalo","Exequiel","Giovani","Cristian","Facundo","Alejandro","Lucas","Nahuel","Emiliano","Claudio","Ezequiel"],l:["González","Rodríguez","Fernández","López","Martínez","Pérez","Gómez","Álvarez","Romero","Sosa","Acuña","Paredes","Di María","Lo Celso","Mac Allister","Otamendi","Molina","Tagliafico","Palacios","Nico","Garnacho","Simeone","Almada","Foyth"]},
    POR:{f:["João","Diogo","Gonçalo","Rúben","Bruno","Pedro","Rafael","Nuno","Tiago","André","Vitinha","Francisco","Bernardo","Fábio","Renato","Otávio","Geovany","Samu","Hugo","Beto"],l:["Silva","Santos","Ferreira","Pereira","Oliveira","Costa","Rodrigues","Martins","Fernandes","Gonçalves","Neves","Dias","Leão","Cancelo","Dalot","Inácio","Trincão","Conceição","Ramos","Félix","Palhinha","Neto","Veiga"]},
    NED:{f:["Daan","Sem","Lars","Cody","Xavi","Quinten","Jorrel","Micky","Jurriën","Brian","Kenneth","Ryan","Wout","Donyell","Joey","Calvin","Bart","Tijjani","Mees","Million"],l:["de Jong","van Dijk","Bakker","Visser","Smit","Meijer","Mulder","de Vries","Bos","Vos","Timber","Geertruida","Hartman","Frimpong","Gakpo","Veerman","Reijnders","Malen","Simons","Brobbey","Stengs","Taylor"]},
    BEL:{f:["Jérémy","Romeo","Arthur","Charles","Amadou","Lois","Maxim","Aster","Zeno","Roméo","Dodi","Orel","Johan","Mike","Senne","Largie","Hugo","Matte","Cédric","Thibo"],l:["Doku","Lukebakio","Trossard","De Ketelaere","Onana","Vermeeren","De Cuyper","Vanaken","Theate","Debast","Openda","Mangala","Bakayoko","Lavia","Faes","Tielemans","Carrasco","Mechele","Castagne","Raskin"]},
    SRB:{f:["Dušan","Aleksandar","Strahinja","Nemanja","Filip","Sergej","Luka","Lazar","Veljko","Andrija","Marko","Nikola","Saša","Đorđe","Vanja","Mihailo","Stefan","Uroš","Bogdan","Ivan"],l:["Vlahović","Mitrović","Pavlović","Tadić","Kostić","Milinković","Jović","Samardžić","Birmančević","Gudelj","Lukić","Maksimović","Babić","Ilić","Veljković","Mladenović","Terzić","Ćirković","Gajić"]},
    CRO:{f:["Luka","Ivan","Marko","Mateo","Josip","Mario","Andrej","Borna","Nikola","Petar","Lovro","Martin","Domagoj","Joško","Bruno","Dominik","Filip","Toni","Marcelo","Kristijan"],l:["Modrić","Kovačić","Brozović","Perišić","Gvardiol","Sučić","Majer","Sosa","Pašalić","Vlašić","Baturina","Pongračić","Erlić","Stanišić","Juranović","Šutalo","Petković","Budimir","Ivanušec"]},
    SUI:{f:["Granit","Manuel","Ardon","Zeki","Dan","Ricardo","Remo","Breel","Fabian","Noah","Michel","Denis","Silvan","Cédric","Vincent","Edimilson","Renato","Ulisses","Leonidas","Aurèle"],l:["Xhaka","Akanji","Jashari","Amdouni","Ndoye","Rodríguez","Freuler","Embolo","Schär","Okafor","Aebischer","Zakaria","Widmer","Vargas","Sierro","Steffen","Stergiou","Garcia","Rieder","Sow"]},
    AUT:{f:["David","Marcel","Konrad","Nicolas","Patrick","Marko","Romano","Christoph","Philipp","Xaver","Maximilian","Stefan","Alexander","Florian","Leopold","Junior","Matthias","Kevin","Sasa","Michael"],l:["Alaba","Sabitzer","Laimer","Seiwald","Wimmer","Arnautović","Schmid","Baumgartner","Lienhart","Schlager","Posch","Danso","Grillitsch","Wöber","Querfeld","Adamu","Kainz","Stojković","Prass"]},
    DEN:{f:["Christian","Rasmus","Pierre","Joakim","Andreas","Jonas","Mikkel","Victor","Morten","Kasper","Mathias","Anders","Gustav","Jacob","Oliver","Mads","Thomas","Frederik","Alexander","Patrick"],l:["Eriksen","Højlund","Damsgaard","Mæhle","Skov","Lindstrøm","Dolberg","Nelsson","Hjulmand","Schmeichel","Jensen","Andersen","Bah","Wind","Kristensen","Isaksen","Bruun","Vestergaard","Olsen","Dorgu"]},
    SWE:{f:["Alexander","Viktor","Dejan","Emil","Anthony","Hugo","Lucas","Gabriel","Isak","Mattias","Ludwig","Daniel","Jens","Yasin","Williot","Benjamin","Jesper","Albin","Carl","Roony"],l:["Isak","Gyökeres","Kulusevski","Forsberg","Elanga","Larsson","Bergvall","Svensson","Nilsson","Svanberg","Augustinsson","Olsson","Cajuste","Ayari","Bernhardsson","Nygren","Karlström","Ekdal","Holm","Bárkroth"]},
    NOR:{f:["Erling","Martin","Alexander","Sander","Antonio","Andreas","Fredrik","Kristian","Patrick","Leo","Jørgen","Aron","Julian","Oscar","Birger","Morten","Ola","Mathias","Emil","Hugo"],l:["Haaland","Ødegaard","Sørloth","Berge","Nusa","Schjelderup","Aursnes","Bobb","Thorsby","Østigård","Strand Larsen","Dønnum","Ryerson","Bjørkan","Meling","Thorstvedt","Solet","Hauge","Ueland"]},
    POL:{f:["Robert","Piotr","Nicola","Sebastian","Jakub","Bartosz","Mateusz","Karol","Przemysław","Kamil","Krzysztof","Damian","Łukasz","Adam","Paweł","Michał","Jan","Tomasz","Filip","Dominik"],l:["Lewandowski","Zieliński","Zalewski","Szymański","Kiwior","Bednarek","Świderski","Świątek","Frankowski","Glik","Piątek","Cash","Skorupski","Kędziora","Buksa","Kamiński","Moder","Słisz","Urbański","Wieteska"]},
    TUR:{f:["Hakan","Arda","Kerem","Orkun","Kaan","Ferdi","Yusuf","Cengiz","Merih","Zeki","Kenan","Salih","Barış","Çağlar","İrfan","Abdülkerim","Yunus","Eren","Semih","Doğan"],l:["Çalhanoğlu","Güler","Aktürkoğlu","Kökçü","Ayhan","Kadıoğlu","Yazıcı","Ünder","Demiral","Çelik","Yıldız","Özcan","Yılmaz","Söyüncü","Can","Bardakcı","Akgün","Elmalı","Kılıçsoy","Demir"]},
    GRE:{f:["Konstantinos","Giorgos","Tasos","Dimitris","Anastasios","Vangelis","Petros","Christos","Fotis","Manolis","Sotiris","Stefanos","Lazaros","Andreas","Panagiotis","Vasilis","Nikos","Thomas","Giannis","Odysseas"],l:["Mavropanos","Pavlidis","Bakasetas","Masouras","Tsimikas","Giakoumakis","Siopis","Retsos","Koulierakis","Kourbelis","Douvikas","Limnios","Mandalos","Fountas","Konstantelias","Ioannidis","Vagiannidis","Baldock","Tzolis"]},
    NGA:{f:["Victor","Ademola","Samuel","Alex","Wilfred","Calvin","Joe","Kelechi","Taiwo","Frank","Moses","Raphael","Terem","Paul","Cyriel","Bright","Gift","Nathan","Bruno","Semi"],l:["Osimhen","Lookman","Chukwueze","Iwobi","Ndidi","Bassey","Aribo","Iheanacho","Awoniyi","Onyeka","Simon","Dele-Bashiru","Moffi","Onuachu","Dessers","Osayi-Samuel","Ejuke","Aina","Bonke"]},
    SEN:{f:["Sadio","Kalidou","Édouard","Ismaïla","Nicolas","Boulaye","Pape","Habib","Iliman","Krépin","Nampalys","Pathé","Lamine","Cheikhou","Abdou","Formose","Moussa","Idrissa","El Hadji","Cheikh"],l:["Mané","Koulibaly","Mendy","Sarr","Jackson","Dia","Gueye","Diallo","Ndiaye","Diatta","Ciss","Camara","Niakhaté","Kouyaté","Diop","Mendy","Sabaly","Faye","Gomis"]},
    MAR:{f:["Achraf","Hakim","Sofyan","Youssef","Brahim","Azzedine","Bilal","Amine","Noussair","Ilias","Romain","Abde","Eliesse","Bilal","Anass","Tarik","Walid","Selim","Yahya","Oussama"],l:["Hakimi","Ziyech","Amrabat","En-Nesyri","Díaz","Ounahi","El Khannouss","Adli","Mazraoui","Chair","Saïss","Ezzalzouli","Ben Seghir","Nakhli","Zalzouli","Tissoudali","Cheddira","Aguerd","Attiat-Allah"]},
    CIV:{f:["Sébastien","Wilfried","Franck","Nicolas","Ibrahim","Seko","Jean-Philippe","Odilon","Christian","Amad","Simon","Maxwel","Evan","Yan","Oumar","Hamed","Jérémie","Willy","Ousmane","Karim"],l:["Haller","Zaha","Kessié","Pépé","Sangaré","Fofana","Gbamin","Kossounou","Kouamé","Diallo","Adingra","Cornet","Ndicka","Boga","Diomandé","Konan","Aké","Bailly","Singo"]},
    GHA:{f:["Thomas","Mohammed","Iñaki","Jordan","Kamaldeen","Antoine","Daniel","Abdul","Majeed","Joseph","Tariq","Fatawu","Ernest","Salis","Kudus","Alidu","Baba","Edmund","Forson","Brandon"],l:["Partey","Kudus","Williams","Ayew","Sulemana","Semenyo","Amartey","Salisu","Ashimeru","Paintsil","Lamptey","Issahaku","Nuamah","Abdul Samed","Mensah","Seidu","Rahman","Addo","Owusu"]},
    CMR:{f:["André","Karl","Vincent","Bryan","Frank","Christian","Jean-Charles","Olivier","Georges","Martin","Nouhou","Collins","Carlos","Jérôme","Pierre","Enzo","Wilfried","Jérémy","Faris","Christopher"],l:["Onana","Toko Ekambi","Aboubakar","Mbeumo","Anguissa","Bassogog","Castelletto","Ngamaleu","Hongla","Wooh","Tolo","Fai","Baleba","Kunde","Magri","Nsame","Ondoua","Bryan","Moumi"]},
    JPN:{f:["Takefusa","Kaoru","Ritsu","Wataru","Daichi","Hidemasa","Junya","Ao","Takumi","Ayase","Reo","Koki","Daizen","Kyogo","Hiroki","Yukinari","Keito","Zion","Mao","Shogo"],l:["Kubo","Mitoma","Dōan","Endō","Kamada","Morita","Itō","Tanaka","Minamino","Ueda","Hatate","Machida","Maeda","Furuhashi","Itō","Sugawara","Nakamura","Suzuki","Hosoya","Taniguchi"]},
    KOR:{f:["Heung-min","Min-jae","Kang-in","Hee-chan","Woo-yeong","Seung-ho","In-beom","Jae-sung","Young-woo","Hyeon-gyu","Sang-ho","Tae-hwan","Ji-soo","Seol","Min-su","Gue-sung","Chan","Dong-gyeong","Hyun-woo","Jun-ho"],l:["Son","Kim","Lee","Hwang","Jeong","Paik","Hong","Cho","Yang","Oh","Kwon","Bae","Seol","Jung","Park","Ahn","Cho","Na","Joo","Han"]},
    USA:{f:["Christian","Weston","Tyler","Yunus","Gio","Tim","Folarin","Ricardo","Sergiño","Antonee","Brenden","Joe","Cameron","Malik","Johnny","Auston","Tanner","Luca","Caleb","Kevin"],l:["Pulisic","McKennie","Adams","Musah","Reyna","Weah","Balogun","Pepi","Dest","Robinson","Aaronson","Scally","Carter-Vickers","Tillman","Cardoso","Trusty","Tessmann","de la Torre","Wiley","Paredes"]},
    MEX:{f:["Santiago","Hirving","Edson","Raúl","Jorge","Luis","César","Orbelín","Uriel","Roberto","Johan","Jesús","Carlos","Diego","Israel","Erick","Julián","Gerardo","Alexis","Marcelo"],l:["Giménez","Lozano","Álvarez","Jiménez","Sánchez","Romo","Montes","Pineda","Antuna","Alvarado","Vásquez","Gallardo","Rodríguez","Lainez","Reyes","Sánchez","Quiñones","Arteaga","Vega","Flores"]},
    COL:{f:["Luis","James","Jhon","Rafael","Daniel","Juan","Yerry","Dávinson","Richard","Mateus","Jorge","Jefferson","Jhon","Kevin","Wilmar","Johan","Santiago","Yaser","Andrés","Carlos"],l:["Díaz","Rodríguez","Córdoba","Santos","Muñoz","Cuadrado","Mina","Sánchez","Ríos","Uribe","Carrascal","Lerma","Arias","Castaño","Barrios","Mojica","Borja","Asprilla","Borré","Cuesta"]},
    URU:{f:["Federico","Darwin","Ronald","Rodrigo","Manuel","Facundo","Nicolás","Maximiliano","Sebastián","Giorgian","Mathías","Agustín","Brian","José","Nahitan","Santiago","Luciano","Cristian","Emiliano","Diego"],l:["Valverde","Núñez","Araújo","Bentancur","Ugarte","Pellistri","De La Cruz","Olivera","Coates","De Arrascaeta","Viña","Canobbio","Rodríguez","Giménez","Nández","Bueno","Rodríguez","Olivera","Martínez"]},
  };
  const GENERIC = {f:["Adam","Daniel","David","Marko","Luka","Andrei","Stefan","Ivan","Nikola","Alex","Filip","Marius","Denis","Viktor","Tomas","Milan","Dario","Goran","Petar","Sandro"],l:["Novak","Horvat","Popescu","Ionescu","Kovač","Petrov","Ivanov","Nagy","Dvořák","Hansen","Berg","Lund","Nowak","Varga","Tóth","Lukić","Marić","Jovanović","Stankov","Babić"]};

  // Strip the most recognisable real-star surnames from every bank so generated
  // squad-depth players can't impersonate marquee names (the curated waves own those).
  // Built DYNAMICALLY from every curated real player already loaded, so ANY real name
  // in the data (Trincão, Reijnders, …) is automatically protected — plus a manual set.
  function lastWord(s){ var a=String(s).trim().split(" "); return a[a.length-1]; }
  var curated=[].concat(M.SQUAD||[], M.MARKET||[], M.RELEGATED||[], M.ACADEMY||[], (M.WORLD||[]).filter(function(p){return !p.generated;}));
  const FAMOUS = new Set(["Vinícius","Rodrygo","Endrick","Marquinhos","Bremer","Casemiro","Antony","Modrić","Kovačić","Brozović","Perišić","Gvardiol","Haaland","Ødegaard","Sørloth","Schjelderup","Lewandowski","Zieliński","Çalhanoğlu","Güler","Yıldız","Demiral","Osimhen","Lookman","Chukwueze","Iwobi","Mané","Koulibaly","Mendy","Jackson","Hakimi","Ziyech","Kudus","Williams","Kubo","Mitoma","Dōan","Endō","Kamada","Son","Kim","Pulisic","McKennie","Musah","Reyna","Balogun","Giménez","Lozano","Álvarez","Díaz","Rodríguez","Núñez","Araújo","Valverde","Bentancur","Doku","Trossard","De Ketelaere","Openda","Vlahović","Mitrović","Tadić","Milinković","Xhaka","Akanji","Jashari","Embolo","Alaba","Sabitzer","Laimer","Arnautović","Eriksen","Højlund","Damsgaard","Isak","Gyökeres","Kulusevski","Forsberg","Elanga","Bergvall","Trincão","Reijnders","Bakayoko","Thuram","Larsson","Barella","Bastoni","Kvaratskhelia"]);
  curated.forEach(function(p){ FAMOUS.add(lastWord(p.short)); FAMOUS.add(lastWord(p.name)); });
  Object.keys(NB).forEach(function(k){ NB[k].l = NB[k].l.filter(function(s){ return !FAMOUS.has(s); }); });

  function genName(nat){
    const b = NB[nat] || GENERIC;
    let name = pick(b.f) + " " + pick(b.l);
    return name;
  }
  function shortOf(name){
    const PART = ["de","di","van","von","el","le","da","dos","del","den","ten","ter"];
    const parts = name.split(" ");
    if (parts.length > 2) return parts.slice(-2).join(" ");
    if (parts.length === 2 && PART.indexOf(parts[0].toLowerCase()) !== -1) return name;
    return parts[parts.length - 1];
  }

  const RS = {
    GK:["GK"], CB:["CB","RCB","LCB"], RB:["RB","RWB"], LB:["LB","LWB"],
    DM:["DM","RCM","LCM","CM"], CM:["RCM","LCM","CM","DM"], AM:["RAM","LAM","RCM"],
    RW:["RW","RAM"], LW:["LW","LAM"], ST:["ST"],
  };
  const GRP = { GK:"GK", CB:"DF", RB:"DF", LB:"DF", DM:"MF", CM:"MF", AM:"MF", RW:"FW", LW:"FW", ST:"FW" };
  // roster template (positions per club) ~ 22 players
  const TEMPLATE = ["GK","GK","GK","CB","CB","CB","CB","RB","RB","LB","LB","DM","DM","CM","CM","CM","AM","AM","RW","LW","ST","ST","ST"];

  // ---- value model ----
  function valueFor(code, age){
    // Generated players are SQUAD DEPTH only — capped low so they never
    // impersonate a marquee signing. The expensive tier is all real curated names.
    let base = ({GK:3,CB:4,RB:4,LB:4,DM:5,CM:5,AM:6,RW:6,LW:6,ST:7})[code];
    const peak = 1 - Math.min(Math.abs(age - 25), 12) / 16;     // 0..1
    let v = base * (0.3 + peak * 1.0) * (0.4 + R() * 1.0);
    if (chance(0.03)) v *= 1.5;          // a rare standout
    if (age >= 33) v *= 0.4;
    if (age <= 19) v *= 0.6 + R()*0.6;
    v = Math.round(v);
    return Math.max(0, Math.min(18, v));  // hard cap €18M for generated depth
  }
  function ageFor(code){
    let a = irange(18, 35);
    if (code === "GK") a = irange(20, 37);
    return a;
  }

  // ---- clubs by league: [name, homeNat, [foreignNats...]] ----
  const F_EU  = ["FRA","ESP","BRA","ARG","POR","NED","BEL","CRO","SRB","SUI","DEN","SWE","NOR","NGA","SEN","MAR","JPN","GHA","CIV","POL","TUR","GRE","CMR","KOR","USA","COL","URU","AUT"];
  const LEAGUES = {
    "Serie A": { nat:"ITA", clubs:["Inter","Juventus","Napoli","Atalanta","Roma","Lazio","Fiorentina","Bologna","Torino","Udinese","Genoa","Como","Cagliari","Sassuolo","Parma","Lecce","Verona","Pisa"] },
    "Premier League": { nat:"ENG", clubs:["Arsenal","Liverpool","Man City","Man Utd","Chelsea","Tottenham","Newcastle","Aston Villa","Brighton","West Ham","Crystal Palace","Everton","Brentford","Fulham","Bournemouth","Wolves","Nottm Forest","Leeds","Sunderland","Burnley"] },
    "La Liga": { nat:"ESP", clubs:["Real Madrid","Barcelona","Atlético","Athletic Club","Real Sociedad","Real Betis","Villarreal","Valencia","Sevilla","Girona","Celta","Osasuna","Rayo Vallecano","Getafe","Mallorca","Espanyol","Alavés","Levante","Elche","Oviedo"] },
    "Bundesliga": { nat:"GER", clubs:["Bayern","Dortmund","Leverkusen","RB Leipzig","Stuttgart","Frankfurt","Wolfsburg","Freiburg","Hoffenheim","Mainz","Gladbach","Werder Bremen","Augsburg","Union Berlin","Bochum","Heidenheim","St. Pauli","Köln"] },
    "Ligue 1": { nat:"FRA", clubs:["PSG","Monaco","Marseille","Lille","Nice","Lyon","Lens","Rennes","Strasbourg","Brest","Toulouse","Reims","Nantes","Montpellier","Le Havre","Auxerre","Angers","Metz"] },
    "Eredivisie": { nat:"NED", clubs:["PSV","Feyenoord","Ajax","AZ Alkmaar","Twente","Utrecht","Sparta","Heerenveen","Go Ahead Eagles","NEC","Fortuna Sittard","Groningen"] },
    "Primeira Liga": { nat:"POR", clubs:["Benfica","Porto","Sporting CP","Braga","Vitória SC","Famalicão","Moreirense","Boavista","Estoril","Gil Vicente","Rio Ave","Casa Pia"] },
    "Süper Lig": { nat:"TUR", clubs:["Galatasaray","Fenerbahçe","Beşiktaş","Trabzonspor","Başakşehir","Adana Demirspor","Antalyaspor","Kasımpaşa","Konyaspor","Samsunspor"] },
    "Belgian Pro": { nat:"BEL", clubs:["Club Brugge","Anderlecht","Genk","Antwerp","Gent","Union SG","Standard Liège","Cercle Brugge","Mechelen","Charleroi"] },
    "Brasileirão": { nat:"BRA", clubs:["Flamengo","Palmeiras","Botafogo","São Paulo","Fluminense","Corinthians","Grêmio","Internacional","Atlético Mineiro","Cruzeiro","Vasco","Fortaleza","Bahia","Athletico-PR"] },
    "Liga Profesional": { nat:"ARG", clubs:["River Plate","Boca Juniors","Racing","Independiente","San Lorenzo","Estudiantes","Vélez","Talleres","Lanús","Rosario Central","Argentinos Jrs","Newell's"] },
    "Eredivisie 2 & misc": { nat:"NED", clubs:["Willem II","RKC Waalwijk","PEC Zwolle","Almere City"] },
    "Saudi Pro": { nat:"SEN", clubs:["Al Hilal","Al Nassr","Al Ittihad","Al Ahli","Al Ettifaq","Al Shabab"] },
    "MLS": { nat:"USA", clubs:["Inter Miami","LA Galaxy","LAFC","Atlanta Utd","Seattle","Cincinnati","Columbus","Philadelphia","NYCFC","St. Louis"] },
    "Liga MX": { nat:"MEX", clubs:["América","Monterrey","Tigres","Guadalajara","Cruz Azul","Pumas","Toluca","León","Pachuca","Santos Laguna"] },
    "Scottish Prem": { nat:"SCO", clubs:["Celtic","Rangers","Hearts","Aberdeen","Hibernian","Dundee Utd"] },
    "Championship": { nat:"ENG", clubs:["Leicester","Southampton","Ipswich","Sheffield Utd","West Brom","Middlesbrough","Coventry","Norwich","Watford","Stoke","Hull","Bristol City"] },
    "Other Europe": { nat:"CRO", clubs:["Dinamo Zagreb","Hajduk Split","Red Star","Partizan","Olympiacos","PAOK","AEK Athens","Panathinaikos","Slavia Praha","Sparta Praha","Salzburg","Sturm Graz","Young Boys","Basel","Ferencváros","Shakhtar","Dynamo Kyiv","Copenhagen","Midtjylland","Molde","Rosenborg","Malmö","Legia Warsaw","Raków"] },
  };

  // ---- generate ----
  const out = [];
  let gid = 0;
  function slug(s){ return s.toLowerCase().replace(/[^a-z0-9]+/g,""); }

  Object.keys(LEAGUES).forEach(lgName => {
    const lg = LEAGUES[lgName];
    lg.clubs.forEach(club => {
      const cslug = slug(club);
      const usedNums = new Set();
      TEMPLATE.forEach((code, i) => {
        // nationality: mostly home nation, some foreign
        let nat;
        const fr = R();
        if (lg.nat === "ENG" || lg.nat === "ITA" || lg.nat === "ESP" || lg.nat === "GER" || lg.nat === "FRA")
          nat = fr < 0.45 ? lg.nat : pick(F_EU);             // big leagues = cosmopolitan
        else
          nat = fr < 0.70 ? lg.nat : pick(F_EU);
        if (!NB[nat]) nat = lg.nat in NB ? lg.nat : "BRA";
        const age = ageFor(code);
        const name = genName(nat);
        let num; do { num = irange(1, 39); } while (usedNums.has(num)); usedNums.add(num);
        const value = valueFor(code, age);
        const tags = [];
        if (value === 0) tags.push("free");
        if (age <= 21) tags.push("prospect");
        out.push({
          id: "g" + cslug + (++gid),
          name, short: shortOf(name), num, nat, age,
          pos: GRP[code], roles: RS[code], value,
          from: club, tags, votes: 0, generated: true,
        });
      });
    });
  });

  M.WORLD = (M.WORLD || []).concat(out);
  M.WORLD_GEN_COUNT = out.length;
})();
