import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const groups = sqliteTable("groups", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const unitConfig = sqliteTable("unit_config", {
  uid: text("uid").primaryKey(),
  customName: text("custom_name"),
  groupId: integer("group_id").references(() => groups.id, {
    onDelete: "set null",
  }),
  visible: integer("visible", { mode: "boolean" }).notNull().default(true),
  tempMin: real("temp_min"),
  tempMax: real("temp_max"),
});

export const schedules = sqliteTable("schedules", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  unitUid: text("unit_uid"),
  groupId: integer("group_id").references(() => groups.id, {
    onDelete: "cascade",
  }),
  cron: text("cron").notNull(),
  action: text("action", { mode: "json" })
    .notNull()
    .$type<ScheduleAction>(),
  enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
});

export const temperatureHistory = sqliteTable("temperature_history", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  unitUid: text("unit_uid").notNull(),
  timestamp: integer("timestamp", { mode: "timestamp" }).notNull(),
  currentTemp: real("current_temp").notNull(),
  setTemp: real("set_temp").notNull(),
  mode: text("mode").notNull(),
  isOn: integer("is_on", { mode: "boolean" }).notNull(),
});

export interface ScheduleAction {
  power?: "on" | "off";
  mode?: string;
  temperature?: number;
  fanSpeed?: string;
}
