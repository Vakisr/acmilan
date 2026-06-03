/* =============================================================================
 * Squad Registration Rule Engine — TESTS  (vitest / jest compatible)
 *
 *   npm i -D vitest && npx vitest run     (or jest)
 *
 * The same cases run live in "Squad Registration Validator.html".
 * ========================================================================== */

import { describe, it, expect } from "vitest";
import { makeConfig, validateSquad, canRegister, derivePlayerFlags } from "./engine";
import type { Player, DevelopmentSpell, SquadRulesConfig } from "./types";

// --- fixtures --------------------------------------------------------------
const SEASON = "2026-27";
const CLUB = "milan";

const cfg = (overrides: Partial<SquadRulesConfig> = {}) =>
  makeConfig({
    variant: "DOMESTIC_SERIE_A",
    season: SEASON,
    clubId: CLUB,
    associationCountry: "IT",
    clubAssociations: { milan: "IT", inter: "IT", atalanta: "IT", roma: "IT", anderlecht: "BE", chelsea: "EN" },
    overrides,
  });

let _n = 0;
function makePlayer(p: Partial<Player> = {}): Player {
  _n += 1;
  return {
    id: p.id ?? "p" + _n,
    name: p.name ?? "Player " + _n,
    dateOfBirth: p.dateOfBirth ?? "1996-01-01", // senior by default
    nationality: p.nationality ?? "IT",
    euEligible: p.euEligible ?? true,
    developmentHistory: p.developmentHistory ?? [],
    currentClubId: p.currentClubId ?? CLUB,
    registeredThisSeason: p.registeredThisSeason,
    forceListA: p.forceListA,
  };
}

/** 3 formative seasons at a given club (ages 16–18 for a 1996-born senior is out of window,
 *  so we anchor history to seasons where the player was 15–21). */
function trainedAt(clubId: string, startYear = 2011, loan = false): DevelopmentSpell[] {
  return [0, 1, 2].map((i) => ({ clubId, season: `${startYear + i}-${String(startYear + i + 1).slice(2)}`, onLoan: loan }));
}

// A senior born 1996 is 15 in 2011-12 → history at 2011..2013 sits in the 15–21 window.
const clubTrained = () => makePlayer({ developmentHistory: trainedAt(CLUB), name: "ClubTrained" });
const assocTrained = (nat = "IT", eu = true) =>
  makePlayer({ developmentHistory: trainedAt("inter"), nationality: nat, euEligible: eu, name: "AssocTrained" });
const plain = (over: Partial<Player> = {}) => makePlayer({ name: "Plain", ...over });

function fill(n: number, factory: () => Player): Player[] {
  return Array.from({ length: n }, factory);
}

// ===========================================================================
describe("derived flags", () => {
  it("club-trained implies association-trained", () => {
    const f = derivePlayerFlags(clubTrained(), cfg());
    expect(f.isClubTrained).toBe(true);
    expect(f.isAssociationTrained).toBe(true);   // R: club ⇒ association
    expect(f.isLocallyTrained).toBe(true);
  });

  it("an association-trained foreign national counts as homegrown (nationality decoupled)", () => {
    // Belgian who did 3 seasons at Inter (Italy), never at Milan.
    const belgian = makePlayer({ nationality: "BE", euEligible: true, developmentHistory: trainedAt("inter"), name: "Belgian" });
    const f = derivePlayerFlags(belgian, cfg());
    expect(f.isClubTrained).toBe(false);
    expect(f.isAssociationTrained).toBe(true);
    expect(f.isLocallyTrained).toBe(true);
  });

  it("loan spells stop counting when loansCountTowardTraining = false", () => {
    const onLoan = makePlayer({ developmentHistory: trainedAt(CLUB, 2011, true), name: "Loanee" });
    expect(derivePlayerFlags(onLoan, cfg()).isClubTrained).toBe(true);                                  // default: loans count
    expect(derivePlayerFlags(onLoan, cfg({ loansCountTowardTraining: false })).isClubTrained).toBe(false);
  });

  it("U22 cutoff derives from the season (2026-27 ⇒ born ≥ 2005-01-01)", () => {
    expect(derivePlayerFlags(makePlayer({ dateOfBirth: "2005-03-01" }), cfg()).isUnder22).toBe(true);
    expect(derivePlayerFlags(makePlayer({ dateOfBirth: "2004-12-31" }), cfg()).isUnder22).toBe(false);
  });
});

