// ============================================================================
// FortiSim Core Data Model
// This is the single source of truth for what an "address", "service",
// "policy", and "scenario" mean across the entire system: frontend GUI,
// backend grading, and (later) other tool simulators.
// ============================================================================

/** Protocols we support matching on in v1. Kept small and explicit on purpose. */
export type Protocol = "TCP" | "UDP" | "ICMP";

/**
 * An Address object, mirroring FortiGate's Firewall Address concept.
 * v1 supports subnet (CIDR) and range; "any" is represented as a reserved
 * built-in object, not a special case in the type.
 */
export interface AddressObject {
  id: string;          // stable internal id, e.g. "addr_dmz_web01"
  name: string;         // display name shown in GUI, e.g. "DMZ-Web01"
  type: "subnet" | "range";
  // subnet: "10.0.1.10/32" or "10.0.1.0/24"
  // range: "10.0.1.10-10.0.1.20"
  value: string;
  comment?: string;
}

/**
 * A Service object, mirroring FortiGate's Firewall Service concept.
 * Port can be a single port or a range expressed as "start-end".
 */
export interface ServiceObject {
  id: string;            // e.g. "svc_https"
  name: string;          // e.g. "HTTPS"
  protocol: Protocol;
  port?: string;         // e.g. "443" or "1024-65535". Omitted for ICMP.
  comment?: string;
}

/** The interface/zone a policy applies between. Fixed small topology in v1. */
export type InterfaceZone = "WAN" | "LAN" | "DMZ";

/**
 * A single firewall policy rule, mirroring FortiGate's Firewall Policy.
 * Order in the Scenario/session's policy list IS the evaluation order
 * (first match wins) -- there is no separate priority field.
 */
export interface FirewallPolicy {
  id: string;
  name: string;
  srcIntf: InterfaceZone;
  dstIntf: InterfaceZone;
  srcAddrIds: string[];     // references AddressObject.id, multiple = OR
  dstAddrIds: string[];     // references AddressObject.id, multiple = OR
  serviceIds: string[];     // references ServiceObject.id, multiple = OR
  action: "ACCEPT" | "DENY";
  log: boolean;
  enabled: boolean;          // disabled policies are skipped during matching
}

/** A single test packet used to probe a policy list's behavior. */
export interface TestPacket {
  id: string;
  description: string;       // human readable, e.g. "HTTPS from DMZ to WebServer"
  srcIntf: InterfaceZone;
  dstIntf: InterfaceZone;
  srcIp: string;              // single concrete IP, e.g. "10.0.2.15"
  dstIp: string;
  protocol: Protocol;
  port?: number;               // concrete port, omitted for ICMP
}

/** What we expect a given TestPacket to result in, against the correct config. */
export interface ExpectedOutcome {
  testPacketId: string;
  expectedAction: "ACCEPT" | "DENY";
  expectedLog?: boolean;       // optional: only check log behavior if specified
}

/**
 * A Scenario is the instructor-authored "assignment". It is pure data:
 * no model answer config is stored, only the *behavioral* expectations.
 * This is what makes the grading model "behavioral equivalence" rather
 * than exact-config matching, and what makes scenarios portable to other
 * tools later (the shape doesn't change, only what a "policy" means does).
 */
export interface Scenario {
  id: string;
  title: string;
  description: string;          // shown to student, sets up the task
  topologyNote?: string;         // optional short text describing WAN/LAN/DMZ layout
  starterAddresses: AddressObject[];   // pre-seeded objects student can use/extend
  starterServices: ServiceObject[];
  testPackets: TestPacket[];
  expectedOutcomes: ExpectedOutcome[]; // the actual "answer key", server-side only
}

/** A student's submitted work for a scenario: just their object + policy lists. */
export interface StudentSubmission {
  scenarioId: string;
  addresses: AddressObject[];
  services: ServiceObject[];
  policies: FirewallPolicy[];   // order matters: index 0 evaluated first
}
