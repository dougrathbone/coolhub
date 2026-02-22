import { CoolMasterClient, type UnitProps } from "@coolhub/client";
import { getDb } from "../db/index.js";
import { unitConfig } from "../db/schema.js";
import { eq } from "drizzle-orm";
import type { AppConfig } from "../config.js";

/**
 * Fetch props from the gateway for all units and sync names/temp limits
 * into the local SQLite unit_config table. Also caches supported modes
 * and fan speeds per unit for API responses.
 */
export class PropsSync {
  private propsCache = new Map<string, UnitProps>();

  constructor(
    private client: CoolMasterClient,
    private config: AppConfig,
  ) {}

  /** Returns cached props for a unit, if available. */
  getProps(uid: string): UnitProps | undefined {
    return this.propsCache.get(uid);
  }

  /** Returns all cached props. */
  getAllProps(): Map<string, UnitProps> {
    return this.propsCache;
  }

  /** Fetch props for all units and sync to DB. */
  async sync(): Promise<void> {
    try {
      const uids = await this.client.listUnits();
      const db = getDb(this.config.db.path);

      for (const uid of uids) {
        try {
          const props = await this.client.getProps(uid);
          this.propsCache.set(uid, props);

          const existing = db
            .select()
            .from(unitConfig)
            .where(eq(unitConfig.uid, uid))
            .get() as
            | {
                uid: string;
                customName: string | null;
                groupId: number | null;
                visible: boolean;
                tempMin: number | null;
                tempMax: number | null;
              }
            | undefined;

          if (existing) {
            db.update(unitConfig)
              .set({
                customName: existing.customName ?? props.name,
                tempMin: props.tempLimitMin ?? existing.tempMin,
                tempMax: props.tempLimitMax ?? existing.tempMax,
              })
              .where(eq(unitConfig.uid, uid))
              .run();
          } else {
            db.insert(unitConfig)
              .values({
                uid,
                customName: props.name,
                visible: true,
                tempMin: props.tempLimitMin,
                tempMax: props.tempLimitMax,
              })
              .run();
          }
        } catch (err) {
          console.warn(`[PropsSync] Failed to fetch props for ${uid}:`, err);
        }
      }

      console.log(`[PropsSync] Synced props for ${uids.length} unit(s)`);
    } catch (err) {
      console.warn("[PropsSync] Failed to sync props:", err);
    }
  }
}
