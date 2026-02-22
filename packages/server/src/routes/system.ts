import type { FastifyInstance } from "fastify";
import { CoolMasterClient } from "@coolhub/client";

export function registerSystemRoutes(
  fastify: FastifyInstance,
  client: CoolMasterClient,
) {
  fastify.get("/api/system/info", async () => {
    return client.info();
  });

  fastify.get("/api/system/ping", async () => {
    const ok = await client.ping();
    return { connected: ok };
  });
}
