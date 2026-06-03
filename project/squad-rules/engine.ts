/* =============================================================================
 * Squad Registration Rule Engine — ENGINE
 *
 * Pure, throw-free. validateSquad() reports every breach; it never raises.
 *
 * RULE MAP (see README for full text):
 *  R1  List A capped at 25.
 *  R2  Under-22 players register without limit on List B, OUTSIDE the 25.
 *  R3  Of the 25, ≥8 locally-trained = ≥4 club-trained + up to 4 association-trained.
 *  R4  Unused homegrown slots are NOT transferable →
 *        effectiveMax = freeSlots + min(clubTrained, 4) + min(associationTrained, 4), capped at listACap.
 *  R5  [DOMESTIC_SERIE_A] ≤2 NEW non-EU registrations per season; no total cap; no offload rule.
 *
 * INTERPRETATION NOTE for R3/R4 (documented, not invented):
 *  Because club-trained ⇒ association-trained, `associationTrained` is the count of ALL
 *  association-trained List-A players (club-trained players included). This reproduces the
 *  brief's worked example exactly: 1 club-trained + 3 further association-trained ⇒
 *  associationTrained = 4, effectiveMax = 17 + min(1,4) + min(4,4) = 22.
 * ========================================================================== */

import type {
  Player, PlayerFlags, DerivedPlayer, RegistrationList, HomegrownSlot,
  SquadRulesConfig, SquadValidationResult, CanRegisterResult, RuleViolation,
  RulesetVariant, Season, ISOCountry, ClubId,
} from "./types";

// --------------------------------------------------------------------------
// Config factory — every default is explicit and overridable.
// --------------------------------------------------------------------------
export function makeConfig(params: {
  variant: RulesetVariant;
  season: Season;
  clubId: ClubId;
  associationCountry: ISOCountry;
  clubAssociations?: Record<ClubId, ISOCountry>;
  overrides?: Partial<SquadRulesConfig>;
}): SquadRulesConfig {
  const base: SquadRulesConfig = {
    variant: params.variant,
    season: params.season,
    clubId: params.clubId,
    associationCountry: params.associationCountry,
    clubAssociations: params.clubAssociations ?? {},
    loansCountTowardTraining: true, // R-config: default true for the Italian list
    trainingSeasonsRequired: 3,     // 3 full seasons ≈ 36 months
    ageWindowMin: 15,
    ageWindowMax: 21,
    listBAgeOffset: 21,             // "under-22"; set 20 for a strict UEFA U21 List B
    listACap: 25,
    freeSlots: 17,
    maxClubTrainedCounted: 4,
    maxAssociationTrainedCounted: 4,
    maxNewNonEuPerSeason: 2,
    enforceNonEuRule: params.variant === "DOMESTIC_SERIE_A",
  };
  return { ...base, ...(params.overrides ?? {}) };
}

// --------------------------------------------------------------------------
// Small date / season helpers
// --------------------------------------------------------------------------
function seasonStartYear(season: Season): number {
  return parseInt(String(season).slice(0, 4), 10);
}
function birthYearOf(dob: string): number {
  return parseInt(String(dob).slice(0, 4), 10);
}

