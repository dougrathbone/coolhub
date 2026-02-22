import type {
  FanSpeed,
  Mode,
  SwingMode,
  TemperatureUnit,
  UnitStatus,
  SystemInfo,
  LineDiagnostics,
  NetworkInfo,
  UnitProps,
} from "./types.js";
import { SWING_CHAR_TO_NAME } from "./types.js";

/**
 * Parse the output of `ls2` or `stat2` into UnitStatus objects.
 * Format: UID ON/OFF SetTemp CurrentTemp FanSpeed Mode ErrorCode FilterFlag DemandFlag
 * Example: L1.101 ON 22.0C 23.5C Med Cool OK - 1
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
  const demandField = fields[8];

  const temperatureUnit: TemperatureUnit = setTempRaw.endsWith("F")
    ? "imperial"
    : "celsius";

  const thermostat = parseFloat(setTempRaw.slice(0, -1));
  const temperature = parseFloat(
    curTempRaw.slice(0, -1).replace(",", "."),
  );

  const errorCode = errorField === "OK" ? null : errorField;
  const cleanFilter = filterField === "#" || filterField === "1";
  const demand = demandField === "1";

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
    swing: null,
    demand,
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

/**
 * Parse the `line` command output into per-line diagnostics.
 * Example line: L1: DK Master U05/G02 myid:0B Tx:12/0 Rx:34/0 TO:0/0 CS:0/0 Col:0/0 NAK:0/0
 */
export function parseLineDiagnostics(raw: string): LineDiagnostics[] {
  const lines = raw.trim().split(/\r?\n/);
  const results: LineDiagnostics[] = [];

  for (const line of lines) {
    const match = line.match(
      /^(L\d+):\s+(\S+)\s+(\S+)\s+(U\S+)\s+myid:(\S+)\s+Tx:(\S+)\s+Rx:(\S+)\s+TO:(\S+)\s+CS:(\S+)\s+Col:(\S+)\s+NAK:(\S+)/,
    );
    if (match) {
      results.push({
        line: match[1]!,
        protocol: match[2]!,
        role: match[3]!,
        unitCounts: match[4]!,
        myId: match[5]!,
        tx: match[6]!,
        rx: match[7]!,
        timeouts: match[8]!,
        checksumErrors: match[9]!,
        collisions: match[10]!,
        naks: match[11]!,
        raw: line.trim(),
      });
    }
  }

  return results;
}

/** Parse `ifconfig` output into key-value pairs. */
export function parseNetworkInfo(raw: string): NetworkInfo {
  const info: NetworkInfo = {};
  const lines = raw.trim().split(/\r?\n/);

  for (const line of lines) {
    const match = line.match(/^\s*(\S+)\s*:\s*(.+)$/);
    if (match) {
      info[match[1]!.trim()] = match[2]!.trim();
    }
  }

  return info;
}

/**
 * Parse `props Ln.XYZ` output into unit properties.
 * Output varies but typically includes name, modes, fspeed, tlim lines.
 */
export function parseUnitProps(uid: string, raw: string): UnitProps {
  const props: UnitProps = {
    uid,
    name: null,
    modes: [],
    fanSpeeds: [],
    tempLimitMin: null,
    tempLimitMax: null,
  };

  const lines = raw.trim().split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();

    const nameMatch = trimmed.match(/^name\s*:\s*(.+)$/i);
    if (nameMatch) {
      const val = nameMatch[1]!.trim();
      props.name = val && val !== "-" ? val : null;
    }

    const modesMatch = trimmed.match(/^modes?\s*:\s*(.+)$/i);
    if (modesMatch) {
      props.modes = modesMatch[1]!
        .trim()
        .split(/[\s,]+/)
        .filter(Boolean)
        .map((m) => m.toLowerCase());
    }

    const fanMatch = trimmed.match(/^fspeed\s*:\s*(.+)$/i);
    if (fanMatch) {
      props.fanSpeeds = fanMatch[1]!
        .trim()
        .split(/[\s,]+/)
        .filter(Boolean)
        .map((f) => f.toLowerCase());
    }

    const tlimMatch = trimmed.match(/^tlim\s*:\s*(\d+\.?\d*)\s+(\d+\.?\d*)/i);
    if (tlimMatch) {
      props.tempLimitMin = parseFloat(tlimMatch[1]!);
      props.tempLimitMax = parseFloat(tlimMatch[2]!);
    }
  }

  return props;
}
