"use client";

import { Button } from "@econmesh-app/ui/components/button";
import { Copy, Trash2 } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import {
	FIELD_TYPE_LABELS,
	PARTICIPANT_ROLE_COLORS,
	PARTICIPANT_ROLE_LABELS,
} from "@/modules/acordos/constants";
import { agreementsService } from "@/services/acordos/acordos.service";
import { ApiError } from "@/utils/errors";
import type {
	Agreement,
	AgreementField,
	AgreementFieldType,
	AgreementParticipant,
} from "@/types/api";

type EditorField = AgreementField & { localId: string };

const FIELD_TYPES = Object.keys(FIELD_TYPE_LABELS) as AgreementFieldType[];

export default function AcordoCamposPage() {
	const params = useParams<{ id: string }>();
	const router = useRouter();
	const agreementId = params.id;
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const containerRef = useRef<HTMLDivElement | null>(null);

	const [agreement, setAgreement] = useState<Agreement | null>(null);
	const [page, setPage] = useState(1);
	const [pageCount, setPageCount] = useState(1);
	const [fields, setFields] = useState<EditorField[]>([]);
	const [selectedParticipantId, setSelectedParticipantId] = useState<string>("");
	const [selectedFieldType, setSelectedFieldType] =
		useState<AgreementFieldType>("signature");
	const [draggingId, setDraggingId] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);
	const [sending, setSending] = useState(false);
	const [canvasSize, setCanvasSize] = useState({ width: 600, height: 800 });

	const loadPdfPage = useCallback(async (url: string, pageNumber: number) => {
		const pdfjs = await import("pdfjs-dist");
		pdfjs.GlobalWorkerOptions.workerSrc = new URL(
			"pdfjs-dist/build/pdf.worker.min.mjs",
			import.meta.url,
		).toString();
		const loadingTask = pdfjs.getDocument(url);
		const pdf = await loadingTask.promise;
		setPageCount(pdf.numPages);
		const pdfPage = await pdf.getPage(pageNumber);
		const viewport = pdfPage.getViewport({ scale: 1.2 });
		const canvas = canvasRef.current;
		if (!canvas) return;
		const context = canvas.getContext("2d");
		if (!context) return;
		canvas.width = viewport.width;
		canvas.height = viewport.height;
		setCanvasSize({ width: viewport.width, height: viewport.height });
		await pdfPage.render({ canvasContext: context, viewport, canvas }).promise;
	}, []);

	useEffect(() => {
		void agreementsService.get(agreementId).then((doc) => {
			setAgreement(doc);
			setSelectedParticipantId(doc.participants[0]?.id ?? "");
			setFields(
				doc.fields.map((f) => ({ ...f, localId: f.id || crypto.randomUUID() })),
			);
			if (doc.original_file?.url) {
				void loadPdfPage(doc.original_file.url, 1);
			}
		});
	}, [agreementId, loadPdfPage]);

	useEffect(() => {
		if (!agreement?.original_file?.url) return;
		void loadPdfPage(agreement.original_file.url, page);
	}, [agreement?.original_file?.url, page, loadPdfPage]);

	function addField() {
		if (!selectedParticipantId) {
			toast.error("Selecione um participante.");
			return;
		}
		const localId = crypto.randomUUID();
		setFields((prev) => [
			...prev,
			{
				localId,
				id: localId,
				participant_id: selectedParticipantId,
				field_type: selectedFieldType,
				page,
				x: 0.15,
				y: 0.2,
				width: selectedFieldType === "checkbox" ? 0.04 : 0.28,
				height: selectedFieldType === "checkbox" ? 0.03 : 0.05,
			},
		]);
	}

	function duplicateField(field: EditorField) {
		const localId = crypto.randomUUID();
		setFields((prev) => [
			...prev,
			{
				...field,
				localId,
				id: localId,
				x: Math.min(field.x + 0.03, 0.7),
				y: Math.min(field.y + 0.03, 0.85),
			},
		]);
	}

	function removeField(localId: string) {
		setFields((prev) => prev.filter((f) => f.localId !== localId));
	}

	function onPointerMove(event: React.PointerEvent) {
		if (!draggingId || !containerRef.current) return;
		const rect = containerRef.current.getBoundingClientRect();
		const x = (event.clientX - rect.left) / rect.width;
		const y = (event.clientY - rect.top) / rect.height;
		setFields((prev) =>
			prev.map((f) =>
				f.localId === draggingId
					? {
							...f,
							x: Math.min(Math.max(x - f.width / 2, 0), 1 - f.width),
							y: Math.min(Math.max(y - f.height / 2, 0), 1 - f.height),
						}
					: f,
			),
		);
	}

	async function saveFields() {
		setSaving(true);
		try {
			const updated = await agreementsService.updateFields(
				agreementId,
				fields.map((f) => ({
					id: f.id,
					participant_id: f.participant_id,
					field_type: f.field_type,
					page: f.page,
					x: f.x,
					y: f.y,
					width: f.width,
					height: f.height,
					value: f.value,
				})),
			);
			setAgreement(updated);
			toast.success("Campos salvos.");
			return updated;
		} catch (err) {
			toast.error(
				err instanceof ApiError ? err.message : "Falha ao salvar campos.",
			);
			return null;
		} finally {
			setSaving(false);
		}
	}

	async function saveAndSend() {
		const saved = await saveFields();
		if (!saved) return;
		setSending(true);
		try {
			await agreementsService.send(agreementId);
			toast.success("Acordo enviado para assinatura.");
			router.push(`/dashboard/acordos/${agreementId}` as Route);
		} catch (err) {
			toast.error(
				err instanceof ApiError ? err.message : "Falha ao enviar acordo.",
			);
		} finally {
			setSending(false);
		}
	}

	function participantLabel(p: AgreementParticipant) {
		return `${p.name} · ${PARTICIPANT_ROLE_LABELS[p.role]}`;
	}

	const pageFields = fields.filter((f) => f.page === page);

	if (!agreement) {
		return <p className="text-sm text-muted-foreground">Carregando editor…</p>;
	}

	return (
		<div className="space-y-4">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div>
					<Link
						href={`/dashboard/acordos/${agreementId}` as Route}
						className="text-sm text-muted-foreground hover:text-foreground"
					>
						← Voltar ao acordo
					</Link>
					<h1 className="text-xl font-semibold">Posicionar assinaturas</h1>
					<p className="text-sm text-muted-foreground">{agreement.title}</p>
				</div>
				<div className="flex gap-2">
					<Button
						type="button"
						variant="outline"
						disabled={saving}
						onClick={() => void saveFields()}
					>
						{saving ? "Salvando…" : "Salvar"}
					</Button>
					<Button
						type="button"
						disabled={sending || fields.length === 0}
						onClick={() => void saveAndSend()}
					>
						{sending ? "Enviando…" : "Salvar e enviar"}
					</Button>
				</div>
			</div>

			<div className="grid gap-4 lg:grid-cols-[260px_1fr]">
				<aside className="space-y-4 rounded-xl border bg-card/80 p-4">
					<div className="space-y-2">
						<p className="text-sm font-medium">Participante</p>
						<select
							className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
							value={selectedParticipantId}
							onChange={(e) => setSelectedParticipantId(e.target.value)}
						>
							{agreement.participants.map((p) => (
								<option key={p.id} value={p.id}>
									{participantLabel(p)}
								</option>
							))}
						</select>
					</div>
					<div className="space-y-2">
						<p className="text-sm font-medium">Tipo de campo</p>
						<select
							className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
							value={selectedFieldType}
							onChange={(e) =>
								setSelectedFieldType(e.target.value as AgreementFieldType)
							}
						>
							{FIELD_TYPES.map((type) => (
								<option key={type} value={type}>
									{FIELD_TYPE_LABELS[type]}
								</option>
							))}
						</select>
					</div>
					<Button type="button" className="w-full" onClick={addField}>
						Adicionar campo
					</Button>
					<ul className="max-h-64 space-y-2 overflow-auto text-xs">
						{fields.map((f) => {
							const participant = agreement.participants.find(
								(p) => p.id === f.participant_id,
							);
							return (
								<li
									key={f.localId}
									className="rounded-lg border p-2"
								>
									<p className="font-medium">
										Pág. {f.page} · {FIELD_TYPE_LABELS[f.field_type]}
									</p>
									<p className="text-muted-foreground">
										{participant?.name}
									</p>
									<div className="mt-1 flex gap-2">
										<button
											type="button"
											onClick={() => duplicateField(f)}
											aria-label="Duplicar"
										>
											<Copy className="size-3.5" />
										</button>
										<button
											type="button"
											onClick={() => removeField(f.localId)}
											aria-label="Excluir"
										>
											<Trash2 className="size-3.5 text-destructive" />
										</button>
									</div>
								</li>
							);
						})}
					</ul>
				</aside>

				<div className="space-y-3">
					<div className="flex items-center justify-center gap-3">
						<Button
							type="button"
							variant="outline"
							size="sm"
							disabled={page <= 1}
							onClick={() => setPage((p) => Math.max(1, p - 1))}
						>
							Anterior
						</Button>
						<span className="text-sm">
							Página {page} de {pageCount}
						</span>
						<Button
							type="button"
							variant="outline"
							size="sm"
							disabled={page >= pageCount}
							onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
						>
							Próxima
						</Button>
					</div>

					<div
						ref={containerRef}
						className="relative mx-auto overflow-auto rounded-xl border bg-muted/20"
						style={{ width: canvasSize.width, maxWidth: "100%" }}
						onPointerMove={onPointerMove}
						onPointerUp={() => setDraggingId(null)}
						onPointerLeave={() => setDraggingId(null)}
					>
						<canvas ref={canvasRef} className="block max-w-full" />
						{pageFields.map((field) => {
							const participant = agreement.participants.find(
								(p) => p.id === field.participant_id,
							);
							return (
								<button
									key={field.localId}
									type="button"
									className={`absolute cursor-move rounded border px-1 text-left text-[10px] font-medium shadow-sm ${
										participant
											? PARTICIPANT_ROLE_COLORS[participant.role]
											: "bg-primary/20 text-primary"
									}`}
									style={{
										left: `${field.x * 100}%`,
										top: `${field.y * 100}%`,
										width: `${field.width * 100}%`,
										height: `${field.height * 100}%`,
									}}
									onPointerDown={(e) => {
										e.preventDefault();
										setDraggingId(field.localId);
									}}
								>
									{FIELD_TYPE_LABELS[field.field_type]}
									<br />
									{participant?.name.split(" ")[0]}
								</button>
							);
						})}
					</div>
				</div>
			</div>
		</div>
	);
}
