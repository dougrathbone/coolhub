import type { FastifyInstance } from "fastify";
import { getDb } from "../db/index.js";
import { temperatureHistory } from "../db/schema.js";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import type { AppConfig } from "../config.js";

export function registerHistoryRoutes(
  fastify: FastifyInstance,
  config: AppConfig,
) {
  fastify.get<{
    Querystring: {
      uid?: string;
      from?: string;
      to?: string;
      limit?: string;
    };
  }>("/api/history", async (request) => {
    const db = getDb(config.db.path);
    const { uid, from, to, limit } = request.query;

    const conditions = [];

    if (uid) {
      conditions.push(eq(temperatureHistory.unitUid, uid));
    }

    if (from) {
      conditions.push(
        gte(temperatureHistory.timestamp, new Date(parseInt(from, 10))),
      );
    }

    if (to) {
      conditions.push(
        lte(temperatureHistory.timestamp, new Date(parseInt(to, 10))),
      );
    }

    const maxRows = Math.min(parseInt(limit ?? "1000", 10), 10000);
    const where =
      conditions.length > 0 ? and(...conditions) : undefined;

    return db
      .select()
      .from(temperatureHistory)
      .where(where)
      .orderBy(desc(temperatureHistory.timestamp))
      .limit(maxRows)
      .all();
  });
}
