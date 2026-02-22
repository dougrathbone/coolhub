import Fastify from "fastify";
import fastifyWebsocket from "@fastify/websocket";
import fastifyCors from "@fastify/cors";
import fastifyStatic from "@fastify/static";
import { CoolMasterClient } from "@coolhub/client";
import { loadConfig } from "./config.js";
import { getDb } from "./db/index.js";
import { Poller } from "./services/poller.js";
import { Scheduler } from "./services/scheduler.js";
import { WebSocketBroadcaster } from "./services/websocket.js";
import { registerUnitRoutes } from "./routes/units.js";
import { registerGroupRoutes } from "./routes/groups.js";
import { registerScheduleRoutes } from "./routes/schedules.js";
import { registerHistoryRoutes } from "./routes/history.js";
import { registerSystemRoutes } from "./routes/system.js";
import { existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

export async function startServer() {
  const config = loadConfig();

  // Initialize database
  getDb(config.db.path);

  // Initialize CoolMasterNet client
  const client = new CoolMasterClient({
    host: config.coolmaster.host,
    port: config.coolmaster.port,
    swingSupport: config.coolmaster.swingSupport,
  });

  // Set up Fastify
  const fastify = Fastify({ logger: true });
  await fastify.register(fastifyWebsocket);
  await fastify.register(fastifyCors, { origin: true });

  // Serve static frontend in production
  const webDistPath = resolve(__dirname, "../../web/dist");
  if (existsSync(webDistPath)) {
    await fastify.register(fastifyStatic, {
      root: webDistPath,
      prefix: "/",
      wildcard: false,
    });

    // SPA fallback: serve index.html for non-API routes
    fastify.setNotFoundHandler(async (request, reply) => {
      if (request.url.startsWith("/api/") || request.url.startsWith("/ws")) {
        return reply.code(404).send({ error: "Not found" });
      }
      return reply.sendFile("index.html");
    });
  }

  // WebSocket broadcaster
  const wsBroadcaster = new WebSocketBroadcaster();
  wsBroadcaster.register(fastify);

  // Poller
  const poller = new Poller(client, config);
  poller.onStatusChange((units) => {
    wsBroadcaster.broadcastStatus(units);
  });

  // Scheduler
  const scheduler = new Scheduler(client, config);

  // Register routes
  registerUnitRoutes(fastify, client, poller, config);
  registerGroupRoutes(fastify, config);
  registerScheduleRoutes(fastify, scheduler, config);
  registerHistoryRoutes(fastify, config);
  registerSystemRoutes(fastify, client);

  // Start services
  try {
    const connected = await client.ping();
    if (connected) {
      console.log(
        `Connected to CoolMasterNet at ${config.coolmaster.host}:${config.coolmaster.port}`,
      );
      await poller.start();
      scheduler.start();
    } else {
      console.warn(
        `Could not connect to CoolMasterNet at ${config.coolmaster.host}:${config.coolmaster.port}. Running in offline mode.`,
      );
    }
  } catch (err) {
    console.warn("CoolMasterNet connection failed, running in offline mode:", err);
  }

  // Start HTTP server
  await fastify.listen({
    port: config.server.port,
    host: config.server.host,
  });

  console.log(`CoolHub server running at http://localhost:${config.server.port}`);

  // Graceful shutdown
  const shutdown = async () => {
    console.log("Shutting down...");
    poller.stop();
    scheduler.stop();
    await fastify.close();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
