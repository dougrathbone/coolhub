import type { FastifyInstance } from "fastify";
import { getDb } from "../db/index.js";
import { groups, unitConfig } from "../db/schema.js";
import { eq } from "drizzle-orm";
import type { AppConfig } from "../config.js";

export function registerGroupRoutes(
  fastify: FastifyInstance,
  config: AppConfig,
) {
  fastify.get("/api/groups", async () => {
    const db = getDb(config.db.path);
    const allGroups = db
      .select()
      .from(groups)
      .orderBy(groups.sortOrder)
      .all();

    const result = [];
    for (const group of allGroups) {
      const units = db
        .select({ uid: unitConfig.uid })
        .from(unitConfig)
        .where(eq(unitConfig.groupId, group.id))
        .all();

      result.push({
        ...group,
        unitUids: units.map((u) => u.uid),
      });
    }

    return result;
  });

  fastify.post<{ Body: { name: string; sortOrder?: number } }>(
    "/api/groups",
    async (request) => {
      const db = getDb(config.db.path);
      const result = db
        .insert(groups)
        .values({
          name: request.body.name,
          sortOrder: request.body.sortOrder ?? 0,
        })
        .returning()
        .get();

      return result;
    },
  );

  fastify.put<{
    Params: { id: string };
    Body: Partial<{ name: string; sortOrder: number }>;
  }>("/api/groups/:id", async (request, reply) => {
    const db = getDb(config.db.path);
    const id = parseInt(request.params.id, 10);

    const existing = db
      .select()
      .from(groups)
      .where(eq(groups.id, id))
      .get();
    if (!existing) {
      return reply.code(404).send({ error: "Group not found" });
    }

    db.update(groups)
      .set({
        name: request.body.name ?? existing.name,
        sortOrder: request.body.sortOrder ?? existing.sortOrder,
      })
      .where(eq(groups.id, id))
      .run();

    return { ok: true };
  });

  fastify.delete<{ Params: { id: string } }>(
    "/api/groups/:id",
    async (request, reply) => {
      const db = getDb(config.db.path);
      const id = parseInt(request.params.id, 10);

      const existing = db
        .select()
        .from(groups)
        .where(eq(groups.id, id))
        .get();
      if (!existing) {
        return reply.code(404).send({ error: "Group not found" });
      }

      db.delete(groups).where(eq(groups.id, id)).run();
      return { ok: true };
    },
  );
}
