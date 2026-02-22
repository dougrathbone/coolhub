import { useState, useEffect, useCallback } from "react";
import type { UnitStatus } from "../../lib/types";
import {
  fetchUnits,
  fetchSystemInfo,
  pingSystem,
  updateUnitConfig,
} from "../../lib/api";
import { Settings, Server, Wifi, WifiOff, Save, Check } from "lucide-react";
import { cn } from "../../lib/utils";

export function SettingsPage() {
  const [units, setUnits] = useState<UnitStatus[]>([]);
  const [systemInfo, setSystemInfo] = useState<Record<string, string>>({});
  const [connected, setConnected] = useState<boolean | null>(null);
  const [editingUid, setEditingUid] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [saved, setSaved] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [u, info, ping] = await Promise.all([
        fetchUnits(),
        fetchSystemInfo().catch(() => ({})),
        pingSystem().catch(() => ({ connected: false })),
      ]);
      setUnits(u);
      setSystemInfo(info);
      setConnected(ping.connected);
    } catch {
      setConnected(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSaveName = async (uid: string) => {
    await updateUnitConfig(uid, { customName: editName || null });
    setEditingUid(null);
    setSaved(uid);
    setTimeout(() => setSaved(null), 2000);
    await load();
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted text-sm mt-1">
          Configure your CoolHub instance
        </p>
      </div>

      {/* Connection Status */}
      <div className="rounded-xl bg-card border border-border p-5 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Server className="w-5 h-5 text-primary" />
          <h2 className="font-semibold text-foreground">CoolMasterNet Connection</h2>
        </div>
        <div className="flex items-center gap-3 mb-4">
          {connected === null ? (
            <span className="text-muted text-sm">Checking...</span>
          ) : connected ? (
            <span className="flex items-center gap-2 text-success text-sm">
              <Wifi className="w-4 h-4" />
              Connected
            </span>
          ) : (
            <span className="flex items-center gap-2 text-destructive text-sm">
              <WifiOff className="w-4 h-4" />
              Disconnected
            </span>
          )}
        </div>

        {Object.keys(systemInfo).length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Object.entries(systemInfo).map(([key, value]) => (
              <div key={key} className="flex justify-between text-sm">
                <span className="text-muted">{key}</span>
                <span className="text-foreground font-mono text-xs">
                  {value}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Unit Naming */}
      <div className="rounded-xl bg-card border border-border p-5">
        <div className="flex items-center gap-3 mb-4">
          <Settings className="w-5 h-5 text-primary" />
          <h2 className="font-semibold text-foreground">Unit Names</h2>
        </div>
        <p className="text-muted text-xs mb-4">
          Give your HVAC units friendly names for easier identification.
        </p>

        <div className="space-y-2">
          {units.map((unit) => (
            <div
              key={unit.uid}
              className="flex items-center justify-between gap-3 py-2.5 px-3 rounded-lg hover:bg-card-hover transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-xs font-mono text-muted bg-background px-2 py-1 rounded">
                  {unit.uid}
                </span>
                {editingUid === unit.uid ? (
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveName(unit.uid);
                      if (e.key === "Escape") setEditingUid(null);
                    }}
                    placeholder="Enter name..."
                    autoFocus
                    className="flex-1 px-2 py-1 bg-background border border-border rounded text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                ) : (
                  <span
                    className={cn(
                      "text-sm cursor-pointer",
                      unit.customName
                        ? "text-foreground"
                        : "text-muted-foreground italic",
                    )}
                    onClick={() => {
                      setEditingUid(unit.uid);
                      setEditName(unit.customName || "");
                    }}
                  >
                    {unit.customName || "Click to name..."}
                  </span>
                )}
              </div>

              {editingUid === unit.uid ? (
                <button
                  onClick={() => handleSaveName(unit.uid)}
                  className="p-1.5 bg-success/10 text-success rounded-lg hover:bg-success/20"
                >
                  <Save className="w-4 h-4" />
                </button>
              ) : saved === unit.uid ? (
                <Check className="w-4 h-4 text-success" />
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
