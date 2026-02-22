import type { FastifyInstance } from "fastify";
import type { WebSocket } from "@fastify/websocket";
import type { UnitStatus } from "@coolhub/client";

export class WebSocketBroadcaster {
  private clients = new Set<WebSocket>();

  register(fastify: FastifyInstance): void {
    fastify.get(
      "/ws",
      { websocket: true },
      (socket) => {
        this.clients.add(socket);

        socket.on("close", () => {
          this.clients.delete(socket);
        });

        socket.on("error", () => {
          this.clients.delete(socket);
        });
      },
    );
  }

  broadcastStatus(units: Map<string, UnitStatus>): void {
    const payload = JSON.stringify({
      type: "status",
      data: Object.fromEntries(units),
      timestamp: Date.now(),
    });

    for (const client of this.clients) {
      try {
        if (client.readyState === 1) {
          client.send(payload);
        }
      } catch {
        this.clients.delete(client);
      }
    }
  }
}
