"use client";

import { OpportunityForm } from "@/modules/opportunities/components/opportunity-form";
import type { OpportunityType } from "@/types/api";
import type { ComponentProps } from "react";

type SharedProps = Omit<
	ComponentProps<typeof OpportunityForm>,
	"opportunityType"
> & {
	onChangeType?: () => void;
};

function ComercializacaoOpportunityForm(props: SharedProps) {
	return <OpportunityForm {...props} opportunityType="comercializacao" />;
}

function SimbioseIndustrialOpportunityForm(props: SharedProps) {
	return <OpportunityForm {...props} opportunityType="simbiose_industrial" />;
}

function CompartilhamentoOpportunityForm(props: SharedProps) {
	return <OpportunityForm {...props} opportunityType="compartilhamento" />;
}

export function getOpportunityForm(type: OpportunityType) {
	switch (type) {
		case "comercializacao":
			return ComercializacaoOpportunityForm;
		case "simbiose_industrial":
			return SimbioseIndustrialOpportunityForm;
		case "compartilhamento":
			return CompartilhamentoOpportunityForm;
	}
}
