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

  const dedupKey = `voted:${sessionId}:${id}`;
  const already = await env.VOTES.get(dedupKey);
  if (already) {
    return Response.json({ ok: false, reason: "already_voted" });
  }

  const storeKey = type === "coach" ? "coaches" : "votes";
  const raw = await env.VOTES.get(storeKey);
  const map = raw ? JSON.parse(raw) : {};
  map[id] = (map[id] || 0) + 1;
  await env.VOTES.put(storeKey, JSON.stringify(map));

  await env.VOTES.put(dedupKey, "1", { expirationTtl: 60 * 60 * 24 * 90 });

  const prev = Number(await env.VOTES.get("contributors") || 14207);
  await env.VOTES.put("contributors", String(prev + 1));

  return Response.json({ ok: true, votes: map[id] });
}
