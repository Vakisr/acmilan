/**
 * POST /api/vote
 * Body: { type: "player" | "coach", id: string, sessionId: string }
 *
 * - Idempotent per (sessionId, id) pair — a user can't double-vote the same target.
 * - sessionId is a client-generated UUID persisted in localStorage; it's not auth,
 *   just enough to prevent accidental double-taps. A real auth layer can replace it.
 *
 * Returns: { ok: true, votes: number } or { ok: false, reason: string }
 */
export async function onRequestPost({ request, env }) {
  let body;
  try { body = await request.json(); } catch {
    return Response.json({ ok: false, reason: "invalid json" }, { status: 400 });
  }

  const { type, id, sessionId } = body;
  if (!type || !id || !sessionId) {
    return Response.json({ ok: false, reason: "missing fields" }, { status: 400 });
  }
  if (type !== "player" && type !== "coach") {
    return Response.json({ ok: false, reason: "unknown type" }, { status: 400 });
  }

  // Idempotency check
  const dedupKey = `voted:${sessionId}:${id}`;
  const already = await env.VOTES.get(dedupKey);
  if (already) {
    return Response.json({ ok: false, reason: "already_voted" });
  }

  // Increment the target's count
  const storeKey = type === "coach" ? "coaches" : "votes";
  const raw = await env.VOTES.get(storeKey);
  const map = raw ? JSON.parse(raw) : {};
  map[id] = (map[id] || 0) + 1;
  await env.VOTES.put(storeKey, JSON.stringify(map));

  // Mark dedupe (TTL 90 days — effectively permanent for a transfer window)
  await env.VOTES.put(dedupKey, "1", { expirationTtl: 60 * 60 * 24 * 90 });

  // Increment contributor count
  const prev = Number(await env.VOTES.get("contributors") || 14207);
  await env.VOTES.put("contributors", String(prev + 1));

  return Response.json({ ok: true, votes: map[id] });
}
