import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppShell } from "./components/shell/AppShell";
import { TasksPage } from "./pages/TasksPage";
import { FirewallPolicyPage } from "./pages/FirewallPolicyPage";
import { AddressesPage } from "./pages/AddressesPage";
import { ServicesPage } from "./pages/ServicesPage";
import { InterfacesPage } from "./pages/InterfacesPage";
import { useScenarioSession } from "./hooks/useScenarioSession";

export default function App() {
  const session = useScenarioSession();

  return (
    <BrowserRouter>
      <AppShell>
        <Routes>
          <Route path="/" element={<TasksPage session={session} />} />
          <Route path="/policy/firewall-policy" element={<FirewallPolicyPage session={session} />} />
          <Route path="/policy/addresses" element={<AddressesPage session={session} />} />
          <Route path="/policy/services" element={<ServicesPage session={session} />} />
          <Route path="/network/interfaces" element={<InterfacesPage />} />
        </Routes>
      </AppShell>
    </BrowserRouter>
  );
}
