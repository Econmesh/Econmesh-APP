import {
  Handshake,
  Headphones,
  LayoutDashboard,
  Target,
  type LucideIcon,
} from "lucide-react";

export type DashboardNavItem = {
  href: string;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
};

export const DASHBOARD_NAV_ITEMS: DashboardNavItem[] = [
  { href: "/dashboard", label: "Dashboard", shortLabel: "Início", icon: LayoutDashboard },
  {
    href: "/dashboard/oportunidades",
    label: "Oportunidades",
    shortLabel: "Oportun.",
    icon: Target,
  },
  { href: "/dashboard/acordos", label: "Acordos", shortLabel: "Acordos", icon: Handshake },
  { href: "/dashboard/suporte", label: "Suporte", shortLabel: "Suporte", icon: Headphones },
];

export function isDashboardNavActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
