import { useState, useEffect, useCallback } from "react";
import type { Schedule, UnitStatus, Group, ScheduleAction, Mode, FanSpeed } from "../../lib/types";
import { MODES, FAN_SPEEDS } from "../../lib/types";
import {
  fetchSchedules,
  fetchUnits,
  fetchGroups,
  createSchedule,
  updateSchedule,
  deleteSchedule,
} from "../../lib/api";
import {
  Clock,
  Plus,
  Trash2,
  ToggleLeft,
  ToggleRight,
  X,
} from "lucide-react";
import { cn } from "../../lib/utils";

const CRON_PRESETS = [
  { label: "Every day 6:00 AM", value: "0 6 * * *" },
  { label: "Every day 10:00 PM", value: "0 22 * * *" },
  { label: "Weekdays 7:00 AM", value: "0 7 * * 1-5" },
  { label: "Weekdays 6:00 PM", value: "0 18 * * 1-5" },
  { label: "Weekends 8:00 AM", value: "0 8 * * 0,6" },
  { label: "Custom", value: "" },
];

export function SchedulesPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [units, setUnits] = useState<UnitStatus[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [showCreate, setShowCreate] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [targetType, setTargetType] = useState<"unit" | "group" | "all">("unit");
  const [targetUid, setTargetUid] = useState("");
  const [targetGroupId, setTargetGroupId] = useState<number | undefined>();
  const [cronPreset, setCronPreset] = useState(CRON_PRESETS[0]!.value);
  const [customCron, setCustomCron] = useState("");
  const [actionPower, setActionPower] = useState<"on" | "off" | "">("on");
  const [actionMode, setActionMode] = useState<Mode | "">("");
  const [actionTemp, setActionTemp] = useState("");
  const [actionFan, setActionFan] = useState<FanSpeed | "">("");

  const load = useCallback(async () => {
    const [s, u, g] = await Promise.all([
      fetchSchedules(),
      fetchUnits(),
      fetchGroups(),
    ]);
    setSchedules(s);
    setUnits(u);
    setGroups(g);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async () => {
    if (!name.trim()) return;
    const cron = cronPreset || customCron;
    if (!cron) return;

    const action: ScheduleAction = {};
    if (actionPower) action.power = actionPower;
    if (actionMode) action.mode = actionMode;
    if (actionTemp) action.temperature = parseFloat(actionTemp);
    if (actionFan) action.fanSpeed = actionFan;

    await createSchedule({
      name: name.trim(),
      unitUid: targetType === "unit" ? targetUid || undefined : undefined,
      groupId: targetType === "group" ? targetGroupId : undefined,
      cron,
      action,
    });

    resetForm();
    await load();
  };

  const resetForm = () => {
    setName("");
    setTargetType("unit");
    setTargetUid("");
    setTargetGroupId(undefined);
    setCronPreset(CRON_PRESETS[0]!.value);
    setCustomCron("");
    setActionPower("on");
    setActionMode("");
    setActionTemp("");
    setActionFan("");
    setShowCreate(false);
  };

  const handleToggle = async (schedule: Schedule) => {
    await updateSchedule(schedule.id, { enabled: !schedule.enabled });
    await load();
  };

  const handleDelete = async (id: number) => {
    await deleteSchedule(id);
    await load();
  };

  const describeAction = (action: ScheduleAction): string => {
    const parts: string[] = [];
    if (action.power) parts.push(action.power === "on" ? "Turn on" : "Turn off");
    if (action.mode) parts.push(`Mode: ${action.mode}`);
    if (action.temperature != null) parts.push(`Temp: ${action.temperature}°`);
    if (action.fanSpeed) parts.push(`Fan: ${action.fanSpeed}`);
    return parts.join(" · ") || "No action";
  };

  const describeTarget = (s: Schedule): string => {
    if (s.unitUid) {
      const unit = units.find((u) => u.uid === s.unitUid);
      return unit?.customName || s.unitUid;
    }
    if (s.groupId) {
      const group = groups.find((g) => g.id === s.groupId);
      return group?.name || `Group ${s.groupId}`;
    }
    return "All units";
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Schedules</h1>
          <p className="text-muted text-sm mt-1">
            Automate your HVAC controls
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Schedule
        </button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <div className="mb-6 p-5 rounded-xl bg-card border border-border space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground">New Schedule</h3>
            <button onClick={resetForm} className="text-muted hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>

          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Schedule name..."
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />

          {/* Target */}
          <div>
            <label className="text-xs font-medium text-muted mb-2 block">Target</label>
            <div className="flex gap-2 mb-2">
              {(["unit", "group", "all"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTargetType(t)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium",
                    targetType === t
                      ? "bg-primary text-primary-foreground"
                      : "bg-card-hover text-muted",
                  )}
                >
                  {t === "unit" ? "Unit" : t === "group" ? "Room" : "All"}
                </button>
              ))}
            </div>
            {targetType === "unit" && (
              <select
                value={targetUid}
                onChange={(e) => setTargetUid(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none"
              >
                <option value="">Select unit...</option>
                {units.map((u) => (
                  <option key={u.uid} value={u.uid}>
                    {u.customName || u.uid}
                  </option>
                ))}
              </select>
            )}
            {targetType === "group" && (
              <select
                value={targetGroupId ?? ""}
                onChange={(e) =>
                  setTargetGroupId(
                    e.target.value ? parseInt(e.target.value) : undefined,
                  )
                }
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none"
              >
                <option value="">Select room...</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* When */}
          <div>
            <label className="text-xs font-medium text-muted mb-2 block">When</label>
            <select
              value={cronPreset}
              onChange={(e) => setCronPreset(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none"
            >
              {CRON_PRESETS.map((p) => (
                <option key={p.value + p.label} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
            {!cronPreset && (
              <input
                type="text"
                value={customCron}
                onChange={(e) => setCustomCron(e.target.value)}
                placeholder="Cron expression (e.g. 0 8 * * 1-5)"
                className="w-full mt-2 px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
            )}
          </div>

          {/* Action */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted mb-1 block">Power</label>
              <select
                value={actionPower}
                onChange={(e) => setActionPower(e.target.value as typeof actionPower)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none"
              >
                <option value="">No change</option>
                <option value="on">Turn On</option>
                <option value="off">Turn Off</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted mb-1 block">Mode</label>
              <select
                value={actionMode}
                onChange={(e) => setActionMode(e.target.value as typeof actionMode)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none"
              >
                <option value="">No change</option>
                {MODES.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted mb-1 block">Temperature</label>
              <input
                type="number"
                value={actionTemp}
                onChange={(e) => setActionTemp(e.target.value)}
                placeholder="e.g. 22"
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted mb-1 block">Fan Speed</label>
              <select
                value={actionFan}
                onChange={(e) => setActionFan(e.target.value as typeof actionFan)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none"
              >
                <option value="">No change</option>
                {FAN_SPEEDS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={handleCreate}
            className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Create Schedule
          </button>
        </div>
      )}

      {/* Schedule List */}
      {schedules.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 rounded-xl border border-border bg-card">
          <Clock className="w-8 h-8 text-muted mb-3" />
          <p className="text-muted text-sm">No schedules yet</p>
          <p className="text-muted-foreground text-xs mt-1">
            Create one to automate your HVAC
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {schedules.map((schedule) => (
            <div
              key={schedule.id}
              className={cn(
                "flex items-center justify-between p-4 rounded-xl bg-card border border-border",
                !schedule.enabled && "opacity-50",
              )}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Clock className="w-5 h-5 text-primary flex-shrink-0" />
                <div className="min-w-0">
                  <h3 className="font-medium text-foreground text-sm truncate">
                    {schedule.name}
                  </h3>
                  <p className="text-xs text-muted truncate">
                    {describeTarget(schedule)} &middot;{" "}
                    <code className="text-primary/70">{schedule.cron}</code>
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {describeAction(schedule.action as ScheduleAction)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggle(schedule)}
                  className="text-muted hover:text-foreground"
                >
                  {schedule.enabled ? (
                    <ToggleRight className="w-6 h-6 text-success" />
                  ) : (
                    <ToggleLeft className="w-6 h-6" />
                  )}
                </button>
                <button
                  onClick={() => handleDelete(schedule.id)}
                  className="p-1.5 text-muted hover:text-destructive rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
