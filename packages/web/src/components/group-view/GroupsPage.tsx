import { useState, useEffect, useCallback } from "react";
import type { Group, UnitStatus } from "../../lib/types";
import {
  fetchGroups,
  fetchUnits,
  createGroup,
  deleteGroup,
  updateUnitConfig,
  setPower,
} from "../../lib/api";
import { cn, formatTemp } from "../../lib/utils";
import {
  FolderOpen,
  Plus,
  Trash2,
  ChevronRight,
  X,
} from "lucide-react";

export function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [units, setUnits] = useState<UnitStatus[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [assigningUnit, setAssigningUnit] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [g, u] = await Promise.all([fetchGroups(), fetchUnits()]);
    setGroups(g);
    setUnits(u);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    await createGroup(newName.trim());
    setNewName("");
    setShowCreate(false);
    await load();
  };

  const handleDelete = async (id: number) => {
    await deleteGroup(id);
    await load();
  };

  const handleAssign = async (uid: string, groupId: number | null) => {
    await updateUnitConfig(uid, { groupId });
    setAssigningUnit(null);
    await load();
  };

  const handleGroupPower = async (group: Group, power: boolean) => {
    for (const uid of group.unitUids) {
      await setPower(uid, power);
    }
  };

  const ungroupedUnits = units.filter(
    (u) => !groups.some((g) => g.unitUids.includes(u.uid)),
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Rooms & Zones</h1>
          <p className="text-muted text-sm mt-1">
            Organize your units into groups
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Room
        </button>
      </div>

      {/* Create Dialog */}
      {showCreate && (
        <div className="mb-4 p-4 rounded-xl bg-card border border-border">
          <div className="flex gap-3">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Room name..."
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <button
              onClick={handleCreate}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium"
            >
              Create
            </button>
            <button
              onClick={() => setShowCreate(false)}
              className="px-3 py-2 bg-card-hover rounded-lg text-muted hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Groups */}
      <div className="space-y-4">
        {groups.map((group) => {
          const groupUnits = units.filter((u) =>
            group.unitUids.includes(u.uid),
          );
          const activeCount = groupUnits.filter((u) => u.isOn).length;

          return (
            <div
              key={group.id}
              className="rounded-xl bg-card border border-border overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <FolderOpen className="w-5 h-5 text-primary" />
                  <div>
                    <h3 className="font-semibold text-foreground">
                      {group.name}
                    </h3>
                    <p className="text-xs text-muted">
                      {groupUnits.length} unit{groupUnits.length !== 1 ? "s" : ""}{" "}
                      &middot; {activeCount} active
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {groupUnits.length > 0 && (
                    <>
                      <button
                        onClick={() => handleGroupPower(group, true)}
                        className="px-3 py-1.5 text-xs bg-success/10 text-success rounded-lg hover:bg-success/20"
                      >
                        All On
                      </button>
                      <button
                        onClick={() => handleGroupPower(group, false)}
                        className="px-3 py-1.5 text-xs bg-slate-700 text-muted rounded-lg hover:bg-slate-600"
                      >
                        All Off
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => handleDelete(group.id)}
                    className="p-1.5 text-muted hover:text-destructive rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {groupUnits.length > 0 ? (
                <div className="divide-y divide-white/5">
                  {groupUnits.map((unit) => (
                    <div
                      key={unit.uid}
                      className="flex items-center justify-between px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "w-2 h-2 rounded-full",
                            unit.isOn ? "bg-success" : "bg-slate-600",
                          )}
                        />
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {unit.customName || unit.uid}
                          </p>
                          <p className="text-xs text-muted">{unit.uid}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm tabular-nums text-foreground">
                          {formatTemp(unit.temperature, unit.temperatureUnit)}
                        </span>
                        <button
                          onClick={() =>
                            handleAssign(unit.uid, null)
                          }
                          className="text-xs text-muted hover:text-foreground"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-muted text-sm">
                  No units assigned. Click a unit below to add it.
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Ungrouped Units */}
      {ungroupedUnits.length > 0 && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold text-foreground mb-3">
            Ungrouped Units
          </h2>
          <div className="rounded-xl bg-card border border-border divide-y divide-white/5">
            {ungroupedUnits.map((unit) => (
              <div
                key={unit.uid}
                className="flex items-center justify-between px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "w-2 h-2 rounded-full",
                      unit.isOn ? "bg-success" : "bg-slate-600",
                    )}
                  />
                  <p className="text-sm font-medium text-foreground">
                    {unit.customName || unit.uid}
                  </p>
                </div>

                {assigningUnit === unit.uid ? (
                  <div className="flex items-center gap-2">
                    {groups.map((g) => (
                      <button
                        key={g.id}
                        onClick={() => handleAssign(unit.uid, g.id)}
                        className="px-3 py-1 text-xs bg-primary/10 text-primary rounded-lg hover:bg-primary/20"
                      >
                        {g.name}
                      </button>
                    ))}
                    <button
                      onClick={() => setAssigningUnit(null)}
                      className="p-1 text-muted"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setAssigningUnit(unit.uid)}
                    className="flex items-center gap-1 text-xs text-muted hover:text-primary"
                  >
                    Assign to room
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
