// ============================================================================
// Visual packet test modal. Steps through scenario test packets one at a
// time, animating the packet checking each policy in order (visualizing
// first-match-wins) until it matches or falls through to default-deny.
//
// Uses the engine's existing PolicyTraceEntry data (from evaluatePacket) --
// no new engine logic, just a visual layer over data we already compute.
// ============================================================================

import { useState, useEffect } from "react";
import type { TestPacket, PolicyTraceEntry } from "@fortisim/engine";

interface PacketTestModalProps {
  packets: TestPacket[];
  traces: { packet: TestPacket; trace: PolicyTraceEntry[]; finalAction: "ACCEPT" | "DENY" }[];
  onClose: () => void;
}

export function PacketTestModal({ packets, traces, onClose }: PacketTestModalProps) {
  const [index, setIndex] = useState(0);
  const [visibleSteps, setVisibleSteps] = useState(0);
  const [showResult, setShowResult] = useState(false);

  const current = traces[index];

  // Animate: reveal trace steps one by one, then show the final result
  useEffect(() => {
    setVisibleSteps(0);
    setShowResult(false);
    if (!current) return;

    const totalSteps = current.trace.length;
    let step = 0;
    const interval = setInterval(() => {
      step += 1;
      setVisibleSteps(step);
      if (step >= totalSteps) {
        clearInterval(interval);
        setTimeout(() => setShowResult(true), 300);
      }
    }, 450);

    return () => clearInterval(interval);
  }, [index, current]);

  if (!current) return null;

  function goNext() {
    if (index < traces.length - 1) setIndex(index + 1);
  }
  function goPrev() {
    if (index > 0) setIndex(index - 1);
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-md shadow-xl max-w-2xl w-full max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
          <div>
            <div className="text-[13px] font-semibold text-forti-dark">Packet Test</div>
            <div className="text-[11px] text-gray-400">Test {index + 1} of {traces.length}</div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-[20px] leading-none">×</button>
        </div>

        {/* Packet info card */}
        <div className="px-5 py-4">
          <div className="bg-gray-50 border border-gray-200 rounded-md p-3 mb-4">
            <div className="text-[12.5px] font-medium text-gray-800 mb-2">{current.packet.description}</div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11.5px] text-gray-600 font-mono">
              <div>Src: <span className="text-gray-800">{current.packet.srcIp}</span> ({current.packet.srcIntf})</div>
              <div>Dst: <span className="text-gray-800">{current.packet.dstIp}</span> ({current.packet.dstIntf})</div>
              <div>Protocol: <span className="text-gray-800">{current.packet.protocol}</span></div>
              {current.packet.port !== undefined && <div>Port: <span className="text-gray-800">{current.packet.port}</span></div>}
            </div>
          </div>

          {/* Policy checkpoint trace */}
          <div className="space-y-2 mb-4">
            {current.trace.slice(0, visibleSteps).map((step, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 p-2.5 rounded border transition-all ${
                  step.matched ? "border-emerald-300 bg-emerald-50" : "border-gray-200 bg-gray-50"
                }`}
                style={{ animation: "fadeSlideIn 0.3s ease-out" }}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${
                  step.matched ? "bg-emerald-500 text-white" : "bg-gray-300 text-gray-600"
                }`}>
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-medium text-gray-800">{step.policyName}</div>
                  <div className="text-[11px] text-gray-500">{step.reason}</div>
                </div>
                <div className={`text-[10px] px-2 py-0.5 rounded font-semibold shrink-0 ${
                  step.matched ? "bg-emerald-500 text-white" : "bg-gray-200 text-gray-500"
                }`}>
                  {step.matched ? "MATCH" : "no match"}
                </div>
              </div>
            ))}
            {visibleSteps < current.trace.length && (
              <div className="flex items-center gap-2 text-[11px] text-gray-400 px-2.5 py-1">
                <div className="w-2 h-2 rounded-full bg-gray-300 animate-pulse"></div>
                checking next policy…
              </div>
            )}
          </div>

          {/* Final result */}
          {showResult && (
            <div
              className={`flex items-center justify-center gap-3 p-4 rounded-md border-2 ${
                current.finalAction === "ACCEPT"
                  ? "border-emerald-400 bg-emerald-50"
                  : "border-red-400 bg-red-50"
              }`}
              style={{ animation: "popIn 0.35s ease-out" }}
            >
              <span className={`text-[22px] font-bold ${current.finalAction === "ACCEPT" ? "text-emerald-600" : "text-red-600"}`}>
                {current.finalAction === "ACCEPT" ? "✓ ACCEPTED" : "✕ DENIED"}
              </span>
              {current.trace.every((s) => !s.matched) && (
                <span className="text-[11.5px] text-gray-500">(implicit default-deny)</span>
              )}
            </div>
          )}
        </div>

        {/* Footer navigation */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-200 bg-gray-50">
          <button
            onClick={goPrev}
            disabled={index === 0}
            className="px-3 py-1.5 border border-gray-300 rounded-sm text-[12.5px] text-gray-600 hover:bg-white disabled:opacity-30"
          >
            ← Previous
          </button>
          <div className="flex gap-1">
            {traces.map((_, i) => (
              <div key={i} className={`w-1.5 h-1.5 rounded-full ${i === index ? "bg-forti-red" : "bg-gray-300"}`}></div>
            ))}
          </div>
          {index < traces.length - 1 ? (
            <button
              onClick={goNext}
              className="px-3 py-1.5 bg-forti-red text-white rounded-sm text-[12.5px] hover:bg-forti-red/90"
            >
              Next →
            </button>
          ) : (
            <button
              onClick={onClose}
              className="px-3 py-1.5 bg-forti-red text-white rounded-sm text-[12.5px] hover:bg-forti-red/90"
            >
              Done
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateX(-8px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes popIn {
          from { opacity: 0; transform: scale(0.92); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
