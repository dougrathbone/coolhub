import { useState } from "react";
import type { UnitStatus, Mode } from "../../lib/types";
import { MODES, FAN_SPEEDS } from "../../lib/types";
import {
  setPower,
  setMode as apiSetMode,
  setTemperature,
  setFanSpeed as apiSetFanSpeed,
  resetFilter,
} from "../../lib/api";
import {
  cn,
  modeColor,
  modeBgColor,
  modeGradient,
  formatTemp,
} from "../../lib/utils";
import {
  Power,
  Thermometer,
  Wind,
  Snowflake,
  Flame,
  Droplets,
  Fan,
  Gauge,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Filter,
  Minus,
  Plus,
} from "lucide-react";

const modeIcons: Record<Mode, React.ElementType> = {
  cool: Snowflake,
  heat: Flame,
  dry: Droplets,
  fan: Fan,
  auto: Gauge,
};

export function UnitCard({ unit }: { unit: UnitStatus }) {
  const [expanded, setExpanded] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleAction = async (action: () => Promise<unknown>) => {
    setBusy(true);
    try {
      await action();
    } catch (err) {
      console.error(err);
    } finally {
      setBusy(false);
    }
  };

  const ModeIcon = modeIcons[unit.mode] ?? Gauge;
  const displayName = unit.customName || unit.uid;
  const tempSuffix = unit.temperatureUnit === "celsius" ? "C" : "F";

  return (
    <div
      className={cn(
        "rounded-xl border transition-all duration-200",
        unit.isOn ? modeBgColor(unit.mode) : "bg-card border-border",
        busy && "opacity-70 pointer-events-none",
      )}
    >
      {/* Card Header */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={cn(
              "flex items-center justify-center w-10 h-10 rounded-lg",
              unit.isOn
                ? `bg-gradient-to-br ${modeGradient(unit.mode)}`
                : "bg-slate-700",
            )}
          >
            <ModeIcon className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-foreground truncate">
              {displayName}
            </h3>
            <p className="text-xs text-muted">
              {unit.uid}
              {unit.isOn && (
                <span className={cn("ml-2", modeColor(unit.mode))}>
                  {unit.demand
                    ? `${unit.mode === "heat" ? "Heating" : unit.mode === "cool" ? "Cooling" : unit.mode === "dry" ? "Drying" : unit.mode === "fan" ? "Fan" : "Running"}...`
                    : unit.mode.charAt(0).toUpperCase() + unit.mode.slice(1)}
                </span>
              )}
              {unit.isOn && !unit.demand && (
                <span className="ml-1 text-muted-foreground">Idle</span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Alerts */}
          {unit.errorCode && (
            <AlertTriangle className="w-4 h-4 text-destructive" />
          )}
          {unit.cleanFilter && (
            <Filter className="w-4 h-4 text-warning" />
          )}

          {/* Temperature */}
          <div className="text-right">
            <p className="text-lg font-bold text-foreground tabular-nums">
              {unit.temperature.toFixed(1)}°{tempSuffix}
            </p>
            {unit.isOn && (
              <p className="text-xs text-muted tabular-nums">
                Target: {unit.thermostat.toFixed(1)}°
              </p>
            )}
          </div>

          {/* Power Toggle */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleAction(() => setPower(unit.uid, !unit.isOn));
            }}
            className={cn(
              "flex items-center justify-center w-9 h-9 rounded-full transition-colors",
              unit.isOn
                ? "bg-success/20 text-success hover:bg-success/30"
                : "bg-slate-700 text-muted hover:bg-slate-600",
            )}
          >
            <Power className="w-4 h-4" />
          </button>

          {/* Expand Arrow */}
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-muted" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted" />
          )}
        </div>
      </div>

      {/* Expanded Controls */}
      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-white/5 pt-4">
          {/* Temperature Control */}
          <div>
            <label className="text-xs font-medium text-muted mb-2 block">
              <Thermometer className="w-3.5 h-3.5 inline mr-1" />
              Temperature
            </label>
            <div className="flex items-center gap-3">
              <button
                onClick={() =>
                  handleAction(() =>
                    setTemperature(unit.uid, unit.thermostat - 0.5),
                  )
                }
                className="flex items-center justify-center w-9 h-9 rounded-lg bg-card-hover hover:bg-slate-600 transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
              <div className="flex-1 text-center">
                <span className="text-2xl font-bold tabular-nums">
                  {formatTemp(unit.thermostat, unit.temperatureUnit)}
                </span>
              </div>
              <button
                onClick={() =>
                  handleAction(() =>
                    setTemperature(unit.uid, unit.thermostat + 0.5),
                  )
                }
                className="flex items-center justify-center w-9 h-9 rounded-lg bg-card-hover hover:bg-slate-600 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Mode Selection */}
          <div>
            <label className="text-xs font-medium text-muted mb-2 block">
              Mode
            </label>
            <div className="grid grid-cols-5 gap-1.5">
              {MODES.filter(
                (m) => !unit.supportedModes?.length || unit.supportedModes.includes(m.value),
              ).map((m) => {
                const Icon = modeIcons[m.value] ?? Gauge;
                return (
                  <button
                    key={m.value}
                    onClick={() =>
                      handleAction(() =>
                        apiSetMode(unit.uid, m.value),
                      )
                    }
                    className={cn(
                      "flex flex-col items-center gap-1 py-2 rounded-lg text-xs transition-colors",
                      unit.mode === m.value
                        ? `bg-gradient-to-br ${modeGradient(m.value)} text-white font-medium`
                        : "bg-card-hover text-muted hover:text-foreground",
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {m.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Fan Speed */}
          <div>
            <label className="text-xs font-medium text-muted mb-2 block">
              <Wind className="w-3.5 h-3.5 inline mr-1" />
              Fan Speed
            </label>
            <div className="flex gap-1.5">
              {FAN_SPEEDS.filter(
                (f) => !unit.supportedFanSpeeds?.length || unit.supportedFanSpeeds.includes(f.value),
              ).map((f) => (
                <button
                  key={f.value}
                  onClick={() =>
                    handleAction(() =>
                      apiSetFanSpeed(unit.uid, f.value),
                    )
                  }
                  className={cn(
                    "flex-1 py-2 rounded-lg text-xs font-medium transition-colors",
                    unit.fanSpeed === f.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-card-hover text-muted hover:text-foreground",
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Error / Filter Status */}
          {(unit.errorCode || unit.cleanFilter) && (
            <div className="space-y-2">
              {unit.errorCode && (
                <div className="flex items-center gap-2 px-3 py-2 bg-destructive/10 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0" />
                  <span className="text-xs text-destructive">
                    Error: {unit.errorCode}
                  </span>
                </div>
              )}
              {unit.cleanFilter && (
                <div className="flex items-center justify-between px-3 py-2 bg-warning/10 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-warning flex-shrink-0" />
                    <span className="text-xs text-warning">
                      Filter needs cleaning
                    </span>
                  </div>
                  <button
                    onClick={() =>
                      handleAction(() => resetFilter(unit.uid))
                    }
                    className="text-xs text-warning hover:text-foreground underline"
                  >
                    Reset
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
