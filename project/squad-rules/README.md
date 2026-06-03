# Squad Registration Rule Engine

A pure, throw-free rule engine for football squad registration. Variants:
**`DOMESTIC_SERIE_A`** (default) and **`UEFA_LIST_A`**. Age cutoff season is configurable
(project default **2026-27**).

## Files
| File | Role |
|---|---|
| `types.ts` | Domain model, computed-flag types, result types |
| `engine.ts` | `makeConfig`, `derivePlayerFlags`, `validateSquad`, `canRegister` (canonical) |
| `engine.test.ts` | Vitest/Jest suite (the Milan forfeit case, U22, non-EU cap, …) |
| `engine.browser.js` | Plain-JS mirror exposed as `window.SquadRules` for the demo page |
| `../Squad Registration Validator.html` | Live runner — runs the same cases + an interactive inspector |

## Run
```bash
npm i -D vitest
npx vitest run          # or: npx jest
```
No-build option: open `Squad Registration Validator.html` — it runs the suite in the browser.

## Quick use
```ts
import { makeConfig, validateSquad, canRegister } from "./engine";

const config = makeConfig({
  variant: "DOMESTIC_SERIE_A",
  season: "2026-27",
  clubId: "milan",
  associationCountry: "IT",
  clubAssociations: { milan: "IT", inter: "IT", anderlecht: "BE" },
  // overrides: { loansCountTowardTraining: false }
});

const result = validateSquad(squad, config);
// → { valid, listASize, effectiveMax, forfeitedSlots, violations[], warnings[], ... }

const verdict = canRegister(player, squad, config);
// → { allowed, attemptedList, slot, reasons[], blockingRules[] }
```

## The five rules
- **R1** List A capped at **25**.
- **R2** Under-22 players register **without limit** on **List B**, *outside* the 25. They never consume a List A slot. (Opt a young player back onto List A with `player.forceListA`.)
- **R3** Of the 25, **≥8 locally-trained** = **≥4 club-trained** + **up to 4 association-trained**.
- **R4** **Unused homegrown slots are not transferable.** `effectiveMax = freeSlots + min(clubTrained, 4) + min(associationTrained, 4)`, capped at `listACap`. The engine exposes `effectiveMax` and `forfeitedSlots`; it does not merely pass/fail.
- **R5** *(DOMESTIC_SERIE_A only)* **≤2 new non-EU registrations per season**. No cap on total non-EU held; **no offload requirement** (the old replacement rule was dropped in 2024). EU-passport holders unrestricted; post-Brexit English players are non-EU unless they hold a 2nd EU passport — set via `player.euEligible`, never inferred from `nationality`.

## Interpretation notes (documented, not invented)
- **`associationTrained` includes club-trained players** (since club-trained ⇒ association-trained). This reproduces the brief's worked example exactly: *1 club-trained + 3 further association-trained ⇒ associationTrained = 4 ⇒ effectiveMax = 17 + min(1,4) + min(4,4) = **22***.
- **Homegrown ⟂ nationality.** A Belgian who spent 3 formative seasons at an Italian club is association-trained (homegrown) and still a foreign national. The two axes never cross.
- **EU status is its own axis**, provided per player; the engine never reads it from nationality.

## Config flags (defaults & rationale)
| Flag | Default | Note |
|---|---|---|
| `loansCountTowardTraining` | `true` | True for the Italian list. Set `false` to exclude loan spells. |
| `trainingSeasonsRequired` | `3` | 3 full seasons ≈ 36 months. |
| `ageWindowMin` / `ageWindowMax` | `15` / `21` | Formative window (inclusive). |
| `listBAgeOffset` | `21` | "Under-22". Set `20` for a strict UEFA U21 List B. |
| `listACap` / `freeSlots` | `25` / `17` | Senior list size and the non-homegrown allowance. |
| `maxClubTrainedCounted` / `maxAssociationTrainedCounted` | `4` / `4` | The 4+4 homegrown structure. |
| `maxNewNonEuPerSeason` | `2` | R5 intake cap. |
| `enforceNonEuRule` | `variant === "DOMESTIC_SERIE_A"` | UEFA list ignores it. |

## Ambiguities surfaced as config (not guessed)
- **Loan treatment** → `loansCountTowardTraining` (default `true`).
- **U21 vs U22 List B** → `listBAgeOffset` (default `21`).
- **36 months vs 3 seasons** → modelled as whole seasons via `trainingSeasonsRequired`.
- **Mid-season list re-submission** is out of scope: `validateSquad` validates a single submitted list; call it again on the amended list.
