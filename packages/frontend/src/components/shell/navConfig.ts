export interface NavItem {
  label: string;
  path: string;
  icon: string;
}

export const NAV_STRUCTURE: NavItem[] = [
  { label: "Tasks", path: "/", icon: "dashboard" },
];
