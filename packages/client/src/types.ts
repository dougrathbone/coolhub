export type Mode = "cool" | "heat" | "dry" | "fan" | "auto";
export type FanSpeed = "low" | "med" | "high" | "top" | "auto";
export type SwingMode =
  | "auto"
  | "horizontal"
  | "30"
  | "45"
  | "60"
  | "vertical"
  | "stop";
export type TemperatureUnit = "celsius" | "imperial";

export interface UnitStatus {
  uid: string;
  isOn: boolean;
  thermostat: number;
  temperature: number;
  fanSpeed: FanSpeed;
  mode: Mode;
  temperatureUnit: TemperatureUnit;
  errorCode: string | null;
  cleanFilter: boolean;
  swing: SwingMode | null;
  demand: boolean;
}

export interface SystemInfo {
  [key: string]: string;
}

export interface LineDiagnostics {
  line: string;
  protocol: string;
  role: string;
  unitCounts: string;
  myId: string;
  tx: string;
  rx: string;
  timeouts: string;
  checksumErrors: string;
  collisions: string;
  naks: string;
  raw: string;
}

export interface NetworkInfo {
  [key: string]: string;
}

export interface UnitProps {
  uid: string;
  name: string | null;
  modes: string[];
  fanSpeeds: string[];
  tempLimitMin: number | null;
  tempLimitMax: number | null;
}

export interface CoolMasterConfig {
  host: string;
  port?: number;
  readTimeout?: number;
  swingSupport?: boolean;
}

export const MODES: Mode[] = ["auto", "cool", "dry", "fan", "heat"];
export const FAN_SPEEDS: FanSpeed[] = ["low", "med", "high", "top", "auto"];

export const FAN_SPEED_TO_CHAR: Record<FanSpeed, string> = {
  low: "l",
  med: "m",
  high: "h",
  top: "t",
  auto: "a",
};
export const SWING_MODES: SwingMode[] = [
  "auto",
  "horizontal",
  "30",
  "45",
  "60",
  "vertical",
  "stop",
];

export const SWING_CHAR_TO_NAME: Record<string, SwingMode | null> = {
  a: "auto",
  h: "horizontal",
  "3": "30",
  "4": "45",
  "6": "60",
  v: "vertical",
  x: "stop",
  "-": null,
  "0": null,
};

export const SWING_NAME_TO_CHAR: Record<SwingMode, string> = {
  auto: "a",
  horizontal: "h",
  "30": "3",
  "45": "4",
  "60": "6",
  vertical: "v",
  stop: "x",
};

export const MODE_LABELS: Record<Mode, string> = {
  cool: "Cool",
  heat: "Heat",
  dry: "Dry",
  fan: "Fan",
  auto: "Auto",
};

export const FAN_SPEED_LABELS: Record<FanSpeed, string> = {
  low: "Low",
  med: "Medium",
  high: "High",
  top: "Top",
  auto: "Auto",
};
