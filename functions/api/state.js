/**
 * GET /api/state
 * Returns all vote tallies and contributor count from KV.
 * Shape: { votes: { [playerId]: number }, coaches: { slot: number, glasner: number }, contributors: number }
 */
export async function onRequestGet({ env }) {
  const [votesRaw, coachesRaw, contribRaw] = await Promise.all([
    env.VOTES.get("votes"),
    env.VOTES.get("coaches"),
    env.VOTES.get("contributors"),
  ]);

  return Response.json({
    votes:        votesRaw    ? JSON.parse(votesRaw)   : {},
    coaches:      coachesRaw  ? JSON.parse(coachesRaw) : { slot: 9120, glasner: 11890 },
    contributors: contribRaw  ? Number(contribRaw)     : 14207,
  }, {
    headers: { "Cache-Control": "no-store" },
  });
}
