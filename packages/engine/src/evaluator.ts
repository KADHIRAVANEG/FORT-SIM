// ============================================================================
// The Evaluator: first-match-wins policy evaluation.
// Used by BOTH the frontend's local "test connectivity" tool AND the
// backend's authoritative grading. One implementation only.
// ============================================================================

import {
  AddressObject,
  FirewallPolicy,
  ServiceObject,
  TestPacket,
} from "./types";
import { ipMatchesAddressValue, portMatchesServiceValue } from "./matching";

export interface PolicyTraceEntry {
  policyId: string;
  policyName: string;
  matched: boolean;
  reason: string;
}

export interface EvaluationResult {
  packetId: string;
  finalAction: "ACCEPT" | "DENY";
  matchedPolicyId: string | null;
  loggedByPolicy: boolean;
  trace: PolicyTraceEntry[];
}

function buildLookup<T extends { id: string }>(items: T[]): Map<string, T> {
  return new Map(items.map((item) => [item.id, item]));
}

function policyMatchesPacket(
  policy: FirewallPolicy,
  packet: TestPacket,
  addressLookup: Map<string, AddressObject>,
  serviceLookup: Map<string, ServiceObject>
): { matched: boolean; reason: string } {
  if (!policy.enabled) {
    return { matched: false, reason: "policy is disabled" };
  }

  if (policy.srcIntf !== packet.srcIntf) {
    return {
      matched: false,
      reason: `source interface mismatch (policy: ${policy.srcIntf}, packet: ${packet.srcIntf})`,
    };
  }
  if (policy.dstIntf !== packet.dstIntf) {
    return {
      matched: false,
      reason: `destination interface mismatch (policy: ${policy.dstIntf}, packet: ${packet.dstIntf})`,
    };
  }

  const srcAddrMatch = policy.srcAddrIds.some((id) => {
    const addr = addressLookup.get(id);
    if (!addr) return false;
    return ipMatchesAddressValue(packet.srcIp, addr.type, addr.value);
  });
  if (!srcAddrMatch) {
    return { matched: false, reason: "source address does not match any policy source object" };
  }

  const dstAddrMatch = policy.dstAddrIds.some((id) => {
    const addr = addressLookup.get(id);
    if (!addr) return false;
    return ipMatchesAddressValue(packet.dstIp, addr.type, addr.value);
  });
  if (!dstAddrMatch) {
    return { matched: false, reason: "destination address does not match any policy destination object" };
  }

  const serviceMatch = policy.serviceIds.some((id) => {
    const svc = serviceLookup.get(id);
    if (!svc) return false;
    if (svc.protocol !== packet.protocol) return false;
    if (svc.protocol === "ICMP") return true;
    if (!svc.port || packet.port === undefined) return false;
    return portMatchesServiceValue(packet.port, svc.port);
  });
  if (!serviceMatch) {
    return { matched: false, reason: "protocol/port does not match any policy service object" };
  }

  return { matched: true, reason: "all match criteria satisfied" };
}

export function evaluatePacket(
  packet: TestPacket,
  policies: FirewallPolicy[],
  addresses: AddressObject[],
  services: ServiceObject[]
): EvaluationResult {
  const addressLookup = buildLookup(addresses);
  const serviceLookup = buildLookup(services);
  const trace: PolicyTraceEntry[] = [];

  for (const policy of policies) {
    const { matched, reason } = policyMatchesPacket(policy, packet, addressLookup, serviceLookup);
    trace.push({
      policyId: policy.id,
      policyName: policy.name,
      matched,
      reason,
    });
    if (matched) {
      return {
        packetId: packet.id,
        finalAction: policy.action,
        matchedPolicyId: policy.id,
        loggedByPolicy: policy.log,
        trace,
      };
    }
  }

  return {
    packetId: packet.id,
    finalAction: "DENY",
    matchedPolicyId: null,
    loggedByPolicy: false,
    trace,
  };
}

export function evaluateAll(
  packets: TestPacket[],
  policies: FirewallPolicy[],
  addresses: AddressObject[],
  services: ServiceObject[]
): EvaluationResult[] {
  return packets.map((p) => evaluatePacket(p, policies, addresses, services));
}
