import { useState, useEffect, useCallback } from "react";
import type { UnitStatus } from "../lib/types";
import { fetchUnits } from "../lib/api";
import { useWebSocket } from "./useWebSocket";

export function useUnits() {
  const [units, setUnits] = useState<UnitStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadUnits = useCallback(async () => {
    try {
      const data = await fetchUnits();
      setUnits(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load units");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleStatusUpdate = useCallback((updatedUnits: UnitStatus[]) => {
    setUnits(updatedUnits);
  }, []);

  const { connected } = useWebSocket(handleStatusUpdate);

  useEffect(() => {
    loadUnits();
  }, [loadUnits]);

  return { units, loading, error, connected, refresh: loadUnits };
}
