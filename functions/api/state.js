export async function onRequestGet({ env }) {
  const [votesRaw, coachesRaw, contribRaw] = await Promise.all([
    env.VOTES.get("votes"),
    env.VOTES.get("coaches"),
    env.VOTES.get("contributors"),
  ]);

  return Response.json({
    votes:        votesRaw    ? JSON.parse(votesRaw)   : {},
    coaches:      coachesRaw  ? JSON.parse(coachesRaw) : { slot: 9120, glasner: 11890, pochettino: 8500, jaissle: 6200 },
    contributors: contribRaw  ? Number(contribRaw)     : 14207,
  }, {
    headers: { "Cache-Control": "no-store" },
  });
}
