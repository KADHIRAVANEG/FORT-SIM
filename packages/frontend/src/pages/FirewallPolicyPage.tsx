// ============================================================================
// The core MVP page: the Firewall Policy table.
//
// Visual layout tightened against real FortiGate 60F reference screenshots:
// toolbar above the table (Create New / Edit / Delete), additional
// display-only columns (NAT, Security Profiles, Type) matching the real
// table's structure. Those three columns are fixed simulated values, NOT
// configurable -- NAT and Security Profiles are deliberately out of scope
// until a later phase (see docs/ROADMAP.md). Showing them as static
// "Disabled" / "—" / "Standard" keeps the table visually authentic without
// pretending those features are functional yet.
// ============================================================================

import { useState } from "react";
import type {
  FirewallPolicy,
  TestPacket,
  InterfaceZone,
} from "@fortisim/engine";
import { evaluatePacket } from "@fortisim/engine";
import { PacketTestModal } from "../components/policyObjects/PacketTestModal";
import { getSubmissionFeedback } from "../api/client";
import { ScenarioSession } from "../hooks/useScenarioSession";

const INTERFACES: InterfaceZone[] = ["WAN", "LAN", "DMZ"];

interface FirewallPolicyPageProps {
  session: ScenarioSession;
}

function emptyPolicyDraft(): Omit<FirewallPolicy, "id"> {
  return {
    name: "",
    srcIntf: "WAN",
    dstIntf: "DMZ",
    srcAddrIds: [],
    dstAddrIds: [],
    serviceIds: [],
    action: "ACCEPT",
    log: false,
    enabled: true,
  };
}

