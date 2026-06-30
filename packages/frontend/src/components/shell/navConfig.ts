export interface NavItem {
  label: string;
  path: string;
  icon: string;
  children?: NavItem[];
}

export const NAV_STRUCTURE: NavItem[] = [
  { label: "Dashboard", path: "/", icon: "dashboard" },
  {
    label: "Policy & Objects",
    path: "/policy",
    icon: "policy",
    children: [
      { label: "Firewall Policy", path: "/policy/firewall-policy", icon: "" },
      { label: "Addresses", path: "/policy/addresses", icon: "" },
      { label: "Services", path: "/policy/services", icon: "" },
    ],
  },
  {
    label: "Network",
    path: "/network",
    icon: "network",
    children: [
      { label: "Interfaces", path: "/network/interfaces", icon: "" },
    ],
  },
];
