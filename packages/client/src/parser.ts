import type {
  FanSpeed,
  Mode,
  SwingMode,
  TemperatureUnit,
  UnitStatus,
  SystemInfo,
} from "./types.js";
import { SWING_CHAR_TO_NAME } from "./types.js";

/**
 * Parse the output of `ls2` or `stat2` into UnitStatus objects.
 * Format: UID ON/OFF SetTemp CurrentTemp FanSpeed Mode ErrorCode FilterFlag [SwingCode]
 * Example: L1.101 ON 22.0C 23.5C Med Cool OK - 0
 */
export function parseStatusLine(line: string): UnitStatus {
  const fields = line.trim().split(/\s+/);

  if (fields.length < 8 || fields.length > 9) {
    throw new Error(`Unexpected status line format: ${line}`);
  }

  const uid = fields[0]!;
  const isOn = fields[1] === "ON";
  const setTempRaw = fields[2]!;
  const curTempRaw = fields[3]!;
  const fanSpeed = fields[4]!.toLowerCase() as FanSpeed;
  const mode = fields[5]!.toLowerCase() as Mode;
  const errorField = fields[6]!;
  const filterField = fields[7]!;

  const temperatureUnit: TemperatureUnit = setTempRaw.endsWith("F")
    ? "imperial"
    : "celsius";

  const thermostat = parseFloat(setTempRaw.slice(0, -1));
  const temperature = parseFloat(
    curTempRaw.slice(0, -1).replace(",", "."),
  );

  const errorCode = errorField === "OK" ? null : errorField;
  const cleanFilter = filterField === "#" || filterField === "1";

  return {
    uid,
    isOn,
    thermostat,
    temperature,
    fanSpeed,
    mode,
    temperatureUnit,
    errorCode,
    cleanFilter,
    swing: null, // Populated separately via query command
  };
}

/** Parse the single-character swing query response. */
export function parseSwingResponse(raw: string): SwingMode | null {
  const char = raw.trim();
  return SWING_CHAR_TO_NAME[char] ?? null;
}

/**
 * Parse the output of the `set` command into key-value pairs.
 * Format: "Key : Value" lines.
 */
export function parseSystemInfo(raw: string): SystemInfo {
  const lines = raw.trim().split(/\r?\n/);
  const info: SystemInfo = {};

  for (const line of lines) {
    const match = line.match(/^(.+?)\s*:\s*(.+)$/);
    if (match) {
      info[match[1]!.trim()] = match[2]!.trim();
    }
  }

  return info;
}

/** Parse the `ls` output to extract UIDs. */
export function parseUnitList(raw: string): string[] {
  return raw
    .trim()
    .split(/\r?\n/)
    .map((line) => line.trim().split(/\s+/)[0]!)
    .filter((uid) => /^L\d+\.\d+$/.test(uid));
}
