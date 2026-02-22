export interface AppConfig {
  coolmaster: {
    host: string;
    port: number;
    swingSupport: boolean;
  };
  server: {
    port: number;
    host: string;
  };
  polling: {
    intervalMs: number;
    historyIntervalMs: number;
  };
  db: {
    path: string;
  };
}

export function loadConfig(): AppConfig {
  return {
    coolmaster: {
      host: process.env["COOLMASTER_HOST"] ?? "192.168.1.100",
      port: parseInt(process.env["COOLMASTER_PORT"] ?? "10102", 10),
      swingSupport: process.env["COOLMASTER_SWING"] === "true",
    },
    server: {
      port: parseInt(process.env["PORT"] ?? "3000", 10),
      host: process.env["HOST"] ?? "0.0.0.0",
    },
    polling: {
      intervalMs: parseInt(
        process.env["POLL_INTERVAL_MS"] ?? "10000",
        10,
      ),
      historyIntervalMs: parseInt(
        process.env["HISTORY_INTERVAL_MS"] ?? "300000",
        10,
      ),
    },
    db: {
      path: process.env["DB_PATH"] ?? "./coolhub.db",
    },
  };
}
