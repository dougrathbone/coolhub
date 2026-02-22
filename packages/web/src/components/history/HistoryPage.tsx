import { useState, useEffect, useCallback } from "react";
import type { HistoryEntry, UnitStatus } from "../../lib/types";
import { fetchHistory, fetchUnits } from "../../lib/api";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { BarChart3, Snowflake } from "lucide-react";
import { cn } from "../../lib/utils";

const TIME_RANGES = [
  { label: "1h", ms: 60 * 60 * 1000 },
  { label: "6h", ms: 6 * 60 * 60 * 1000 },
  { label: "24h", ms: 24 * 60 * 60 * 1000 },
  { label: "7d", ms: 7 * 24 * 60 * 60 * 1000 },
  { label: "30d", ms: 30 * 24 * 60 * 60 * 1000 },
];

const COLORS = [
  "#38bdf8",
  "#f97316",
  "#22c55e",
  "#a855f7",
  "#f43f5e",
  "#eab308",
  "#06b6d4",
  "#ec4899",
];

export function HistoryPage() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [units, setUnits] = useState<UnitStatus[]>([]);
  const [selectedUid, setSelectedUid] = useState<string>("");
  const [timeRange, setTimeRange] = useState(TIME_RANGES[2]!);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [u, h] = await Promise.all([
      fetchUnits(),
      fetchHistory({
        uid: selectedUid || undefined,
        from: Date.now() - timeRange.ms,
        limit: 5000,
      }),
    ]);
    setUnits(u);
    setHistory(h.reverse());
    setLoading(false);
  }, [selectedUid, timeRange]);

  useEffect(() => {
    load();
  }, [load]);

  // Group history by unit for multi-line chart
  const chartData = (() => {
    const timeMap = new Map<number, Record<string, number | string>>();
    for (const entry of history) {
      const ts = entry.timestamp;
      const existing = timeMap.get(ts) ?? { time: ts };
      existing[`${entry.unitUid}_current`] = entry.currentTemp;
      existing[`${entry.unitUid}_set`] = entry.setTemp;
      timeMap.set(ts, existing);
    }
    return Array.from(timeMap.values()).sort(
      (a, b) => (a.time as number) - (b.time as number),
    );
  })();

  const activeUids = selectedUid
    ? [selectedUid]
    : [...new Set(history.map((h) => h.unitUid))];

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    if (timeRange.ms <= 24 * 60 * 60 * 1000) {
      return d.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    return d.toLocaleDateString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Temperature History
          </h1>
          <p className="text-muted text-sm mt-1">
            Track temperature trends over time
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <select
          value={selectedUid}
          onChange={(e) => setSelectedUid(e.target.value)}
          className="px-3 py-2 bg-card border border-border rounded-lg text-sm text-foreground focus:outline-none"
        >
          <option value="">All units</option>
          {units.map((u) => (
            <option key={u.uid} value={u.uid}>
              {u.customName || u.uid}
            </option>
          ))}
        </select>

        <div className="flex gap-1.5">
          {TIME_RANGES.map((tr) => (
            <button
              key={tr.label}
              onClick={() => setTimeRange(tr)}
              className={cn(
                "px-3 py-2 rounded-lg text-xs font-medium transition-colors",
                timeRange === tr
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-muted hover:text-foreground border border-border",
              )}
            >
              {tr.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      {loading ? (
        <div className="flex items-center justify-center h-64 rounded-xl bg-card border border-border">
          <Snowflake className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : history.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 rounded-xl border border-border bg-card">
          <BarChart3 className="w-8 h-8 text-muted mb-3" />
          <p className="text-muted text-sm">No history data yet</p>
          <p className="text-muted-foreground text-xs mt-1">
            Data is recorded every 5 minutes when the server is running
          </p>
        </div>
      ) : (
        <div className="rounded-xl bg-card border border-border p-4">
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.05)"
              />
              <XAxis
                dataKey="time"
                tickFormatter={formatTime}
                stroke="#64748b"
                fontSize={11}
              />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip
                contentStyle={{
                  background: "#1e293b",
                  border: "1px solid #334155",
                  borderRadius: "8px",
                  color: "#f8fafc",
                  fontSize: "12px",
                }}
                labelFormatter={formatTime}
              />
              <Legend />
              {activeUids.map((uid, i) => {
                const unitName =
                  units.find((u) => u.uid === uid)?.customName || uid;
                const color = COLORS[i % COLORS.length]!;
                return [
                  <Line
                    key={`${uid}_current`}
                    type="monotone"
                    dataKey={`${uid}_current`}
                    name={`${unitName} (actual)`}
                    stroke={color}
                    strokeWidth={2}
                    dot={false}
                  />,
                  <Line
                    key={`${uid}_set`}
                    type="stepAfter"
                    dataKey={`${uid}_set`}
                    name={`${unitName} (target)`}
                    stroke={color}
                    strokeWidth={1}
                    strokeDasharray="5 5"
                    dot={false}
                  />,
                ];
              })}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
