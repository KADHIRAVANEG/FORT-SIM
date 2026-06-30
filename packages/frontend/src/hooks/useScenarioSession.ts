// ============================================================================
// Shared scenario session state: holds which scenario is currently active,
// fetches it from the backend, and holds the student's working copy of
// addresses, services, and policies for that scenario. Lifted up to
// App.tsx and passed down to every Policy & Objects page so they all read
// and write the same in-memory data.
//
// Switching scenarios (selectScenario) intentionally resets the working
// policy/address/service state -- mixing address/service IDs from one
// scenario into another scenario's policies would silently break matching,
// since IDs aren't guaranteed unique or meaningful across scenarios.
//
// State is in-memory only for Phase 1: refreshing the browser resets
// progress. Persistence is a deliberate later phase.
// ============================================================================

import { useEffect, useState, Dispatch, SetStateAction, useCallback } from "react";
import type { AddressObject, ServiceObject, FirewallPolicy, TestPacket } from "@fortisim/engine";
import { fetchScenario } from "../api/client";

export const DEFAULT_SCENARIO_ID = "web-server-access-01";

export interface ScenarioData {
  id: string;
  title: string;
  description: string;
  starterAddresses: AddressObject[];
  starterServices: ServiceObject[];
  testPackets: TestPacket[];
}

export interface ScenarioSession {
  scenarioId: string;
  scenario: ScenarioData | null;
  loadError: string | null;
  addresses: AddressObject[];
  services: ServiceObject[];
  policies: FirewallPolicy[];
  setAddresses: Dispatch<SetStateAction<AddressObject[]>>;
  setServices: Dispatch<SetStateAction<ServiceObject[]>>;
  setPolicies: Dispatch<SetStateAction<FirewallPolicy[]>>;
  selectScenario: (id: string) => void;
}

export function useScenarioSession(): ScenarioSession {
  const [scenarioId, setScenarioId] = useState<string>(DEFAULT_SCENARIO_ID);
  const [scenario, setScenario] = useState<ScenarioData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [addresses, setAddresses] = useState<AddressObject[]>([]);
  const [services, setServices] = useState<ServiceObject[]>([]);
  const [policies, setPolicies] = useState<FirewallPolicy[]>([]);

  useEffect(() => {
    let cancelled = false;
    setScenario(null);
    setLoadError(null);

    fetchScenario(scenarioId)
      .then((data: ScenarioData) => {
        if (cancelled) return;
        setScenario(data);
        setAddresses(data.starterAddresses);
        setServices(data.starterServices);
        setPolicies([]);
      })
      .catch((err) => {
        if (cancelled) return;
        setLoadError(err.message ?? "Failed to load scenario");
      });

    return () => {
      cancelled = true;
    };
  }, [scenarioId]);

  const selectScenario = useCallback((id: string) => {
    setScenarioId(id);
  }, []);

  return {
    scenarioId,
    scenario,
    loadError,
    addresses,
    services,
    policies,
    setAddresses,
    setServices,
    setPolicies,
    selectScenario,
  };
}
