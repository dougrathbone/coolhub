import type { FastifyInstance } from "fastify";
import { CoolMasterClient } from "@coolhub/client";

export function registerSystemRoutes(
  fastify: FastifyInstance,
  client: CoolMasterClient,
) {
  fastify.get("/api/system/info", async () => {
    const [info, network] = await Promise.all([
      client.info(),
      client.ifconfig().catch(() => ({})),
    ]);
    return { ...info, ...network };
  });

  fastify.get("/api/system/ping", async () => {
    const ok = await client.ping();
    return { connected: ok };
  });

  fastify.get("/api/system/lines", async () => {
    return client.lineDiagnostics();
  });
}
