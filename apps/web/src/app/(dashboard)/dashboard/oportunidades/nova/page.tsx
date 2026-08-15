"use client";

import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { getOpportunityForm } from "@/modules/opportunities/components/opportunity-forms";
import { OpportunityTypePicker } from "@/modules/opportunities/components/opportunity-type-picker";
import { OPPORTUNITY_TYPE_LABELS } from "@/modules/opportunities/constants";
import { opportunitiesService } from "@/services/opportunities/opportunities.service";
import type { OpportunityType } from "@/types/api";

export default function NovaOportunidadePage() {
	const router = useRouter();
	const [selectedType, setSelectedType] = useState<OpportunityType | null>(null);
	const Form = selectedType ? getOpportunityForm(selectedType) : null;

	return (
		<div className="space-y-6">
			<div>
				<p className="text-sm text-muted-foreground">
					<Link href="/dashboard/oportunidades" className="hover:underline">
						Oportunidades
					</Link>
					{" / "}Nova oportunidade
				</p>
				<h1 className="mt-1 text-2xl font-semibold">Publicar oportunidade</h1>
				<p className="text-sm text-muted-foreground">
					{selectedType
						? `Formulário de ${OPPORTUNITY_TYPE_LABELS[selectedType].toLowerCase()}.`
						: "Escolha o tipo de oportunidade para continuar."}
				</p>
			</div>

			{selectedType && Form ? (
				<Form
					mode="create"
					onChangeType={() => setSelectedType(null)}
					submitLabel="Publicar oportunidade"
					onSubmit={async (payload) => {
						const opportunity = await opportunitiesService.create(payload);
						toast.success("Oportunidade publicada com sucesso.");
						router.push(`/dashboard/oportunidades/${opportunity.id}` as Route);
					}}
				/>
			) : (
				<OpportunityTypePicker onSelect={setSelectedType} />
			)}
		</div>
	);
}
