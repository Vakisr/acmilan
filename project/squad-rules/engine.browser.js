/* =============================================================================
 * Squad Registration Rule Engine — BROWSER MIRROR (window.SquadRules)
 * Plain JS, logic-identical to the canonical TypeScript in engine.ts.
 * Kept type-free so it runs in any browser with no build step.
 * ========================================================================== */
(function () {
  function makeConfig(params) {
    var base = {
      variant: params.variant,
      season: params.season,
      clubId: params.clubId,
      associationCountry: params.associationCountry,
      clubAssociations: params.clubAssociations || {},
      loansCountTowardTraining: true,
      trainingSeasonsRequired: 3,
      ageWindowMin: 15,
      ageWindowMax: 21,
      listBAgeOffset: 21,
      listACap: 25,
      freeSlots: 17,
      maxClubTrainedCounted: 4,
      maxAssociationTrainedCounted: 4,
      maxNewNonEuPerSeason: 2,
      enforceNonEuRule: params.variant === "DOMESTIC_SERIE_A",
    };
    return Object.assign(base, params.overrides || {});
  }

  function seasonStartYear(s) { return parseInt(String(s).slice(0, 4), 10); }
  function birthYearOf(d) { return parseInt(String(d).slice(0, 4), 10); }

  function derivePlayerFlags(player, config) {
    var cutoffYear = seasonStartYear(config.season) - config.listBAgeOffset;
    var isUnder22 = new Date(player.dateOfBirth) >= new Date(Date.UTC(cutoffYear, 0, 1));

    var clubSeasons = {}, assocSeasons = {};
    (player.developmentHistory || []).forEach(function (spell) {
      if (spell.onLoan && !config.loansCountTowardTraining) return;
      var age = seasonStartYear(spell.season) - birthYearOf(player.dateOfBirth);
      if (age < config.ageWindowMin || age > config.ageWindowMax) return;
      var isOwnClub = spell.clubId === config.clubId;
      var inAssoc = isOwnClub || config.clubAssociations[spell.clubId] === config.associationCountry;
      if (isOwnClub) clubSeasons[spell.season] = 1;
      if (inAssoc) assocSeasons[spell.season] = 1;
    });

    var clubN = Object.keys(clubSeasons).length;
    var assocN = Object.keys(assocSeasons).length;
    var isClubTrained = clubN >= config.trainingSeasonsRequired;
    var isAssociationTrained = isClubTrained || assocN >= config.trainingSeasonsRequired;

    return {
      isUnder22: isUnder22,
      isClubTrained: isClubTrained,
      isAssociationTrained: isAssociationTrained,
      isLocallyTrained: isClubTrained || isAssociationTrained,
      clubTrainedSeasons: clubN,
      associationTrainedSeasons: assocN,
    };
  }

  function assignList(flags, player) {
    if (player.forceListA) return "A";
    return flags.isUnder22 ? "B" : "A";
  }

  function validateSquad(squad, config) {
    var derived = squad.map(function (player) {
      var flags = derivePlayerFlags(player, config);
      return { player: player, flags: flags, list: assignList(flags, player) };
    });

    var listA = derived.filter(function (d) { return d.list === "A"; });
    var listB = derived.filter(function (d) { return d.list === "B"; });

    var clubTrained = listA.filter(function (d) { return d.flags.isClubTrained; }).length;
    var associationTrained = listA.filter(function (d) { return d.flags.isAssociationTrained; }).length;

    var countedClub = Math.min(clubTrained, config.maxClubTrainedCounted);
    var countedAssociation = Math.min(associationTrained, config.maxAssociationTrainedCounted);

    var maxHomegrownSlots = config.maxClubTrainedCounted + config.maxAssociationTrainedCounted;
    var forfeitedSlots = maxHomegrownSlots - (countedClub + countedAssociation);
    var effectiveMax = Math.min(config.listACap, config.freeSlots + countedClub + countedAssociation);

    var listASize = listA.length;
    var violations = [], warnings = [];

    if (listASize > effectiveMax) {
      violations.push({
        rule: "R4", code: "LIST_A_EXCEEDS_EFFECTIVE_MAX",
        message: "List A holds " + listASize + " players but only " + effectiveMax +
          " are usable (" + (listASize - effectiveMax) + " over). Forfeited homegrown slots cannot be backfilled.",
        detail: { listASize: listASize, effectiveMax: effectiveMax, forfeitedSlots: forfeitedSlots },
      });
    }
    if (listASize > config.listACap) {
      violations.push({
        rule: "R1", code: "LIST_A_OVER_CAP",
        message: "List A has " + listASize + " players; the hard cap is " + config.listACap + ".",
        detail: { listASize: listASize, listACap: config.listACap },
      });
    }

    var newNonEu = squad.filter(function (p) { return p.registeredThisSeason && !p.euEligible; });
    if (config.enforceNonEuRule && newNonEu.length > config.maxNewNonEuPerSeason) {
      violations.push({
        rule: "R5", code: "NON_EU_NEW_REG_CAP",
        message: newNonEu.length + " new non-EU registrations this season; the cap is " + config.maxNewNonEuPerSeason + ".",
        detail: { newNonEu: newNonEu.map(function (p) { return p.id; }) },
      });
    }

    if (forfeitedSlots > 0) {
      warnings.push(
        forfeitedSlots + " homegrown slot(s) forfeited — " + clubTrained + "/" + config.maxClubTrainedCounted +
        " club-trained and " + associationTrained + "/" + config.maxAssociationTrainedCounted +
        " association-trained counted. Effective max List A = " + effectiveMax + "."
      );
    }

    return {
      valid: violations.length === 0,
      variant: config.variant,
      season: config.season,
      listACap: config.listACap,
      listASize: listASize,
      listBSize: listB.length,
      effectiveMax: effectiveMax,
      forfeitedSlots: forfeitedSlots,
      counts: {
        clubTrained: clubTrained,
        associationTrained: associationTrained,
        countedClub: countedClub,
        countedAssociation: countedAssociation,
        locallyTrainedCounted: countedClub + countedAssociation,
      },
      newNonEuRegistrations: newNonEu.length,
      violations: violations,
      warnings: warnings,
      players: derived,
    };
  }

  function canRegister(player, squad, config, opts) {
    var flags = derivePlayerFlags(player, config);
    var attemptedList = assignList(flags, player);
    var reasons = [], blockingRules = [], slot = null;

    var isNew = (opts && typeof opts.asNewRegistration === "boolean")
      ? opts.asNewRegistration
      : (typeof player.registeredThisSeason === "boolean" ? player.registeredThisSeason : true);

    if (config.enforceNonEuRule && isNew && !player.euEligible) {
      var currentNewNonEu = squad.filter(function (p) { return p.registeredThisSeason && !p.euEligible; }).length;
      if (currentNewNonEu + 1 > config.maxNewNonEuPerSeason) {
        blockingRules.push("R5");
        reasons.push("Non-EU signing cap reached: " + currentNewNonEu + " new non-EU already registered (max " +
          config.maxNewNonEuPerSeason + "). No existing non-EU player needs to be offloaded — it's purely the per-season intake limit.");
      }
    }

    if (attemptedList === "B") {
      slot = "LIST_B";
      reasons.push("Registers on List B (Under-22) — unlimited, sits outside the 25-man List A.");
    } else {
      var before = validateSquad(squad, config);
      var after = validateSquad(squad.concat([player]), config);
      if (after.listASize <= after.effectiveMax) {
        if (flags.isClubTrained && before.counts.countedClub < config.maxClubTrainedCounted) slot = "CLUB_TRAINED";
        else if (flags.isAssociationTrained && before.counts.countedAssociation < config.maxAssociationTrainedCounted) slot = "ASSOCIATION_TRAINED";
        else slot = "FREE";
        reasons.push("Fits List A in a " + slot + " slot — List A would be " + after.listASize + "/" + after.effectiveMax + ".");
      } else {
        blockingRules.push("R4");
        reasons.push("No List A slot: would be " + after.listASize + " vs effective max " + after.effectiveMax +
          ". Unused homegrown slots can't be backfilled with non-locally-trained players.");
      }
    }

    return {
      allowed: blockingRules.length === 0,
      attemptedList: attemptedList,
      slot: blockingRules.length === 0 ? slot : null,
      flags: flags,
      reasons: reasons,
      blockingRules: blockingRules,
    };
  }

  window.SquadRules = {
    makeConfig: makeConfig,
    derivePlayerFlags: derivePlayerFlags,
    validateSquad: validateSquad,
    canRegister: canRegister,
  };
})();
