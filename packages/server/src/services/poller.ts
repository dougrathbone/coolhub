import { CoolMasterClient, type UnitStatus } from "@coolhub/client";
import { getDb } from "../db/index.js";
import { temperatureHistory } from "../db/schema.js";
import type { AppConfig } from "../config.js";

export type StatusChangeHandler = (units: Map<string, UnitStatus>) => void;

export class Poller {
  private client: CoolMasterClient;
  private config: AppConfig;
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private historyTimer: ReturnType<typeof setInterval> | null = null;
  private currentStatus = new Map<string, UnitStatus>();
  private listeners = new Set<StatusChangeHandler>();

  constructor(client: CoolMasterClient, config: AppConfig) {
    this.client = client;
    this.config = config;
  }

  get status(): Map<string, UnitStatus> {
    return this.currentStatus;
  }

  onStatusChange(handler: StatusChangeHandler): () => void {
    this.listeners.add(handler);
    return () => this.listeners.delete(handler);
  }

  async start(): Promise<void> {
    await this.poll();

    this.pollTimer = setInterval(
      () => void this.poll(),
      this.config.polling.intervalMs,
    );

    // Record temperature history at a slower interval (default 5min)
    this.recordHistory();
    this.historyTimer = setInterval(
      () => this.recordHistory(),
      this.config.polling.historyIntervalMs,
    );
  }

  stop(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
    if (this.historyTimer) {
      clearInterval(this.historyTimer);
      this.historyTimer = null;
    }
  }

  private async poll(): Promise<void> {
    try {
      const units = await this.client.status();
      const changed = this.hasChanged(units);
      this.currentStatus = units;

      if (changed) {
        for (const listener of this.listeners) {
          try {
            listener(units);
          } catch {
            // Don't let a bad listener break the poller
          }
        }
      }
    } catch (err) {
      console.error("[Poller] Error fetching status:", err);
    }
  }

  private hasChanged(newStatus: Map<string, UnitStatus>): boolean {
    if (newStatus.size !== this.currentStatus.size) return true;

    for (const [uid, unit] of newStatus) {
      const old = this.currentStatus.get(uid);
      if (!old) return true;
      if (
        old.isOn !== unit.isOn ||
        old.thermostat !== unit.thermostat ||
        old.temperature !== unit.temperature ||
        old.fanSpeed !== unit.fanSpeed ||
        old.mode !== unit.mode ||
        old.errorCode !== unit.errorCode ||
        old.cleanFilter !== unit.cleanFilter ||
        old.demand !== unit.demand
      ) {
        return true;
      }
    }

    return false;
  }

  private recordHistory(): void {
    if (this.currentStatus.size === 0) return;

    try {
      const db = getDb(this.config.db.path);
      const now = new Date();

      for (const unit of this.currentStatus.values()) {
        db.insert(temperatureHistory)
          .values({
            unitUid: unit.uid,
            timestamp: now,
            currentTemp: unit.temperature,
            setTemp: unit.thermostat,
            mode: unit.mode,
            isOn: unit.isOn,
          })
          .run();
      }
    } catch (err) {
      console.error("[Poller] Error recording history:", err);
    }
  }
}
