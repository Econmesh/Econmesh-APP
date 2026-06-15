"use client";

import { Badge } from "@econmesh-app/ui/components/badge";
import { Button } from "@econmesh-app/ui/components/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@econmesh-app/ui/components/card";
import {
	Building2,
	Calendar,
	MapPin,
	MessageCircle,
	Package,
	Pencil,
	Trash2,
} from "lucide-react";
import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { DeleteOpportunityDialog } from "@/modules/opportunities/components/delete-opportunity-dialog";
import {
	OFFER_DEMAND_LABELS,
	OPPORTUNITY_TYPE_LABELS,
	PERIODICITY_LABELS,
} from "@/modules/opportunities/constants";
import {
	formatPriceDisplay,
	formatQuantity,
} from "@/modules/opportunities/schemas";
import type { Opportunity } from "@/types/api";

type OpportunityDetailViewProps = {
	opportunity: Opportunity;
	onDeleted: () => void;
	isOwner?: boolean;
};

function DetailItem({
	label,
	value,
}: {
	label: string;
	value?: string | null;
}) {
	if (!value) return null;
	return (
		<div>
			<dt className="font-medium text-muted-foreground text-xs">{label}</dt>
			<dd className="mt-1 text-sm">{value}</dd>
		</div>
	);
}

export function OpportunityDetailView({
	opportunity,
	onDeleted,
	isOwner = false,
}: OpportunityDetailViewProps) {
	const [selectedImage, setSelectedImage] = useState(0);
	const [showDelete, setShowDelete] = useState(false);

	const images = opportunity.images.length > 0 ? opportunity.images : [];
	const currentImage = images[selectedImage];

	function handleContact() {
		toast.info(
			"Em breve você poderá entrar em contato diretamente pelo chat.",
			{
				description: "Integração com chat em desenvolvimento.",
			},
		);
	}

	return (
		<>
			<div className="space-y-6">
				<div className="flex flex-wrap items-start justify-between gap-4">
					<div className="space-y-2">
						<div className="flex flex-wrap gap-2">
							<Badge variant="info">
								{OPPORTUNITY_TYPE_LABELS[opportunity.opportunity_type]}
							</Badge>
							<Badge
								variant={
									opportunity.offer_demand === "gerador" ? "success" : "warning"
								}
							>
								{OFFER_DEMAND_LABELS[opportunity.offer_demand]}
							</Badge>
						</div>
						<h1 className="font-semibold text-2xl">{opportunity.title}</h1>
						<div className="flex items-center gap-2 text-muted-foreground text-sm">
							<Building2 className="size-4" aria-hidden />
							{opportunity.company_name}
						</div>
					</div>

					{isOwner ? (
						<div className="flex flex-wrap gap-2">
							<Link
								href={
									`/dashboard/oportunidades/${opportunity.id}/editar` as Route
								}
								className="inline-flex"
							>
								<Button variant="outline">
									<Pencil className="size-4" aria-hidden />
									Editar
								</Button>
							</Link>
							<Button variant="destructive" onClick={() => setShowDelete(true)}>
								<Trash2 className="size-4" aria-hidden />
								Excluir
							</Button>
						</div>
					) : (
						<Button onClick={handleContact}>
							<MessageCircle className="size-4" aria-hidden />
							Entrar em contato
						</Button>
					)}
				</div>

				<div className="grid gap-6 lg:grid-cols-2">
					<div className="space-y-3">
						<div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-border bg-muted">
							{currentImage ? (
								<Image
									src={currentImage.url}
									alt={opportunity.title}
									fill
									className="object-cover"
									unoptimized
									priority
								/>
							) : (
								<div className="flex size-full items-center justify-center">
									<Package
										className="size-16 text-muted-foreground/50"
										aria-hidden
									/>
								</div>
							)}
						</div>
						{images.length > 1 ? (
							<div className="flex gap-2 overflow-x-auto">
								{images.map((image, index) => (
									<button
										key={image.storage_key}
										type="button"
										onClick={() => setSelectedImage(index)}
										className={`relative size-16 shrink-0 overflow-hidden border-2 transition-colors ${
											index === selectedImage
												? "border-primary"
												: "border-border"
										}`}
									>
										<Image
											src={image.url}
											alt={`${opportunity.title} - ${index + 1}`}
											fill
											className="object-cover"
											unoptimized
										/>
									</button>
								))}
							</div>
						) : null}
					</div>

					<div className="space-y-4">
						<Card className="rounded-xl">
							<CardHeader>
								<CardTitle className="text-lg">Resumo</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="flex items-baseline justify-between">
									<span className="text-muted-foreground text-sm">Valor</span>
									<span className="font-bold text-2xl text-primary">
										{formatPriceDisplay(
											opportunity.price,
											opportunity.price_negotiable,
										)}
									</span>
								</div>
								<div className="flex items-baseline justify-between">
									<span className="text-muted-foreground text-sm">
										Quantidade
									</span>
									<span className="font-semibold text-lg">
										{formatQuantity(opportunity.quantity, opportunity.unit)}
									</span>
								</div>
								<div className="flex items-center gap-2 text-muted-foreground text-sm">
									<MapPin className="size-4" aria-hidden />
									{opportunity.city}, {opportunity.state}
								</div>
								<div className="flex items-center gap-2 text-muted-foreground text-sm">
									<Calendar className="size-4" aria-hidden />
									Publicado em{" "}
									{new Date(opportunity.created_at).toLocaleDateString(
										"pt-BR",
										{
											day: "2-digit",
											month: "long",
											year: "numeric",
										},
									)}
								</div>
							</CardContent>
						</Card>

						{!isOwner ? (
							<Button className="w-full" size="lg" onClick={handleContact}>
								<MessageCircle className="size-4" aria-hidden />
								Entrar em contato
							</Button>
						) : null}
					</div>
				</div>

				<div className="grid gap-4 lg:grid-cols-2">
					<Card className="rounded-xl">
						<CardHeader>
							<CardTitle>Descrição</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="whitespace-pre-wrap text-sm leading-relaxed">
								{opportunity.description}
							</p>
						</CardContent>
					</Card>

					<Card className="rounded-xl">
						<CardHeader>
							<CardTitle>Especificações técnicas</CardTitle>
						</CardHeader>
						<CardContent>
							<dl className="grid gap-4 sm:grid-cols-2">
								<DetailItem label="Categoria" value={opportunity.category} />
								<DetailItem
									label="Detalhe técnico"
									value={opportunity.technical_detail}
								/>
								<DetailItem
									label="Pureza"
									value={
										opportunity.purity_percent !== null
											? `${opportunity.purity_percent}%`
											: null
									}
								/>
								<DetailItem
									label="Estado físico"
									value={opportunity.physical_state}
								/>
								<DetailItem
									label="Periodicidade"
									value={PERIODICITY_LABELS[opportunity.periodicity]}
								/>
								<DetailItem
									label="Tipo"
									value={OPPORTUNITY_TYPE_LABELS[opportunity.opportunity_type]}
								/>
								<DetailItem
									label="Oferta / Demanda"
									value={OFFER_DEMAND_LABELS[opportunity.offer_demand]}
								/>
							</dl>
						</CardContent>
					</Card>
				</div>
			</div>

			<DeleteOpportunityDialog
				opportunity={opportunity}
				open={showDelete}
				onOpenChange={setShowDelete}
				onDeleted={onDeleted}
			/>
		</>
	);
}
