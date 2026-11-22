const roomSocket = "https://wizzard-room-server-production.up.railway.app/ws";

export default {
  async fetch(request, env) {
    if (new URL(request.url).pathname !== "/ws") {
      return env.ASSETS.fetch(request);
    }
    if (request.method !== "GET" || request.headers.get("Upgrade")?.toLowerCase() !== "websocket") {
      return new Response("WebSocket upgrade required", { status: 426, headers: { Upgrade: "websocket" } });
    }

    const headers = new Headers({ Upgrade: "websocket" });
    for (const name of ["Origin", "Sec-WebSocket-Protocol"]) {
      const value = request.headers.get(name);
      if (value) headers.set(name, value);
    }

    try {
      const upstream = await fetch(roomSocket, { headers, redirect: "manual" });
      if (upstream.status === 101) return upstream;
      await upstream.body?.cancel();
    } catch {
      // A connection failure and an unsuccessful upgrade both leave the room offline.
    }
    return new Response("Room service unavailable", { status: 503, headers: { "Cache-Control": "no-store" } });
  },
};
