import type {
  UnitStatus,
  Group,
  Schedule,
  ScheduleAction,
  HistoryEntry,
  Mode,
  FanSpeed,
  SwingMode,
} from "./types";

const BASE = "/api";

async function request<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API error ${res.status}: ${body}`);
  }
  return res.json();
}

// Units
export const fetchUnits = () => request<UnitStatus[]>("/units");
export const fetchUnit = (uid: string) =>
  request<UnitStatus>(`/units/${uid}`);

export const setPower = (uid: string, power: boolean) =>
  request("/units/" + uid + "/power", {
    method: "POST",
    body: JSON.stringify({ power }),
  });

export const setMode = (uid: string, mode: Mode) =>
  request("/units/" + uid + "/mode", {
    method: "POST",
    body: JSON.stringify({ mode }),
  });

export const setTemperature = (uid: string, temperature: number) =>
  request("/units/" + uid + "/temperature", {
    method: "POST",
    body: JSON.stringify({ temperature }),
  });

export const setFanSpeed = (uid: string, fanSpeed: FanSpeed) =>
  request("/units/" + uid + "/fan", {
    method: "POST",
    body: JSON.stringify({ fanSpeed }),
  });

export const setSwing = (uid: string, swing: SwingMode) =>
  request("/units/" + uid + "/swing", {
    method: "POST",
    body: JSON.stringify({ swing }),
  });

export const resetFilter = (uid: string) =>
  request("/units/" + uid + "/filter/reset", { method: "POST" });

export const updateUnitConfig = (
  uid: string,
  config: Partial<{
    customName: string | null;
    groupId: number | null;
    visible: boolean;
    tempMin: number | null;
    tempMax: number | null;
  }>,
) =>
  request("/units/" + uid + "/config", {
    method: "PUT",
    body: JSON.stringify(config),
  });

// Groups
export const fetchGroups = () => request<Group[]>("/groups");
export const createGroup = (name: string, sortOrder?: number) =>
  request<Group>("/groups", {
    method: "POST",
    body: JSON.stringify({ name, sortOrder }),
  });
export const updateGroup = (
  id: number,
  data: Partial<{ name: string; sortOrder: number }>,
) =>
  request("/groups/" + id, {
    method: "PUT",
    body: JSON.stringify(data),
  });
export const deleteGroup = (id: number) =>
  request("/groups/" + id, { method: "DELETE" });

// Schedules
export const fetchSchedules = () => request<Schedule[]>("/schedules");
export const createSchedule = (data: {
  name: string;
  unitUid?: string;
  groupId?: number;
  cron: string;
  action: ScheduleAction;
}) =>
  request<Schedule>("/schedules", {
    method: "POST",
    body: JSON.stringify(data),
  });
export const updateSchedule = (
  id: number,
  data: Partial<Schedule>,
) =>
  request("/schedules/" + id, {
    method: "PUT",
    body: JSON.stringify(data),
  });
export const deleteSchedule = (id: number) =>
  request("/schedules/" + id, { method: "DELETE" });

// History
export const fetchHistory = (params?: {
  uid?: string;
  from?: number;
  to?: number;
  limit?: number;
}) => {
  const qs = new URLSearchParams();
  if (params?.uid) qs.set("uid", params.uid);
  if (params?.from) qs.set("from", params.from.toString());
  if (params?.to) qs.set("to", params.to.toString());
  if (params?.limit) qs.set("limit", params.limit.toString());
  return request<HistoryEntry[]>(`/history?${qs.toString()}`);
};

// System
export const fetchSystemInfo = () =>
  request<Record<string, string>>("/system/info");
export const pingSystem = () =>
  request<{ connected: boolean }>("/system/ping");
