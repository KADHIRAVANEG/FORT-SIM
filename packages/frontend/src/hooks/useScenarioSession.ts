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
  completedTaskIds: Set<string>;
  markTaskComplete: (taskId: string) => void;
}

export function useScenarioSession(): ScenarioSession {
  const [scenarioId, setScenarioId] = useState<string>(DEFAULT_SCENARIO_ID);
  const [scenario, setScenario] = useState<ScenarioData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [addresses, setAddresses] = useState<AddressObject[]>([]);
  const [services, setServices] = useState<ServiceObject[]>([]);
  const [policies, setPolicies] = useState<FirewallPolicy[]>([]);

  const [completedTaskIds, setCompletedTaskIds] = useState<Set<string>>(new Set());

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

  const markTaskComplete = useCallback((taskId: string) => {
    setCompletedTaskIds((prev) => {
      if (prev.has(taskId)) return prev;
      const next = new Set(prev);
      next.add(taskId);
      return next;
    });
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
    completedTaskIds,
    markTaskComplete,
  };
}