export function FirewallPolicyPage({ session }: FirewallPolicyPageProps) {
  const { scenarioId, scenario, loadError, addresses, services, policies, setPolicies } = session;

  const [draft, setDraft] = useState<Omit<FirewallPolicy, "id">>(emptyPolicyDraft());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedRow, setSelectedRow] = useState<string | null>(null);

  const [testResults, setTestResults] = useState<
    { packet: TestPacket; action: "ACCEPT" | "DENY"; matchedPolicyName: string | null }[]
  >([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTraces, setModalTraces] = useState<{ packet: TestPacket; trace: any[]; finalAction: "ACCEPT" | "DENY" }[]>([]);

  const [grading, setGrading] = useState(false);
  const [gradeReport, setGradeReport] = useState<any>(null);
  const [aiRemark, setAiRemark] = useState<string | null>(null);
  const [gradeError, setGradeError] = useState<string | null>(null);

  function resetDraft() {
    setDraft(emptyPolicyDraft());
    setEditingId(null);
  }

  function startEdit(policy: FirewallPolicy) {
    const { id, ...rest } = policy;
    setDraft(rest);
    setEditingId(id);
    setSelectedRow(id);
  }

  function savePolicy() {
    if (!draft.name.trim()) {
      alert("Policy needs a name.");
      return;
    }
    if (draft.srcAddrIds.length === 0 || draft.dstAddrIds.length === 0 || draft.serviceIds.length === 0) {
      alert("Select at least one source address, destination address, and service.");
      return;
    }
    if (editingId) {
      setPolicies((prev) => prev.map((p) => (p.id === editingId ? { ...draft, id: editingId } : p)));
    } else {
      const newPolicy: FirewallPolicy = { ...draft, id: `p_${Date.now()}` };
      setPolicies((prev) => [...prev, newPolicy]);
    }
    resetDraft();
  }

  function deletePolicy(id: string) {
    setPolicies((prev) => prev.filter((p) => p.id !== id));
    if (editingId === id) resetDraft();
    if (selectedRow === id) setSelectedRow(null);
  }

  function deleteSelected() {
    if (!selectedRow) return;
    deletePolicy(selectedRow);
  }

  function movePolicy(id: string, direction: -1 | 1) {
    setPolicies((prev) => {
      const idx = prev.findIndex((p) => p.id === id);
      const newIdx = idx + direction;
      if (idx === -1 || newIdx < 0 || newIdx >= prev.length) return prev;
      const copy = [...prev];
      [copy[idx], copy[newIdx]] = [copy[newIdx], copy[idx]];
      return copy;
    });
  }

  function toggleMultiSelect(field: "srcAddrIds" | "dstAddrIds" | "serviceIds", id: string) {
    setDraft((prev) => {
      const current = prev[field];
      const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
      return { ...prev, [field]: next };
    });
  }

  function runTestConnectivity() {
    if (!scenario) return;
    const results = scenario.testPackets.map((packet) => {
      const result = evaluatePacket(packet, policies, addresses, services);
      const matched = policies.find((p) => p.id === result.matchedPolicyId);
      return { packet, action: result.finalAction, matchedPolicyName: matched ? matched.name : null };
    });
    setTestResults(results);
  }

  function runVisualPacketTest() {
    if (!scenario) return;
    const traces = scenario.testPackets.map((packet) => {
      const result = evaluatePacket(packet, policies, addresses, services);
      return { packet, trace: result.trace, finalAction: result.finalAction };
    });
    setModalTraces(traces);
    setModalOpen(true);
  }

  async function submitForGrading() {
    setGrading(true);
    setGradeError(null);
    setGradeReport(null);
    setAiRemark(null);
    try {
      const { report, aiRemark } = await getSubmissionFeedback(scenarioId, {
        scenarioId,
        addresses,
        services,
        policies,
      });
      setGradeReport(report);
      setAiRemark(aiRemark);
    } catch (err: any) {
      setGradeError(err.message ?? "Grading request failed");
    } finally {
      setGrading(false);
    }
  }

  function nameForIds(ids: string[], list: { id: string; name: string }[]): string {
    if (ids.length === 0) return "—";
    return ids.map((id) => list.find((x) => x.id === id)?.name ?? id).join(", ");
  }

  if (loadError) {
    return <div className="text-red-600">Failed to load scenario: {loadError}</div>;
  }
  if (!scenario) {
    return <div className="text-gray-500">Loading scenario…</div>;
  }

  return (
    <div className="max-w-6xl">
      <div className="mb-4">
        <h1 className="text-lg font-semibold text-forti-dark">Firewall Policy</h1>
        <p className="text-gray-500 text-[12.5px] mt-0.5">{scenario.title} — {scenario.description}</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-md overflow-hidden mb-5">
        <div className="flex items-center gap-2 px-2 py-1.5 border-b border-gray-200 bg-gray-50">
          <button
            onClick={resetDraft}
            className="text-[12px] px-2.5 py-1 bg-forti-red text-white rounded-sm hover:bg-forti-red/90 flex items-center gap-1"
          >
            <span className="text-[13px] leading-none">+</span> Create New
          </button>
          <button
            onClick={() => {
              const p = policies.find((p) => p.id === selectedRow);
              if (p) startEdit(p);
              else alert("Select a policy row first.");
            }}
            className="text-[12px] px-2.5 py-1 border border-gray-300 rounded-sm text-gray-600 hover:bg-gray-100"
          >
            Edit
          </button>
          <button
            onClick={deleteSelected}
            disabled={!selectedRow}
            className="text-[12px] px-2.5 py-1 border border-gray-300 rounded-sm text-gray-600 hover:bg-gray-100 disabled:opacity-40"
          >
            Delete
          </button>
        </div>

        <table className="w-full text-[12.5px]">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-left border-b border-gray-200">
              <th className="px-3 py-2 font-medium w-10">#</th>
              <th className="px-3 py-2 font-medium">Name</th>
              <th className="px-3 py-2 font-medium">Source Intf</th>
              <th className="px-3 py-2 font-medium">Dest Intf</th>
              <th className="px-3 py-2 font-medium">Source Addr</th>
              <th className="px-3 py-2 font-medium">Dest Addr</th>
              <th className="px-3 py-2 font-medium">Service</th>
              <th className="px-3 py-2 font-medium">Action</th>
              <th className="px-3 py-2 font-medium">NAT</th>
              <th className="px-3 py-2 font-medium">Security Profiles</th>
              <th className="px-3 py-2 font-medium">Log</th>
              <th className="px-3 py-2 font-medium">Type</th>
              <th className="px-3 py-2 font-medium w-20"></th>
            </tr>
          </thead>
          <tbody>
            {policies.length === 0 && (
              <tr>
                <td colSpan={13} className="px-3 py-6 text-center text-gray-400">
                  No policies yet. Use "Create New" below to add one — remember the
                  implicit default-deny applies if nothing matches.
                </td>
              </tr>
            )}
            {policies.map((p, idx) => (
              <tr
                key={p.id}
                onClick={() => setSelectedRow(p.id)}
                className={`border-b border-gray-100 cursor-pointer ${
                  selectedRow === p.id ? "bg-blue-50" : "hover:bg-gray-50"
                }`}
              >
                <td className="px-3 py-2 text-gray-400">{idx + 1}</td>
                <td className="px-3 py-2 font-medium text-gray-800">{p.name}</td>
                <td className="px-3 py-2">{p.srcIntf}</td>
                <td className="px-3 py-2">{p.dstIntf}</td>
                <td className="px-3 py-2">{nameForIds(p.srcAddrIds, addresses)}</td>
                <td className="px-3 py-2">{nameForIds(p.dstAddrIds, addresses)}</td>
                <td className="px-3 py-2">{nameForIds(p.serviceIds, services)}</td>
                <td className="px-3 py-2">
                  <span
                    className={`px-1.5 py-0.5 rounded text-[11px] font-medium ${
                      p.action === "ACCEPT" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                    }`}
                  >
                    {p.action}
                  </span>
                </td>
                <td className="px-3 py-2 text-gray-400">Disabled</td>
                <td className="px-3 py-2 text-gray-400">—</td>
                <td className="px-3 py-2">{p.log ? "On" : "Off"}</td>
                <td className="px-3 py-2 text-gray-400">Standard</td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-1 justify-end">
                    <button onClick={(e) => { e.stopPropagation(); movePolicy(p.id, -1); }} disabled={idx === 0} className="px-1 text-gray-500 hover:text-gray-800 disabled:opacity-30" title="Move up">↑</button>
                    <button onClick={(e) => { e.stopPropagation(); movePolicy(p.id, 1); }} disabled={idx === policies.length - 1} className="px-1 text-gray-500 hover:text-gray-800 disabled:opacity-30" title="Move down">↓</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-3 py-2 text-[11.5px] text-gray-400 border-t border-gray-100 bg-gray-50">
          Implicit rule: any traffic not matched above is denied (default-deny). NAT and Security Profiles are not yet configurable in this simulator.
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-md p-4 mb-5">
        <div className="text-[13px] font-medium text-gray-700 mb-3">
          {editingId ? "Edit Policy" : "New Policy"}
        </div>

        <div className="grid grid-cols-2 gap-4 mb-3">
          <div>
            <label className="block text-[11px] text-gray-500 mb-1">Name</label>
            <input
              type="text"
              value={draft.name}
              onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
              className="w-full border border-gray-300 rounded px-2 py-1.5 text-[12.5px]"
              placeholder="e.g. Allow-HTTPS-to-WebServer"
            />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-[11px] text-gray-500 mb-1">Source Interface</label>
              <select
                value={draft.srcIntf}
                onChange={(e) => setDraft((d) => ({ ...d, srcIntf: e.target.value as InterfaceZone }))}
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-[12.5px]"
              >
                {INTERFACES.map((i) => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-[11px] text-gray-500 mb-1">Dest Interface</label>
              <select
                value={draft.dstIntf}
                onChange={(e) => setDraft((d) => ({ ...d, dstIntf: e.target.value as InterfaceZone }))}
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-[12.5px]"
              >
                {INTERFACES.map((i) => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-3">
          <div>
            <label className="block text-[11px] text-gray-500 mb-1">Source Address (multi-select)</label>
            <div className="border border-gray-300 rounded p-2 max-h-28 overflow-y-auto space-y-1">
              {addresses.map((a) => (
                <label key={a.id} className="flex items-center gap-1.5 text-[12px]">
                  <input
                    type="checkbox"
                    checked={draft.srcAddrIds.includes(a.id)}
                    onChange={() => toggleMultiSelect("srcAddrIds", a.id)}
                  />
                  {a.name} <span className="text-gray-400">({a.value})</span>
                </label>
              ))}
              {addresses.length === 0 && <div className="text-gray-400 text-[12px]">No addresses yet — add one on the Addresses page.</div>}
            </div>
          </div>
          <div>
            <label className="block text-[11px] text-gray-500 mb-1">Dest Address (multi-select)</label>
            <div className="border border-gray-300 rounded p-2 max-h-28 overflow-y-auto space-y-1">
              {addresses.map((a) => (
                <label key={a.id} className="flex items-center gap-1.5 text-[12px]">
                  <input
                    type="checkbox"
                    checked={draft.dstAddrIds.includes(a.id)}
                    onChange={() => toggleMultiSelect("dstAddrIds", a.id)}
                  />
                  {a.name} <span className="text-gray-400">({a.value})</span>
                </label>
              ))}
              {addresses.length === 0 && <div className="text-gray-400 text-[12px]">No addresses yet — add one on the Addresses page.</div>}
            </div>
          </div>
          <div>
            <label className="block text-[11px] text-gray-500 mb-1">Service (multi-select)</label>
            <div className="border border-gray-300 rounded p-2 max-h-28 overflow-y-auto space-y-1">
              {services.map((s) => (
                <label key={s.id} className="flex items-center gap-1.5 text-[12px]">
                  <input
                    type="checkbox"
                    checked={draft.serviceIds.includes(s.id)}
                    onChange={() => toggleMultiSelect("serviceIds", s.id)}
                  />
                  {s.name} <span className="text-gray-400">({s.protocol}{s.port ? `/${s.port}` : ""})</span>
                </label>
              ))}
              {services.length === 0 && <div className="text-gray-400 text-[12px]">No services yet — add one on the Services page.</div>}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-5 mb-4">
          <div className="flex items-center gap-2">
            <label className="text-[11px] text-gray-500">Action</label>
            <select
              value={draft.action}
              onChange={(e) => setDraft((d) => ({ ...d, action: e.target.value as "ACCEPT" | "DENY" }))}
              className="border border-gray-300 rounded px-2 py-1 text-[12.5px]"
            >
              <option value="ACCEPT">ACCEPT</option>
              <option value="DENY">DENY</option>
            </select>
          </div>
          <label className="flex items-center gap-1.5 text-[12.5px] text-gray-600">
            <input
              type="checkbox"
              checked={draft.log}
              onChange={(e) => setDraft((d) => ({ ...d, log: e.target.checked }))}
            />
            Enable logging
          </label>
        </div>

        <div className="flex gap-2">
          <button
            onClick={savePolicy}
            className="px-3 py-1.5 bg-forti-red text-white rounded-sm text-[12.5px] hover:bg-forti-red/90"
          >
            {editingId ? "Save Changes" : "Add Policy"}
          </button>
          {editingId && (
            <button
              onClick={resetDraft}
              className="px-3 py-1.5 border border-gray-300 rounded-sm text-[12.5px] text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-md p-4 mb-5">
        <div className="flex items-center justify-between mb-3">
          <div className="text-[13px] font-medium text-gray-700">Test Connectivity</div>
          <div className="flex gap-2">
            <button
              onClick={runTestConnectivity}
              className="px-3 py-1.5 border border-gray-300 rounded-sm text-[12.5px] text-gray-700 hover:bg-gray-50"
            >
              Run Test Packets
            </button>
            <button
              onClick={runVisualPacketTest}
              className="px-3 py-1.5 bg-forti-red text-white rounded-sm text-[12.5px] hover:bg-forti-red/90"
            >
              Run Packet Test (Visual)
            </button>
          </div>
        </div>
        <p className="text-[11.5px] text-gray-400 mb-2">
          Runs instantly in your browser using the same matching logic as official grading.
          This does not submit or grade your work.
        </p>
        {testResults.length > 0 && (
          <div className="space-y-1.5">
            {testResults.map((r) => (
              <div key={r.packet.id} className="flex items-center justify-between text-[12.5px] border-b border-gray-100 pb-1.5">
                <span className="text-gray-700">{r.packet.description}</span>
                <span className="flex items-center gap-2">
                  <span className={`px-1.5 py-0.5 rounded text-[11px] font-medium ${r.action === "ACCEPT" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                    {r.action}
                  </span>
                  <span className="text-gray-400">
                    {r.matchedPolicyName ? `via "${r.matchedPolicyName}"` : "default-deny"}
                  </span>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-md p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-[13px] font-medium text-gray-700">Submit for Grading</div>
          <button
            onClick={submitForGrading}
            disabled={grading}
            className="px-3 py-1.5 bg-forti-red text-white rounded-sm text-[12.5px] hover:bg-forti-red/90 disabled:opacity-50"
          >
            {grading ? "Grading…" : "Submit"}
          </button>
        </div>

        {gradeError && <div className="text-red-600 text-[12.5px]">{gradeError}</div>}

        {gradeReport && (
          <div>
            <div className={`text-[13px] font-medium mb-2 ${gradeReport.overallPassed ? "text-emerald-600" : "text-red-600"}`}>
              {gradeReport.overallPassed ? "Passed" : "Not yet correct"} — {gradeReport.passedChecks}/{gradeReport.totalChecks} checks
            </div>
            <div className="space-y-1.5 mb-3">
              {gradeReport.diagnostics.map((d: any) => (
                <div key={d.testPacketId} className="flex items-center justify-between text-[12.5px] border-b border-gray-100 pb-1.5">
                  <span className="text-gray-700">{d.description}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[11px] font-medium ${d.passed ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                    {d.passed ? "PASS" : "FAIL"}
                  </span>
                </div>
              ))}
            </div>
            {aiRemark && (
              <div className="bg-amber-50 border border-amber-200 rounded p-3 text-[12.5px] text-amber-900">
                <div className="font-medium mb-1">Tutor feedback</div>
                {aiRemark}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
