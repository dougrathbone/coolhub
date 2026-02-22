import { Cron } from "croner";
import { CoolMasterClient, type Mode, type FanSpeed } from "@coolhub/client";
import { getDb } from "../db/index.js";
import { schedules, unitConfig } from "../db/schema.js";
import { eq } from "drizzle-orm";
import type { ScheduleAction } from "../db/schema.js";
import type { AppConfig } from "../config.js";

interface ActiveJob {
  cron: Cron;
  scheduleId: number;
}

export class Scheduler {
  private client: CoolMasterClient;
  private config: AppConfig;
  private jobs: ActiveJob[] = [];

  constructor(client: CoolMasterClient, config: AppConfig) {
    this.client = client;
    this.config = config;
  }

  start(): void {
    this.reload();
  }

  stop(): void {
    for (const job of this.jobs) {
      job.cron.stop();
    }
    this.jobs = [];
  }

  /** Reload all schedules from the database. */
  reload(): void {
    this.stop();

    const db = getDb(this.config.db.path);
    const rows = db
      .select()
      .from(schedules)
      .where(eq(schedules.enabled, true))
      .all();

    for (const row of rows) {
      try {
        const cron = new Cron(row.cron, async () => {
          await this.executeAction(
            row.action as ScheduleAction,
            row.unitUid,
            row.groupId,
          );
        });

        this.jobs.push({ cron, scheduleId: row.id });
      } catch (err) {
        console.error(
          `[Scheduler] Invalid cron for schedule ${row.id}:`,
          err,
        );
      }
    }

    console.log(`[Scheduler] Loaded ${this.jobs.length} active schedules`);
  }

  private async executeAction(
    action: ScheduleAction,
    unitUid: string | null,
    groupId: number | null,
  ): Promise<void> {
    const uids = this.resolveTargetUids(unitUid, groupId);

    for (const uid of uids) {
      try {
        if (action.power === "on") await this.client.turnOn(uid);
        if (action.power === "off") await this.client.turnOff(uid);
        if (action.mode)
          await this.client.setMode(uid, action.mode as Mode);
        if (action.temperature != null)
          await this.client.setTemperature(uid, action.temperature);
        if (action.fanSpeed)
          await this.client.setFanSpeed(uid, action.fanSpeed as FanSpeed);
      } catch (err) {
        console.error(
          `[Scheduler] Error executing action on ${uid}:`,
          err,
        );
      }
    }
  }

  private resolveTargetUids(
    unitUid: string | null,
    groupId: number | null,
  ): string[] {
    if (unitUid) return [unitUid];

    if (groupId) {
      const db = getDb(this.config.db.path);
      return db
        .select({ uid: unitConfig.uid })
        .from(unitConfig)
        .where(eq(unitConfig.groupId, groupId))
        .all()
        .map((r) => r.uid);
    }

    // No specific target = all units (not typical, but supported)
    return [];
  }
}
