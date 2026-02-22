import { useUnits } from "../../hooks/useUnits";
import { UnitCard } from "../unit-card/UnitCard";
import { Snowflake, Wifi, WifiOff, AlertTriangle } from "lucide-react";
import { cn } from "../../lib/utils";

export function Dashboard() {
  const { units, loading, error, connected } = useUnits();

  const onCount = units.filter((u) => u.isOn).length;
  const errorCount = units.filter((u) => u.errorCode).length;
  const filterCount = units.filter((u) => u.cleanFilter).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <Snowflake className="w-10 h-10 text-primary animate-spin" />
          <p className="text-muted text-sm">Connecting to CoolMasterNet...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3 text-center">
          <AlertTriangle className="w-10 h-10 text-warning" />
          <p className="text-foreground font-medium">Connection Error</p>
          <p className="text-muted text-sm max-w-md">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted text-sm mt-1">
            {units.length} unit{units.length !== 1 ? "s" : ""} &middot;{" "}
            {onCount} active
          </p>
        </div>
        <div className="flex items-center gap-2">
          {(errorCount > 0 || filterCount > 0) && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-warning/10 text-warning text-xs font-medium rounded-full">
              <AlertTriangle className="w-3.5 h-3.5" />
              {errorCount > 0 && `${errorCount} error${errorCount > 1 ? "s" : ""}`}
              {errorCount > 0 && filterCount > 0 && " · "}
              {filterCount > 0 && `${filterCount} filter${filterCount > 1 ? "s" : ""}`}
            </span>
          )}
          <span
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full",
              connected
                ? "bg-success/10 text-success"
                : "bg-destructive/10 text-destructive",
            )}
          >
            {connected ? (
              <Wifi className="w-3.5 h-3.5" />
            ) : (
              <WifiOff className="w-3.5 h-3.5" />
            )}
            {connected ? "Live" : "Offline"}
          </span>
        </div>
      </div>

      {/* Unit Cards Grid */}
      {units.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 rounded-xl border border-border bg-card">
          <Snowflake className="w-8 h-8 text-muted mb-3" />
          <p className="text-muted text-sm">No HVAC units found</p>
          <p className="text-muted-foreground text-xs mt-1">
            Check your CoolMasterNet connection
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {units
            .filter((u) => u.visible)
            .map((unit) => (
              <UnitCard key={unit.uid} unit={unit} />
            ))}
        </div>
      )}
    </div>
  );
}
