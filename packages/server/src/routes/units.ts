import type { FastifyInstance } from "fastify";
import { CoolMasterClient, type Mode, type FanSpeed, type SwingMode } from "@coolhub/client";
import type { Poller } from "../services/poller.js";
import type { PropsSync } from "../services/props-sync.js";
import { getDb } from "../db/index.js";
import { unitConfig } from "../db/schema.js";
import { eq } from "drizzle-orm";
import type { AppConfig } from "../config.js";

interface UnitConfigRow {
  uid: string;
  customName: string | null;
  groupId: number | null;
  visible: boolean;
  tempMin: number | null;
  tempMax: number | null;
}

export function registerUnitRoutes(
  fastify: FastifyInstance,
  client: CoolMasterClient,
  poller: Poller,
  config: AppConfig,
  propsSync?: PropsSync,
) {
  // Get all units with their current status + config
  fastify.get("/api/units", async () => {
    const status = poller.status;
    const db = getDb(config.db.path);
    const configs = db.select().from(unitConfig).all() as UnitConfigRow[];
    const configMap = new Map(configs.map((c) => [c.uid, c]));

    const units = [];
    for (const [uid, unit] of status) {
      const cfg = configMap.get(uid);
      const props = propsSync?.getProps(uid);
      units.push({
        ...unit,
        customName: cfg?.customName ?? null,
        groupId: cfg?.groupId ?? null,
        visible: cfg?.visible ?? true,
        tempMin: cfg?.tempMin ?? null,
        tempMax: cfg?.tempMax ?? null,
        supportedModes: props?.modes?.length ? props.modes : null,
        supportedFanSpeeds: props?.fanSpeeds?.length ? props.fanSpeeds : null,
      });
    }

    return units;
  });

  // Bulk power on/off
  fastify.post<{ Body: { power: boolean } }>(
    "/api/units/power",
    async (request) => {
      const { power } = request.body;
      if (power) {
        await client.turnAllOn();
      } else {
        await client.turnAllOff();
      }
      return { ok: true };
    },
  );

  // Feed ambient temperature hint
  fastify.post<{
    Params: { uid: string };
    Body: { temperature: number };
  }>("/api/units/:uid/feed", async (request) => {
    const { uid } = request.params;
    await client.feed(uid, request.body.temperature);
    return { ok: true };
  });

  // Get single unit
  fastify.get<{ Params: { uid: string } }>(
    "/api/units/:uid",
    async (request, reply) => {
      const { uid } = request.params;
      const unit = poller.status.get(uid);
      if (!unit) {
        return reply.code(404).send({ error: "Unit not found" });
      }

      const db = getDb(config.db.path);
      const cfg = db
        .select()
        .from(unitConfig)
        .where(eq(unitConfig.uid, uid))
        .get() as UnitConfigRow | undefined;

      const props = propsSync?.getProps(uid);
      return {
        ...unit,
        customName: cfg?.customName ?? null,
        groupId: cfg?.groupId ?? null,
        visible: cfg?.visible ?? true,
        tempMin: cfg?.tempMin ?? null,
        tempMax: cfg?.tempMax ?? null,
        supportedModes: props?.modes?.length ? props.modes : null,
        supportedFanSpeeds: props?.fanSpeeds?.length ? props.fanSpeeds : null,
      };
    },
  );

  // Turn unit on/off
  fastify.post<{ Params: { uid: string }; Body: { power: boolean } }>(
    "/api/units/:uid/power",
    async (request) => {
      const { uid } = request.params;
      const { power } = request.body;
      if (power) {
        await client.turnOn(uid);
      } else {
        await client.turnOff(uid);
      }
      return { ok: true };
    },
  );

  // Set mode
  fastify.post<{ Params: { uid: string }; Body: { mode: Mode } }>(
    "/api/units/:uid/mode",
    async (request) => {
      const { uid } = request.params;
      await client.setMode(uid, request.body.mode);
      return { ok: true };
    },
  );

  // Set temperature
  fastify.post<{
    Params: { uid: string };
    Body: { temperature: number };
  }>("/api/units/:uid/temperature", async (request) => {
    const { uid } = request.params;
    await client.setTemperature(uid, request.body.temperature);
    return { ok: true };
  });

  // Set fan speed
  fastify.post<{
    Params: { uid: string };
    Body: { fanSpeed: FanSpeed };
  }>("/api/units/:uid/fan", async (request) => {
    const { uid } = request.params;
    await client.setFanSpeed(uid, request.body.fanSpeed);
    return { ok: true };
  });

  // Set swing mode
  fastify.post<{
    Params: { uid: string };
    Body: { swing: SwingMode };
  }>("/api/units/:uid/swing", async (request) => {
    const { uid } = request.params;
    await client.setSwing(uid, request.body.swing);
    return { ok: true };
  });

  // Reset filter
  fastify.post<{ Params: { uid: string } }>(
    "/api/units/:uid/filter/reset",
    async (request) => {
      const { uid } = request.params;
      await client.resetFilter(uid);
      return { ok: true };
    },
  );

  // Update unit config (name, group, visibility, temp limits)
  fastify.put<{
    Params: { uid: string };
    Body: Partial<{
      customName: string | null;
      groupId: number | null;
      visible: boolean;
      tempMin: number | null;
      tempMax: number | null;
    }>;
  }>("/api/units/:uid/config", async (request) => {
    const { uid } = request.params;
    const body = request.body;
    const db = getDb(config.db.path);

    const existing = db
      .select()
      .from(unitConfig)
      .where(eq(unitConfig.uid, uid))
      .get();

    if (existing) {
      db.update(unitConfig)
        .set({
          customName: body.customName ?? existing.customName,
          groupId: body.groupId ?? existing.groupId,
          visible: body.visible ?? existing.visible,
          tempMin: body.tempMin ?? existing.tempMin,
          tempMax: body.tempMax ?? existing.tempMax,
        })
        .where(eq(unitConfig.uid, uid))
        .run();
    } else {
      db.insert(unitConfig)
        .values({
          uid,
          customName: body.customName ?? null,
          groupId: body.groupId ?? null,
          visible: body.visible ?? true,
          tempMin: body.tempMin ?? null,
          tempMax: body.tempMax ?? null,
        })
        .run();
    }

    return { ok: true };
  });
}
