"use client";

import { Button } from "@econmesh-app/ui/components/button";
import { Input } from "@econmesh-app/ui/components/input";
import { Label } from "@econmesh-app/ui/components/label";
import { Textarea } from "@econmesh-app/ui/components/textarea";
import { FileUp, Plus, Trash2, Upload } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { ProfileGateDialog } from "@/modules/acordos/components/profile-gate-dialog";
import {
	PARTICIPANT_ROLE_COLORS,
	PARTICIPANT_ROLE_LABELS,
} from "@/modules/acordos/constants";
import { useAuth } from "@/hooks/use-auth";
import { agreementsService } from "@/services/acordos/acordos.service";
import { ApiError } from "@/utils/errors";
import { companiesService } from "@/services/companies/companies.service";
import type {
	Company,
	CompanySearchItem,
	ParticipantInput,
	ParticipantRole,
	SigningMode,
} from "@/types/api";

type DraftParticipant = ParticipantInput & { key: string };

const ROLE_OPTIONS = Object.entries(PARTICIPANT_ROLE_LABELS) as [
	ParticipantRole,
	string,
][];

export default function NovoAcordoPage() {
	const router = useRouter();
	const { user } = useAuth();
	const [step, setStep] = useState(1);
	const [companies, setCompanies] = useState<Company[]>([]);
	const [companyId, setCompanyId] = useState("");
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [deadline, setDeadline] = useState("");
	const [file, setFile] = useState<File | null>(null);
	const [signingMode, setSigningMode] = useState<SigningMode>("unordered");
	const [participants, setParticipants] = useState<DraftParticipant[]>([]);
	const [agreementId, setAgreementId] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);
	const [missing, setMissing] = useState<string[] | null>(null);
	const [companyQuery, setCompanyQuery] = useState("");
	const [companyResults, setCompanyResults] = useState<CompanySearchItem[]>([]);
	const [externalDraft, setExternalDraft] = useState({
		name: "",
		email: "",
		cpf: "",
		company_name: "",
		role: "sign" as ParticipantRole,
	});

	useEffect(() => {
		void companiesService.list().then((items) => {
			setCompanies(items);
			if (items[0]) setCompanyId(items[0].id);
		});
	}, []);

	useEffect(() => {
		if (!companyId) return;
		void agreementsService.eligibility(companyId).then((res) => {
			if (!res.eligible) setMissing(res.missing);
		});
	}, [companyId]);

	useEffect(() => {
		if (companyQuery.trim().length < 2) {
			setCompanyResults([]);
			return;
		}
		const t = window.setTimeout(() => {
			void agreementsService.searchCompanies(companyQuery).then((res) => {
				setCompanyResults(res.items);
			});
		}, 300);
		return () => window.clearTimeout(t);
	}, [companyQuery]);

	const canGoDocument = useMemo(
		() => title.trim().length >= 2 && !!file && !!companyId,
		[title, file, companyId],
	);

	function addMe() {
		if (!user?.email) return;
		setParticipants((prev) => [
			...prev,
			{
				key: crypto.randomUUID(),
				kind: "external",
				name: user.name || user.email || "",
				email: user.email || "",
				role: "sign",
				order_index: prev.length,
			},
		]);
	}

	function addCompanyParticipant(item: CompanySearchItem) {
		setParticipants((prev) => [
			...prev,
			{
				key: crypto.randomUUID(),
				kind: "company",
				company_id: item.id,
				company_name: item.trade_name || item.legal_name,
				name:
					item.legal_representative ||
					item.owner_name ||
					item.legal_name,
				email: item.owner_email || item.email || "",
				cpf: item.owner_cpf || undefined,
				job_title: item.owner_job_title || undefined,
				role: "sign",
				order_index: prev.length,
			},
		]);
		setCompanyQuery("");
		setCompanyResults([]);
	}

	function addExternal() {
		if (!externalDraft.name || !externalDraft.email) {
			toast.error("Informe nome e e-mail do convidado.");
			return;
		}
		setParticipants((prev) => [
			...prev,
			{
				key: crypto.randomUUID(),
				kind: "external",
				name: externalDraft.name,
				email: externalDraft.email,
				cpf: externalDraft.cpf || undefined,
				company_name: externalDraft.company_name || undefined,
				role: externalDraft.role,
				order_index: prev.length,
			},
		]);
		setExternalDraft({
			name: "",
			email: "",
			cpf: "",
			company_name: "",
			role: "sign",
		});
	}

	async function persistDraftAndParticipants(): Promise<string> {
		let id = agreementId;
		if (!id) {
			const created = await agreementsService.create({
				title: title.trim(),
				description: description.trim() || null,
				deadline: deadline ? new Date(deadline).toISOString() : null,
				company_id: companyId,
				signing_mode: signingMode,
			});
			id = created.id;
			setAgreementId(id);
			if (file) {
				await agreementsService.uploadPdf(id, file);
			}
		} else {
			await agreementsService.update(id, {
				title: title.trim(),
				description: description.trim() || null,
				deadline: deadline ? new Date(deadline).toISOString() : null,
				signing_mode: signingMode,
			});
			if (file) {
				await agreementsService.uploadPdf(id, file);
			}
		}

		await agreementsService.updateParticipants(id, {
			signing_mode: signingMode,
			participants: participants.map((p, index) => ({
				kind: p.kind,
				company_id: p.company_id,
				company_name: p.company_name,
				name: p.name,
				email: p.email,
				cpf: p.cpf,
				job_title: p.job_title,
				role: p.role,
				order_index: index,
			})),
		});
		return id;
	}

	async function goToFields() {
		if (participants.length === 0) {
			toast.error("Adicione ao menos um participante.");
			return;
		}
		setSaving(true);
		try {
			const id = await persistDraftAndParticipants();
			router.push(`/dashboard/acordos/${id}/campos` as Route);
		} catch (err) {
			if (err instanceof ApiError && err.code === "profile_incomplete") {
				const details = err.details as { missing?: string[] } | null;
				setMissing(details?.missing ?? []);
			} else {
				toast.error(
					err instanceof ApiError
						? err.message
						: "Não foi possível salvar o acordo.",
				);
			}
		} finally {
			setSaving(false);
		}
	}

	return (
		<div className="mx-auto max-w-3xl space-y-6">
			<div className="flex items-center justify-between gap-4">
				<div>
					<Link
						href={"/dashboard/acordos" as Route}
						className="text-sm text-muted-foreground hover:text-foreground"
					>
						← Meus acordos
					</Link>
					<h1 className="mt-2 text-2xl font-semibold">Novo Acordo</h1>
					<p className="text-sm text-muted-foreground">
						Passo {step} de 2 — {step === 1 ? "Documento" : "Participantes"}
					</p>
				</div>
			</div>

			<div className="flex gap-2">
				{[1, 2].map((n) => (
					<div
						key={n}
						className={`h-1.5 flex-1 rounded-full ${
							n <= step ? "bg-primary" : "bg-muted"
						}`}
					/>
				))}
			</div>

			{step === 1 ? (
				<section className="space-y-4 rounded-xl border bg-card/80 p-5">
					<div className="space-y-2">
						<Label htmlFor="company">Empresa responsável</Label>
						<select
							id="company"
							className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
							value={companyId}
							onChange={(e) => setCompanyId(e.target.value)}
						>
							{companies.map((c) => (
								<option key={c.id} value={c.id}>
									{c.trade_name || c.legal_name}
								</option>
							))}
						</select>
					</div>
					<div className="space-y-2">
						<Label htmlFor="title">Nome do acordo</Label>
						<Input
							id="title"
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							placeholder="Ex.: Contrato de prestação de serviços"
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="description">Descrição (opcional)</Label>
						<Textarea
							id="description"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							rows={3}
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="deadline">Prazo limite (opcional)</Label>
						<Input
							id="deadline"
							type="datetime-local"
							value={deadline}
							onChange={(e) => setDeadline(e.target.value)}
						/>
					</div>

					<div
						className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-muted/20 px-6 py-12 text-center"
						onDragOver={(e) => e.preventDefault()}
						onDrop={(e) => {
							e.preventDefault();
							const dropped = e.dataTransfer.files?.[0];
							if (dropped?.type === "application/pdf") setFile(dropped);
							else toast.error("Envie um arquivo PDF.");
						}}
					>
						<FileUp className="size-8 text-primary" />
						<p className="font-medium">Arraste o documento aqui</p>
						<p className="text-sm text-muted-foreground">ou clique em</p>
						<label className="inline-flex cursor-pointer">
							<input
								type="file"
								accept="application/pdf"
								className="hidden"
								onChange={(e) => {
									const selected = e.target.files?.[0];
									if (selected) setFile(selected);
								}}
							/>
							<span className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
								<Upload className="size-4" />
								Selecionar arquivo
							</span>
						</label>
						{file ? (
							<p className="text-sm text-muted-foreground">{file.name}</p>
						) : null}
					</div>

					<div className="flex justify-end">
						<Button
							type="button"
							disabled={!canGoDocument}
							onClick={() => setStep(2)}
						>
							Avançar
						</Button>
					</div>
				</section>
			) : (
				<section className="space-y-5 rounded-xl border bg-card/80 p-5">
					<div>
						<h2 className="font-semibold">Informe os signatários</h2>
						<p className="text-sm text-muted-foreground">
							Adicione empresas cadastradas ou convidados externos e defina os
							papéis.
						</p>
					</div>

					<div className="inline-flex rounded-lg border p-1">
						<button
							type="button"
							className={`rounded-md px-3 py-1.5 text-sm ${
								signingMode === "unordered"
									? "bg-muted font-medium"
									: "text-muted-foreground"
							}`}
							onClick={() => setSigningMode("unordered")}
						>
							Sem ordem
						</button>
						<button
							type="button"
							className={`rounded-md px-3 py-1.5 text-sm ${
								signingMode === "ordered"
									? "bg-muted font-medium"
									: "text-muted-foreground"
							}`}
							onClick={() => setSigningMode("ordered")}
						>
							Com ordem
						</button>
					</div>

					<button
						type="button"
						className="text-sm font-medium text-primary"
						onClick={addMe}
					>
						+ Me adicionar à lista
					</button>

					<div className="space-y-2">
						<Label>Empresa cadastrada</Label>
						<Input
							value={companyQuery}
							onChange={(e) => setCompanyQuery(e.target.value)}
							placeholder="Pesquisar empresas…"
						/>
						{companyResults.length > 0 ? (
							<ul className="overflow-hidden rounded-lg border">
								{companyResults.map((item) => (
									<li key={item.id}>
										<button
											type="button"
											className="block w-full px-3 py-2 text-left text-sm hover:bg-muted"
											onClick={() => addCompanyParticipant(item)}
										>
											<span className="font-medium">
												{item.trade_name || item.legal_name}
											</span>
											<span className="block text-xs text-muted-foreground">
												{item.legal_representative || item.owner_name} ·{" "}
												{item.owner_email || item.email}
											</span>
										</button>
									</li>
								))}
							</ul>
						) : null}
					</div>

					<div className="space-y-3 rounded-lg border p-4">
						<p className="text-sm font-medium">Convidado externo</p>
						<div className="grid gap-3 sm:grid-cols-2">
							<div className="space-y-1">
								<Label>Nome</Label>
								<Input
									value={externalDraft.name}
									onChange={(e) =>
										setExternalDraft((d) => ({ ...d, name: e.target.value }))
									}
								/>
							</div>
							<div className="space-y-1">
								<Label>E-mail</Label>
								<Input
									type="email"
									value={externalDraft.email}
									onChange={(e) =>
										setExternalDraft((d) => ({ ...d, email: e.target.value }))
									}
								/>
							</div>
							<div className="space-y-1">
								<Label>CPF (opcional)</Label>
								<Input
									value={externalDraft.cpf}
									onChange={(e) =>
										setExternalDraft((d) => ({ ...d, cpf: e.target.value }))
									}
								/>
							</div>
							<div className="space-y-1">
								<Label>Empresa (opcional)</Label>
								<Input
									value={externalDraft.company_name}
									onChange={(e) =>
										setExternalDraft((d) => ({
											...d,
											company_name: e.target.value,
										}))
									}
								/>
							</div>
							<div className="space-y-1">
								<Label>Papel</Label>
								<select
									className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
									value={externalDraft.role}
									onChange={(e) =>
										setExternalDraft((d) => ({
											...d,
											role: e.target.value as ParticipantRole,
										}))
									}
								>
									{ROLE_OPTIONS.map(([value, label]) => (
										<option key={value} value={value}>
											{label}
										</option>
									))}
								</select>
							</div>
						</div>
						<Button type="button" variant="outline" onClick={addExternal}>
							<Plus className="size-4" />
							Adicionar convidado
						</Button>
					</div>

					<ul className="space-y-2">
						{participants.map((p, index) => (
							<li
								key={p.key}
								className="flex flex-wrap items-center gap-3 rounded-lg border p-3"
							>
								{signingMode === "ordered" ? (
									<span className="text-xs font-medium text-muted-foreground">
										#{index + 1}
									</span>
								) : null}
								<div className="min-w-0 flex-1">
									<p className="truncate text-sm font-medium">{p.name}</p>
									<p className="truncate text-xs text-muted-foreground">
										{p.email}
										{p.company_name ? ` · ${p.company_name}` : ""}
									</p>
								</div>
								<select
									className={`rounded-md border px-2 py-1 text-xs ${PARTICIPANT_ROLE_COLORS[p.role]}`}
									value={p.role}
									onChange={(e) =>
										setParticipants((prev) =>
											prev.map((item) =>
												item.key === p.key
													? {
															...item,
															role: e.target.value as ParticipantRole,
														}
													: item,
											),
										)
									}
								>
									{ROLE_OPTIONS.map(([value, label]) => (
										<option key={value} value={value}>
											{label}
										</option>
									))}
								</select>
								<button
									type="button"
									className="text-muted-foreground hover:text-destructive"
									onClick={() =>
										setParticipants((prev) =>
											prev.filter((item) => item.key !== p.key),
										)
									}
									aria-label="Remover participante"
								>
									<Trash2 className="size-4" />
								</button>
							</li>
						))}
					</ul>

					<div className="flex justify-between">
						<Button type="button" variant="outline" onClick={() => setStep(1)}>
							Voltar
						</Button>
						<Button type="button" disabled={saving} onClick={() => void goToFields()}>
							{saving ? "Salvando…" : "Posicionar assinaturas"}
						</Button>
					</div>
				</section>
			)}

			{missing && missing.length > 0 ? (
				<ProfileGateDialog
					missing={missing}
					companyId={companyId}
					onClose={() => setMissing(null)}
				/>
			) : null}
		</div>
	);
}
