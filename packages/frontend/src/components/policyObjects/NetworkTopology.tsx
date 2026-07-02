import type { AddressObject } from "@fortisim/engine";

interface NetworkTopologyProps {
  addresses: AddressObject[];
  highlightSystemIds?: string[];
}

interface SystemNode {
  id: string;
  label: string;
  address: AddressObject;
  zone: "WAN" | "LAN" | "DMZ";
}

function inferZone(addr: AddressObject): "WAN" | "LAN" | "DMZ" {
  const v = addr.value.toLowerCase();
  if (v.startsWith("10.0.2") || addr.name.toLowerCase().includes("dmz")) return "DMZ";
  if (v.startsWith("10.0.1") || addr.name.toLowerCase().includes("lan")) return "LAN";
  return "WAN";
}

export function NetworkTopology({ addresses, highlightSystemIds = [] }: NetworkTopologyProps) {
  const systems: SystemNode[] = addresses
    .filter((a) => a.value.toLowerCase() !== "all" && a.value !== "0.0.0.0/0")
    .map((a, i) => ({ id: a.id, label: `System ${i + 1}`, address: a, zone: inferZone(a) }));

  const zones: ("WAN" | "LAN" | "DMZ")[] = ["WAN", "LAN", "DMZ"];
  const zoneColors: Record<string, string> = {
    WAN: "border-orange-300 bg-orange-50",
    LAN: "border-emerald-300 bg-emerald-50",
    DMZ: "border-blue-300 bg-blue-50",
  };
  const zoneDots: Record<string, string> = {
    WAN: "bg-orange-400",
    LAN: "bg-emerald-500",
    DMZ: "bg-blue-400",
  };

  return (
    <div className="bg-white border border-gray-200 rounded-md p-4">
      <div className="text-[12px] font-medium text-gray-600 mb-3 uppercase tracking-wide">Network Topology</div>

      <div className="flex items-start justify-center gap-6">
        {zones.map((zone) => {
          const zoneSystems = systems.filter((s) => s.zone === zone);
          if (zoneSystems.length === 0) return null;
          return (
            <div key={zone} className="flex flex-col items-center gap-2">
              <div className={`text-[10px] font-bold px-2 py-0.5 rounded ${zoneDots[zone]} text-white`}>
                {zone}
              </div>
              <div className="flex flex-col gap-3 items-center">
                {zoneSystems.map((sys) => {
                  const highlighted = highlightSystemIds.includes(sys.id);
                  return (
                    <div key={sys.id} className="flex flex-col items-center">
                      <div
                        className={`relative w-14 h-11 rounded-sm border-2 flex items-center justify-center transition-all ${
                          highlighted ? "border-forti-red bg-red-50 scale-110" : `${zoneColors[zone]}`
                        }`}
                      >
                        <svg width="26" height="20" viewBox="0 0 26 20">
                          <rect x="1" y="1" width="24" height="14" rx="1" fill="none" stroke="currentColor" strokeWidth="1.5" className={highlighted ? "text-forti-red" : "text-gray-500"} />
                          <rect x="9" y="16" width="8" height="2" fill="currentColor" className={highlighted ? "text-forti-red" : "text-gray-400"} />
                          <rect x="6" y="18" width="14" height="1.5" rx="0.5" fill="currentColor" className={highlighted ? "text-forti-red" : "text-gray-400"} />
                        </svg>
                        {highlighted && (
                          <div className="absolute -top-1.5 -right-1.5 w-3 h-3 rounded-full bg-forti-red animate-pulse"></div>
                        )}
                      </div>
                      <div className={`text-[9.5px] font-semibold mt-1 ${highlighted ? "text-forti-red" : "text-gray-600"}`}>
                        {sys.label}
                      </div>
                      <div className="text-[8.5px] text-gray-400 font-mono">{sys.address.value.split("/")[0]}</div>
                    </div>
                  );
                })}
              </div>
              <div className="w-px h-6 bg-gray-300"></div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-center -mt-1">
        <div className="border-2 border-forti-red rounded-md px-4 py-2 bg-white flex items-center gap-2 shadow-sm">
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path d="M9 1.5 15 3.5v5c0 4-3 6.5-6 8-3-1.5-6-4-6-8v-5L9 1.5Z" fill="none" stroke="#DA291C" strokeWidth="1.6" strokeLinejoin="round" />
          </svg>
          <span className="text-[11px] font-bold text-forti-red">FortiGate</span>
        </div>
      </div>
    </div>
  );
}
