import { Routes, Route } from "react-router-dom";
import { Layout } from "./components/layout/Layout";
import { Dashboard } from "./components/dashboard/Dashboard";
import { GroupsPage } from "./components/group-view/GroupsPage";
import { SchedulesPage } from "./components/schedule/SchedulesPage";
import { HistoryPage } from "./components/history/HistoryPage";
import { SettingsPage } from "./components/settings/SettingsPage";

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="groups" element={<GroupsPage />} />
        <Route path="schedules" element={<SchedulesPage />} />
        <Route path="history" element={<HistoryPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  );
}
