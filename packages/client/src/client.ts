import { CoolMasterConnection } from "./connection.js";
import {
  parseStatusLine,
  parseSwingResponse,
  parseSystemInfo,
  parseUnitList,
} from "./parser.js";
import type {
  CoolMasterConfig,
  FanSpeed,
  Mode,
  SwingMode,
  SystemInfo,
  UnitStatus,
} from "./types.js";
import { MODES, SWING_NAME_TO_CHAR } from "./types.js";

export class CoolMasterClient {
  private conn: CoolMasterConnection;
  private swingSupport: boolean;
  private statusCmd: string | null = null;

  constructor(config: CoolMasterConfig) {
    this.conn = new CoolMasterConnection(
      config.host,
      config.port ?? 10102,
      config.readTimeout ?? 5000,
    );
    this.swingSupport = config.swingSupport ?? false;
  }

  /** Test connectivity to the CoolMasterNet device. */
  async ping(): Promise<boolean> {
    return this.conn.ping();
  }

  /** Get system info from the bridge. */
  async info(): Promise<SystemInfo> {
    const raw = await this.conn.execute("set");
    return parseSystemInfo(raw);
  }

  /** Get all unit UIDs. */
  async listUnits(): Promise<string[]> {
    const raw = await this.conn.execute("ls");
    return parseUnitList(raw);
  }

  /** Get status for all units. */
  async status(): Promise<Map<string, UnitStatus>> {
    const raw = await this.executeStatusCmd();
    const lines = raw.split(/\r?\n/).filter((l) => l.trim());

    const units = new Map<string, UnitStatus>();
    for (const line of lines) {
      const unit = parseStatusLine(line);
      if (this.swingSupport) {
        unit.swing = await this.querySwing(unit.uid);
      }
      units.set(unit.uid, unit);
    }

    return units;
  }

  /** Get status for a single unit. */
  async unitStatus(uid: string): Promise<UnitStatus> {
    const cmd = this.statusCmd ?? "ls2";
    const raw = await this.conn.execute(`${cmd} ${uid}`);
    const lines = raw.split(/\r?\n/).filter((l) => l.trim());

    if (lines.length === 0) {
      throw new Error(`No status returned for unit ${uid}`);
    }

    const unit = parseStatusLine(lines[0]!);
    if (this.swingSupport) {
      unit.swing = await this.querySwing(uid);
    }
    return unit;
  }

  async turnOn(uid: string): Promise<void> {
    await this.conn.execute(`on ${uid}`);
  }

  async turnOff(uid: string): Promise<void> {
    await this.conn.execute(`off ${uid}`);
  }

  async setMode(uid: string, mode: Mode): Promise<void> {
    if (!MODES.includes(mode)) {
      throw new Error(`Invalid mode: ${mode}. Valid: ${MODES.join(", ")}`);
    }
    await this.conn.execute(`${mode} ${uid}`);
  }

  async setTemperature(uid: string, temp: number): Promise<void> {
    const rounded = Math.round(temp * 10) / 10;
    await this.conn.execute(`temp ${uid} ${rounded}`);
  }

  async setFanSpeed(uid: string, speed: FanSpeed): Promise<void> {
    await this.conn.execute(`fspeed ${uid} ${speed}`);
  }

  async setSwing(uid: string, swing: SwingMode): Promise<void> {
    const char = SWING_NAME_TO_CHAR[swing];
    if (!char) {
      throw new Error(`Invalid swing mode: ${swing}`);
    }
    const result = await this.conn.execute(`swing ${uid} ${char}`);
    if (result.startsWith("Unsupported Feature")) {
      throw new Error(
        `Unit ${uid} doesn't support swing mode ${swing}`,
      );
    }
  }

  async resetFilter(uid: string): Promise<void> {
    await this.conn.execute(`filt ${uid}`);
  }

  /** Provide an ambient temperature hint to the unit. */
  async feed(uid: string, temp: number): Promise<void> {
    const rounded = Math.round(temp * 10) / 10;
    await this.conn.execute(`feed ${uid} ${rounded}`);
  }

  private async querySwing(uid: string): Promise<SwingMode | null> {
    try {
      const raw = await this.conn.execute(`query ${uid} s`);
      return parseSwingResponse(raw);
    } catch {
      return null;
    }
  }

  /**
   * Auto-detect which status command the device supports.
   * Tries ls2 first, falls back to stat2.
   */
  private async executeStatusCmd(): Promise<string> {
    if (this.statusCmd) {
      return this.conn.execute(this.statusCmd);
    }

    for (const cmd of ["ls2", "stat2"]) {
      try {
        const result = await this.conn.execute(cmd);
        this.statusCmd = cmd;
        return result;
      } catch (err) {
        if (
          err instanceof Error &&
          err.message.includes("Unsupported")
        ) {
          continue;
        }
        throw err;
      }
    }

    throw new Error("Device does not support ls2 or stat2 commands");
  }
}
