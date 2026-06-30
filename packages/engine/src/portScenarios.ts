import { PortScenario } from "./interfaceTypes";

export const portAssignmentScenario: PortScenario = {
  id: "port-assignment-01",
  title: "Port Zone Assignment",
  description:
    "Assign each physical port to the correct zone. " +
    "Ports 1-4 are internal LAN ports (connected to the internal switch). " +
    "Port 5 should be assigned to DMZ for your public-facing servers. " +
    "WAN1 and WAN2 are the internet-facing ports — assign them to WAN. " +
    "Leave unused ports as unassigned.",
  ports: [
    { portId: "port1", label: "1" },
    { portId: "port2", label: "2" },
    { portId: "port3", label: "3" },
    { portId: "port4", label: "4" },
    { portId: "port5", label: "5" },
    { portId: "wan1", label: "W1" },
    { portId: "wan2", label: "W2" },
    { portId: "port6", label: "6" },
  ],
  checks: [
    { portId: "port1", expectedZone: "LAN", description: "Port 1 → LAN (internal switch)" },
    { portId: "port2", expectedZone: "LAN", description: "Port 2 → LAN (internal switch)" },
    { portId: "port3", expectedZone: "LAN", description: "Port 3 → LAN (internal switch)" },
    { portId: "port4", expectedZone: "LAN", description: "Port 4 → LAN (internal switch)" },
    { portId: "port5", expectedZone: "DMZ", description: "Port 5 → DMZ (public server zone)" },
    { portId: "wan1", expectedZone: "WAN", description: "WAN1 → WAN (internet uplink)" },
    { portId: "wan2", expectedZone: "WAN", description: "WAN2 → WAN (backup internet uplink)" },
    { portId: "port6", expectedZone: "unassigned", description: "Port 6 → Unassigned (unused)" },
  ],
};

export const ALL_PORT_SCENARIOS = [portAssignmentScenario];
