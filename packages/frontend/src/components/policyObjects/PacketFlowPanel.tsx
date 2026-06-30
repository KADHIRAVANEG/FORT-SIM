import { useState, useEffect } from "react";
import type { TestPacket, PolicyTraceEntry } from "@fortisim/engine";

interface PacketFlowPanelProps {
  traces: { packet: TestPacket; trace: PolicyTraceEntry[]; finalAction: "ACCEPT" | "DENY" }[];
}

export function PacketFlowPanel({ traces }: PacketFlowPanelProps) {
  const [index, setIndex] = useState(0);
  const [visibleSteps, setVisibleSteps] = useState(0);
  const [showResult, setShowResult] = useState(false);

  const current = traces[index];

  useEffect(() => {
    setIndex(0);
  }, [traces.length]);

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
    }, 400);

    return () => clearInterval(interval);
  }, [index, current]);

  if (traces.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-md p-5 text-center">
        <div className="text-[12.5px] text-gray-400">
          Click "Run Packet Test (Visual)" below to see test packets flow through your policies.
        </div>
      </div>
    );
  }

  if (!current) return null;

  function goNext() {
    if (index < traces.length - 1) setIndex(index + 1);
  }
  function goPrev() {
    if (index > 0) setIndex(index - 1);
  }

  return (
    <div className="bg-white border border-gray-200 rounded-md overflow-hidden sticky top-4">
      <div className="px-4 py-2.5 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
        <span className="text-[13px] font-semibold text-forti-dark">Packet Flow</span>
        <span className="text-[11px] text-gray-400">{index + 1} / {traces.length}</span>
      </div>

      <div className="p-4">
        <div className="bg-gray-50 border border-gray-200 rounded-md p-3 mb-3">
          <div className="text-[12px] font-medium text-gray-800 mb-1.5">{current.packet.description}</div>
          <div className="text-[11px] text-gray-600 font-mono leading-relaxed">
            <div>{current.packet.srcIp} ({current.packet.srcIntf}) → {current.packet.dstIp} ({current.packet.dstIntf})</div>
            <div>{current.packet.protocol}{current.packet.port !== undefined ? `/${current.packet.port}` : ""}</div>
          </div>
        </div>

        <div className="space-y-1.5 mb-3">
          {current.trace.slice(0, visibleSteps).map((step, i) => (
            <div
              key={i}
              className={`flex items-start gap-2 p-2 rounded border text-[11px] ${
                step.matched ? "border-emerald-300 bg-emerald-50" : "border-gray-200 bg-gray-50"
              }`}
              style={{ animation: "fadeSlideIn 0.25s ease-out" }}
            >
              <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 mt-0.5 ${
                step.matched ? "bg-emerald-500 text-white" : "bg-gray-300 text-gray-600"
              }`}>
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-800">{step.policyName}</div>
                <div className="text-gray-500">{step.reason}</div>
              </div>
            </div>
          ))}
          {visibleSteps < current.trace.length && (
            <div className="flex items-center gap-2 text-[10.5px] text-gray-400 px-2 py-1">
              <div className="w-1.5 h-1.5 rounded-full bg-gray-300 animate-pulse"></div>
              checking…
            </div>
          )}
        </div>

        {showResult && (
          <div
            className={`flex items-center justify-center gap-2 p-3 rounded-md border-2 mb-3 ${
              current.finalAction === "ACCEPT" ? "border-emerald-400 bg-emerald-50" : "border-red-400 bg-red-50"
            }`}
            style={{ animation: "popIn 0.3s ease-out" }}
          >
            <span className={`text-[15px] font-bold ${current.finalAction === "ACCEPT" ? "text-emerald-600" : "text-red-600"}`}>
              {current.finalAction === "ACCEPT" ? "✓ ACCEPTED" : "✕ DENIED"}
            </span>
            {current.trace.every((s) => !s.matched) && (
              <span className="text-[10px] text-gray-500">(default-deny)</span>
            )}
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <button
            onClick={goPrev}
            disabled={index === 0}
            className="px-2 py-1 border border-gray-300 rounded-sm text-[11px] text-gray-600 hover:bg-gray-50 disabled:opacity-30"
          >
            ← Prev
          </button>
          <div className="flex gap-1">
            {traces.map((_, i) => (
              <div key={i} className={`w-1.5 h-1.5 rounded-full ${i === index ? "bg-forti-red" : "bg-gray-300"}`}></div>
            ))}
          </div>
          <button
            onClick={goNext}
            disabled={index === traces.length - 1}
            className="px-2 py-1 border border-gray-300 rounded-sm text-[11px] text-gray-600 hover:bg-gray-50 disabled:opacity-30"
          >
            Next →
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateX(-6px); }
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
