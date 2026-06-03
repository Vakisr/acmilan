/* =============================================================================
 * Squad Registration Rule Engine — TYPES
 * Variant: DOMESTIC_SERIE_A | UEFA_LIST_A
 *
 * Design axioms:
 *  - "homegrown" status (club-/association-trained) and nationality/EU status are
 *    INDEPENDENT axes. Never derive one from the other.
 *  - Flags marked "computed" are derived by the engine, never trusted as input.
 * ========================================================================== */

export type ISOCountry = string;          // ISO 3166 alpha-2 / alpha-3, opaque to the engine
export type ClubId = string;
/** Season label, start year first, e.g. "2026-27". The age cutoff derives from this. */
export type Season = string;

export type RulesetVariant = "DOMESTIC_SERIE_A" | "UEFA_LIST_A";

/** One registration spell during the formative window (ages 15–21 inclusive). */
export interface DevelopmentSpell {
  clubId: ClubId;
  season: Season;        // season the spell occurred in
  onLoan: boolean;       // whether the player was on loan for that spell
}

/** Raw player input. `euEligible` is provided, NOT inferred from nationality. */
export interface Player {
  id: string;
  name: string;
  dateOfBirth: string;          // ISO "YYYY-MM-DD"
  nationality: ISOCountry;      // independent of homegrown & EU status
  /**
   * EU-list eligibility (holds an EU passport / association free-movement right).
   * Post-Brexit English players are non-EU (false) UNLESS they hold a 2nd EU passport.
   * The caller sets this; the engine never guesses it from `nationality`.
   */
  euEligible: boolean;
  developmentHistory: DevelopmentSpell[];   // spells while aged 15–21 inclusive
  currentClubId: ClubId;

  /** True if THIS registration is new in the season being validated (drives the non-EU cap). */
  registeredThisSeason?: boolean;
  /** Force a U22-eligible player onto List A instead of List B (opt-in; default routes U22 → B). */
  forceListA?: boolean;
}

/** Flags the engine COMPUTES per player. Do not pass these in. */
export interface PlayerFlags {
  isUnder22: boolean;
  isClubTrained: boolean;
  isAssociationTrained: boolean;   // club-trained implies association-trained
  isLocallyTrained: boolean;       // club OR association trained
  clubTrainedSeasons: number;
  associationTrainedSeasons: number;
}

export type RegistrationList = "A" | "B";
export type HomegrownSlot = "CLUB_TRAINED" | "ASSOCIATION_TRAINED" | "FREE" | "LIST_B";

export interface DerivedPlayer {
  player: Player;
  flags: PlayerFlags;
  list: RegistrationList;
}

export interface RuleViolation {
  rule: string;        // e.g. "R1", "R4", "R5"
  code: string;        // machine code, e.g. "LIST_A_EXCEEDS_EFFECTIVE_MAX"
  message: string;     // human-readable
  detail?: Record<string, unknown>;
}

export interface SquadValidationResult {
  valid: boolean;
  variant: RulesetVariant;
  season: Season;
  listACap: number;
  listASize: number;
  listBSize: number;
  /** Usable List A size after un-fillable homegrown slots are forfeited (R4). */
  effectiveMax: number;
  /** How many of the 8 homegrown slots are forfeited (cannot be backfilled). */
  forfeitedSlots: number;
  counts: {
    clubTrained: number;
    associationTrained: number;     // includes club-trained players
    countedClub: number;            // min(clubTrained, cap)
    countedAssociation: number;     // min(associationTrained, cap)
    locallyTrainedCounted: number;  // countedClub + countedAssociation (the homegrown 8)
  };
  newNonEuRegistrations: number;
  violations: RuleViolation[];
  warnings: string[];
  players: DerivedPlayer[];
}

export interface CanRegisterResult {
  allowed: boolean;
  attemptedList: RegistrationList;
  slot: HomegrownSlot | null;     // which slot they'd occupy if allowed
  flags: PlayerFlags;
  reasons: string[];              // why allowed / what they'd occupy
  blockingRules: string[];        // rule ids that block (empty if allowed)
}

export interface SquadRulesConfig {
  variant: RulesetVariant;
  season: Season;
  clubId: ClubId;                              // the club doing the registering
  associationCountry: ISOCountry;              // e.g. "IT"
  /** Maps each club seen in development history to its association country. */
  clubAssociations: Record<ClubId, ISOCountry>;

  // --- Surfaced config knobs (defaults stated; never hardcoded silently) ---
  loansCountTowardTraining: boolean;   // default true for the Italian list
  trainingSeasonsRequired: number;     // default 3 full seasons (~36 months)
  ageWindowMin: number;                // default 15 (inclusive)
  ageWindowMax: number;                // default 21 (inclusive)
  listBAgeOffset: number;              // default 21 → "under-22"; UEFA U21 = 20
  listACap: number;                    // default 25
  freeSlots: number;                   // default 17
  maxClubTrainedCounted: number;       // default 4
  maxAssociationTrainedCounted: number;// default 4
  maxNewNonEuPerSeason: number;        // default 2 (DOMESTIC_SERIE_A)
  enforceNonEuRule: boolean;           // default: variant === "DOMESTIC_SERIE_A"
}