// --------------------------------------------------------------------------
// COMPUTED flags
// --------------------------------------------------------------------------
export function derivePlayerFlags(player: Player, config: SquadRulesConfig): PlayerFlags {
  // R2: under-22 = born on/after 1 Jan of (seasonStartYear - listBAgeOffset)
  const cutoffYear = seasonStartYear(config.season) - config.listBAgeOffset;
  const isUnder22 = new Date(player.dateOfBirth) >= new Date(Date.UTC(cutoffYear, 0, 1));

  const clubSeasons = new Set<Season>();
  const assocSeasons = new Set<Season>();

  for (const spell of player.developmentHistory) {
    // loan handling — surfaced via config, not hardcoded
    if (spell.onLoan && !config.loansCountTowardTraining) continue;

    // guard: only count spells inside the formative window (input is expected
    // pre-filtered to 15–21; this protects against dirty data).
    const ageThatSeason = seasonStartYear(spell.season) - birthYearOf(player.dateOfBirth);
    if (ageThatSeason < config.ageWindowMin || ageThatSeason > config.ageWindowMax) continue;

    const isOwnClub = spell.clubId === config.clubId;
    const inAssociation = isOwnClub || config.clubAssociations[spell.clubId] === config.associationCountry;

    if (isOwnClub) clubSeasons.add(spell.season);
    if (inAssociation) assocSeasons.add(spell.season); // club seasons ⇒ association seasons
  }

  const isClubTrained = clubSeasons.size >= config.trainingSeasonsRequired;
  // club-trained implies association-trained
  const isAssociationTrained = isClubTrained || assocSeasons.size >= config.trainingSeasonsRequired;

  return {
    isUnder22,
    isClubTrained,
    isAssociationTrained,
    isLocallyTrained: isClubTrained || isAssociationTrained,
    clubTrainedSeasons: clubSeasons.size,
    associationTrainedSeasons: assocSeasons.size,
  };
}

function assignList(flags: PlayerFlags, player: Player): RegistrationList {
  if (player.forceListA) return "A";     // opt-in: keep a young player on List A
  return flags.isUnder22 ? "B" : "A";    // R2: U22 default to List B
}

// --------------------------------------------------------------------------
// validateSquad — never throws; reports everything.
// --------------------------------------------------------------------------
export function validateSquad(squad: Player[], config: SquadRulesConfig): SquadValidationResult {
  const derived: DerivedPlayer[] = squad.map((player) => {
    const flags = derivePlayerFlags(player, config);
    return { player, flags, list: assignList(flags, player) };
  });

  const listA = derived.filter((d) => d.list === "A");
  const listB = derived.filter((d) => d.list === "B");

  const clubTrained = listA.filter((d) => d.flags.isClubTrained).length;
  const associationTrained = listA.filter((d) => d.flags.isAssociationTrained).length; // incl. club-trained

  const countedClub = Math.min(clubTrained, config.maxClubTrainedCounted);
  const countedAssociation = Math.min(associationTrained, config.maxAssociationTrainedCounted);

  // R4: forfeited (un-fillable) homegrown slots and the resulting usable size.
  const maxHomegrownSlots = config.maxClubTrainedCounted + config.maxAssociationTrainedCounted; // 8
  const forfeitedSlots = maxHomegrownSlots - (countedClub + countedAssociation);
  const effectiveMax = Math.min(config.listACap, config.freeSlots + countedClub + countedAssociation);

  const listASize = listA.length;
  const violations: RuleViolation[] = [];
  const warnings: string[] = [];

  // R1 / R4 — capacity
  if (listASize > effectiveMax) {
    violations.push({
      rule: "R4",
      code: "LIST_A_EXCEEDS_EFFECTIVE_MAX",
      message:
        `List A holds ${listASize} players but only ${effectiveMax} are usable ` +
        `(${listASize - effectiveMax} over). Forfeited homegrown slots cannot be backfilled.`,
      detail: { listASize, effectiveMax, forfeitedSlots },
    });
  }
  if (listASize > config.listACap) {
    violations.push({
      rule: "R1",
      code: "LIST_A_OVER_CAP",
      message: `List A has ${listASize} players; the hard cap is ${config.listACap}.`,
      detail: { listASize, listACap: config.listACap },
    });
  }

  // R5 — non-EU new-registration cap (DOMESTIC_SERIE_A only)
  const newNonEu = squad.filter((p) => p.registeredThisSeason && !p.euEligible);
  if (config.enforceNonEuRule && newNonEu.length > config.maxNewNonEuPerSeason) {
    violations.push({
      rule: "R5",
      code: "NON_EU_NEW_REG_CAP",
      message:
        `${newNonEu.length} new non-EU registrations this season; the cap is ` +
        `${config.maxNewNonEuPerSeason}.`,
      detail: { newNonEu: newNonEu.map((p) => p.id) },
    });
  }

  // Warnings (non-fatal)
  if (forfeitedSlots > 0) {
    warnings.push(
      `${forfeitedSlots} homegrown slot(s) forfeited — ${clubTrained}/${config.maxClubTrainedCounted} ` +
      `club-trained and ${associationTrained}/${config.maxAssociationTrainedCounted} association-trained ` +
      `counted. Effective max List A = ${effectiveMax}.`
    );
  }
  for (const d of derived) {
    for (const s of d.player.developmentHistory) {
      if (s.clubId !== config.clubId && config.clubAssociations[s.clubId] === undefined) {
        warnings.push(`Unknown association for club "${s.clubId}" (player ${d.player.name}); spell ignored for association-training.`);
        break;
      }
    }
  }

  return {
    valid: violations.length === 0,
    variant: config.variant,
    season: config.season,
    listACap: config.listACap,
    listASize,
    listBSize: listB.length,
    effectiveMax,
    forfeitedSlots,
    counts: {
      clubTrained,
      associationTrained,
      countedClub,
      countedAssociation,
      locallyTrainedCounted: countedClub + countedAssociation,
    },
    newNonEuRegistrations: newNonEu.length,
    violations,
    warnings,
    players: derived,
  };
}

