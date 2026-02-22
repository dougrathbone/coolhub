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

export interface UnitStatus {
  uid: string;
  isOn: boolean;
  thermostat: number;
  temperature: number;
  fanSpeed: FanSpeed;
  mode: Mode;
  temperatureUnit: "celsius" | "imperial";
  errorCode: string | null;
  cleanFilter: boolean;
  swing: SwingMode | null;
  demand: boolean;
  customName: string | null;
  groupId: number | null;
  visible: boolean;
  tempMin: number | null;
  tempMax: number | null;
  supportedModes: string[] | null;
  supportedFanSpeeds: string[] | null;
}

export interface Group {
  id: number;
  name: string;
  sortOrder: number;
  unitUids: string[];
}

export interface Schedule {
  id: number;
  name: string;
  unitUid: string | null;
  groupId: number | null;
  cron: string;
  action: ScheduleAction;
  enabled: boolean;
}

export interface ScheduleAction {
  power?: "on" | "off";
  mode?: Mode;
  temperature?: number;
  fanSpeed?: FanSpeed;
}

export interface HistoryEntry {
  id: number;
  unitUid: string;
  timestamp: number;
  currentTemp: number;
  setTemp: number;
  mode: string;
  isOn: boolean;
}

export const MODES: { value: Mode; label: string }[] = [
  { value: "cool", label: "Cool" },
  { value: "heat", label: "Heat" },
  { value: "dry", label: "Dry" },
  { value: "fan", label: "Fan" },
  { value: "auto", label: "Auto" },
];

export const FAN_SPEEDS: { value: FanSpeed; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "med", label: "Medium" },
  { value: "high", label: "High" },
  { value: "top", label: "Top" },
  { value: "auto", label: "Auto" },
];

export const SWING_MODES: { value: SwingMode; label: string }[] = [
  { value: "auto", label: "Auto" },
  { value: "horizontal", label: "Horizontal" },
  { value: "30", label: "30°" },
  { value: "45", label: "45°" },
  { value: "60", label: "60°" },
  { value: "vertical", label: "Vertical" },
  { value: "stop", label: "Stop" },
];
