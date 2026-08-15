import {
	CircleDollarSign,
	Handshake,
	RefreshCw,
	type LucideIcon,
} from "lucide-react";

import type { OpportunityType } from "@/types/api";

export const OPPORTUNITY_TYPE_ICONS: Record<OpportunityType, LucideIcon> = {
	comercializacao: CircleDollarSign,
	simbiose_industrial: RefreshCw,
	compartilhamento: Handshake,
};
