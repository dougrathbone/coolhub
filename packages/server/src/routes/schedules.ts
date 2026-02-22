import type { FastifyInstance } from "fastify";
import { getDb } from "../db/index.js";
import { schedules, type ScheduleAction } from "../db/schema.js";
import { eq } from "drizzle-orm";
import type { Scheduler } from "../services/scheduler.js";
import type { AppConfig } from "../config.js";

export function registerScheduleRoutes(
  fastify: FastifyInstance,
  scheduler: Scheduler,
  config: AppConfig,
) {
  fastify.get("/api/schedules", async () => {
    const db = getDb(config.db.path);
    return db.select().from(schedules).all();
  });

  fastify.post<{
    Body: {
      name: string;
      unitUid?: string;
      groupId?: number;
      cron: string;
      action: ScheduleAction;
      enabled?: boolean;
    };
  }>("/api/schedules", async (request) => {
    const db = getDb(config.db.path);
    const result = db
      .insert(schedules)
      .values({
        name: request.body.name,
        unitUid: request.body.unitUid ?? null,
        groupId: request.body.groupId ?? null,
        cron: request.body.cron,
        action: request.body.action,
        enabled: request.body.enabled ?? true,
      })
      .returning()
      .get();

    scheduler.reload();
    return result;
  });

  fastify.put<{
    Params: { id: string };
    Body: Partial<{
      name: string;
      unitUid: string | null;
      groupId: number | null;
      cron: string;
      action: ScheduleAction;
      enabled: boolean;
    }>;
  }>("/api/schedules/:id", async (request, reply) => {
    const db = getDb(config.db.path);
    const id = parseInt(request.params.id, 10);

    const existing = db
      .select()
      .from(schedules)
      .where(eq(schedules.id, id))
      .get();
    if (!existing) {
      return reply.code(404).send({ error: "Schedule not found" });
    }

    db.update(schedules)
      .set({
        name: request.body.name ?? existing.name,
        unitUid:
          request.body.unitUid !== undefined
            ? request.body.unitUid
            : existing.unitUid,
        groupId:
          request.body.groupId !== undefined
            ? request.body.groupId
            : existing.groupId,
        cron: request.body.cron ?? existing.cron,
        action: request.body.action ?? existing.action,
        enabled: request.body.enabled ?? existing.enabled,
      })
      .where(eq(schedules.id, id))
      .run();

    scheduler.reload();
    return { ok: true };
  });

  fastify.delete<{ Params: { id: string } }>(
    "/api/schedules/:id",
    async (request, reply) => {
      const db = getDb(config.db.path);
      const id = parseInt(request.params.id, 10);

      const existing = db
        .select()
        .from(schedules)
        .where(eq(schedules.id, id))
        .get();
      if (!existing) {
        return reply.code(404).send({ error: "Schedule not found" });
      }

      db.delete(schedules).where(eq(schedules.id, id)).run();
      scheduler.reload();
      return { ok: true };
    },
  );
}