// --------------------------------------------------------------------------
// canRegister — would `player` fit, and in which slot / why not?
// --------------------------------------------------------------------------
export function canRegister(
  player: Player,
  squad: Player[],
  config: SquadRulesConfig,
  opts?: { asNewRegistration?: boolean }
): CanRegisterResult {
  const flags = derivePlayerFlags(player, config);
  const attemptedList = assignList(flags, player);
  const reasons: string[] = [];
  const blockingRules: string[] = [];
  let slot: HomegrownSlot | null = null;

  // R5 — non-EU cap (applies to any new registration, List A or B)
  const isNew = opts?.asNewRegistration ?? player.registeredThisSeason ?? true;
  if (config.enforceNonEuRule && isNew && !player.euEligible) {
    const currentNewNonEu = squad.filter((p) => p.registeredThisSeason && !p.euEligible).length;
    if (currentNewNonEu + 1 > config.maxNewNonEuPerSeason) {
      blockingRules.push("R5");
      reasons.push(
        `Non-EU signing cap reached: ${currentNewNonEu} new non-EU already registered ` +
        `(max ${config.maxNewNonEuPerSeason}). Note: no existing non-EU player needs to be offloaded — the block is purely the per-season intake limit.`
      );
    }
  }

  if (attemptedList === "B") {
    // R2 — List B is uncapped; only the non-EU rule can block.
    slot = "LIST_B";
    reasons.push("Registers on List B (Under-22) — unlimited, sits outside the 25-man List A.");
  } else {
    // R1 / R4 — compare effective-max headroom WITH the player included
    // (a homegrown player can raise effectiveMax, i.e. bring their own slot).
    const before = validateSquad(squad, config);
    const after = validateSquad(squad.concat([player]), config);

    if (after.listASize <= after.effectiveMax) {
      if (flags.isClubTrained && before.counts.countedClub < config.maxClubTrainedCounted) slot = "CLUB_TRAINED";
      else if (flags.isAssociationTrained && before.counts.countedAssociation < config.maxAssociationTrainedCounted) slot = "ASSOCIATION_TRAINED";
      else slot = "FREE";
      reasons.push(`Fits List A in a ${slot} slot — List A would be ${after.listASize}/${after.effectiveMax}.`);
    } else {
      blockingRules.push("R4");
      reasons.push(
        `No List A slot: would be ${after.listASize} vs effective max ${after.effectiveMax}. ` +
        `Unused homegrown slots can't be backfilled with non-locally-trained players.`
      );
    }
  }

  return {
    allowed: blockingRules.length === 0,
    attemptedList,
    slot: blockingRules.length === 0 ? slot : null,
    flags,
    reasons,
    blockingRules,
  };
}