// ===========================================================================
describe("validateSquad — capacity & homegrown (R1, R3, R4)", () => {
  it("a full, legal 25-man list is valid with effectiveMax 25", () => {
    const squad = [
      ...fill(4, clubTrained),       // 4 club-trained
      ...fill(4, () => assocTrained()), // 4 association-trained
      ...fill(17, () => plain()),    // 17 free
    ];
    const r = validateSquad(squad, cfg());
    expect(r.listASize).toBe(25);
    expect(r.effectiveMax).toBe(25);
    expect(r.forfeitedSlots).toBe(0);
    expect(r.valid).toBe(true);
  });

  it("THE MILAN CASE — 1 club-trained + 3 association-trained ⇒ effectiveMax 22, forfeited 3", () => {
    const squad = [
      ...fill(1, clubTrained),
      ...fill(3, () => assocTrained()),
      ...fill(21, () => plain()),    // 25 total on List A
    ];
    const r = validateSquad(squad, cfg());
    expect(r.counts.clubTrained).toBe(1);
    expect(r.counts.associationTrained).toBe(4); // 1 club + 3 assoc (club ⇒ assoc)
    expect(r.effectiveMax).toBe(22);             // 17 + min(1,4) + min(4,4)
    expect(r.forfeitedSlots).toBe(3);
    expect(r.valid).toBe(false);                 // 25 > 22
    expect(r.violations.some((v) => v.code === "LIST_A_EXCEEDS_EFFECTIVE_MAX")).toBe(true);
  });

  it("the same weak-homegrown club is valid once it trims List A to 22", () => {
    const squad = [
      ...fill(1, clubTrained),
      ...fill(3, () => assocTrained()),
      ...fill(18, () => plain()),    // 22 total
    ];
    const r = validateSquad(squad, cfg());
    expect(r.listASize).toBe(22);
    expect(r.effectiveMax).toBe(22);
    expect(r.valid).toBe(true);
  });

  it("forfeited slots are NOT backfillable by adding a non-homegrown player", () => {
    const squad = [
      ...fill(1, clubTrained),
      ...fill(3, () => assocTrained()),
      ...fill(18, () => plain()),    // 22, at effectiveMax
    ];
    const res = canRegister(plain(), squad, cfg());
    expect(res.allowed).toBe(false);
    expect(res.blockingRules).toContain("R4");
  });
});

// ===========================================================================
describe("Under-22 / List B (R2)", () => {
  const fullLegal = () => [
    ...fill(4, clubTrained),
    ...fill(4, () => assocTrained()),
    ...fill(17, () => plain()),
  ];

  it("a U22 player does NOT consume a List A slot", () => {
    const squad = [...fullLegal(), makePlayer({ dateOfBirth: "2006-05-01", name: "Kid" })];
    const r = validateSquad(squad, cfg());
    expect(r.listASize).toBe(25);  // unchanged
    expect(r.listBSize).toBe(1);
    expect(r.valid).toBe(true);
  });

  it("a U22 can still register even with List A already full", () => {
    const res = canRegister(makePlayer({ dateOfBirth: "2006-05-01" }), fullLegal(), cfg());
    expect(res.allowed).toBe(true);
    expect(res.attemptedList).toBe("B");
    expect(res.slot).toBe("LIST_B");
  });

  it("forceListA puts a young player onto List A (and he can be club-trained homegrown)", () => {
    const youngClubTrained = makePlayer({
      dateOfBirth: "2006-01-01",
      forceListA: true,
      developmentHistory: [0, 1, 2].map((i) => ({ clubId: CLUB, season: `${2021 + i}-${String(2022 + i).slice(2)}`, onLoan: false })),
    });
    const r = validateSquad([youngClubTrained], cfg());
    expect(r.listASize).toBe(1);
    expect(r.players[0].flags.isClubTrained).toBe(true);
  });
});

// ===========================================================================
describe("canRegister slot routing", () => {
  it("a homegrown signing brings their own slot (raises effectiveMax)", () => {
    // 22 players, weak homegrown, at effectiveMax 22 — a club-trained signing should still fit.
    const squad = [
      ...fill(1, clubTrained),
      ...fill(3, () => assocTrained()),
      ...fill(18, () => plain()),
    ];
    const res = canRegister(clubTrained(), squad, cfg());
    expect(res.allowed).toBe(true);
    expect(res.slot).toBe("CLUB_TRAINED");
  });
});

// ===========================================================================
describe("Non-EU cap (R5, DOMESTIC_SERIE_A)", () => {
  const base = () => [
    makePlayer({ name: "NonEU-1", euEligible: false, registeredThisSeason: true }),
    makePlayer({ name: "NonEU-2", euEligible: false, registeredThisSeason: true }),
  ];

  it("blocks a 3rd NEW non-EU registration", () => {
    const res = canRegister(
      makePlayer({ euEligible: false, registeredThisSeason: true }),
      base(),
      cfg()
    );
    expect(res.allowed).toBe(false);
    expect(res.blockingRules).toContain("R5");
  });

  it("allows a NEW EU player regardless of the non-EU count", () => {
    const res = canRegister(makePlayer({ euEligible: true, registeredThisSeason: true }), base(), cfg());
    expect(res.allowed).toBe(true);
  });

  it("does not require offloading an existing non-EU player (intake-only limit)", () => {
    // squad already holds non-EU players from prior seasons (not new) — still fine to sign 2 new.
    const withOld = [
      makePlayer({ euEligible: false, registeredThisSeason: false }),
      makePlayer({ euEligible: false, registeredThisSeason: false }),
    ];
    const res = canRegister(makePlayer({ euEligible: false, registeredThisSeason: true }), withOld, cfg());
    expect(res.allowed).toBe(true); // 1 new non-EU ≤ cap 2
  });

  it("UEFA_LIST_A variant ignores the non-EU rule", () => {
    const uefa = cfg({ variant: "UEFA_LIST_A", enforceNonEuRule: false });
    const res = canRegister(
      makePlayer({ euEligible: false, registeredThisSeason: true }),
      base(),
      uefa
    );
    expect(res.allowed).toBe(true);
  });
});
