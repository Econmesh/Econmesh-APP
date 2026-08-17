"use client";

import { Button } from "@econmesh-app/ui/components/button";
import { Copy, Trash2 } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
	useCallback,
	useEffect,
	useRef,
	useState,
	type MouseEvent as ReactMouseEvent,
	type PointerEvent as ReactPointerEvent,
} from "react";
import { toast } from "sonner";

import { ProfileGateDialog } from "@/modules/acordos/components/profile-gate-dialog";
import {
	FIELD_TYPE_LABELS,
	PARTICIPANT_ROLE_COLORS,
	PARTICIPANT_ROLE_LABELS,
} from "@/modules/acordos/constants";
import { agreementsService } from "@/services/acordos/acordos.service";
import { ApiError } from "@/utils/errors";
import type { PDFDocumentProxy } from "pdfjs-dist";

import type {
	Agreement,
	AgreementField,
	AgreementFieldType,
	AgreementParticipant,
} from "@/types/api";

type EditorField = AgreementField & { localId: string };

type PageSize = { width: number; height: number };

const FIELD_TYPES = Object.keys(FIELD_TYPE_LABELS) as AgreementFieldType[];
const PDF_SCALE = 1.25;

export default function AcordoCamposPage() {
	const params = useParams<{ id: string }>();
	const router = useRouter();
	const agreementId = params.id;

	const canvasRefs = useRef<Map<number, HTMLCanvasElement>>(new Map());
	const pageContainerRefs = useRef<Map<number, HTMLDivElement>>(new Map());
	const pdfDocRef = useRef<PDFDocumentProxy | null>(null);
	const suppressClickRef = useRef(false);
	const renderGenerationRef = useRef(0);

	const [agreement, setAgreement] = useState<Agreement | null>(null);
	const [pageCount, setPageCount] = useState(0);
	const [pageSizes, setPageSizes] = useState<Record<number, PageSize>>({});
	const [fields, setFields] = useState<EditorField[]>([]);
	const [selectedParticipantId, setSelectedParticipantId] = useState("");
	const [selectedFieldType, setSelectedFieldType] =
		useState<AgreementFieldType>("signature");
	const [draggingId, setDraggingId] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);
	const [sending, setSending] = useState(false);
	const [loadingPdf, setLoadingPdf] = useState(false);
	const [pdfError, setPdfError] = useState<string | null>(null);
	const [missing, setMissing] = useState<string[] | null>(null);

	const renderAllPages = useCallback(async () => {
		const pdf = pdfDocRef.current;
		if (!pdf || pdf.numPages < 1) return;

		const generation = ++renderGenerationRef.current;
		const sizes: Record<number, PageSize> = {};

		for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
			if (generation !== renderGenerationRef.current) return;

			const pdfPage = await pdf.getPage(pageNumber);
			const viewport = pdfPage.getViewport({ scale: PDF_SCALE });
			sizes[pageNumber] = { width: viewport.width, height: viewport.height };

			const canvas = canvasRefs.current.get(pageNumber);
			if (!canvas) continue;
			const context = canvas.getContext("2d");
			if (!context) continue;

			canvas.width = viewport.width;
			canvas.height = viewport.height;
			await pdfPage.render({ canvasContext: context, viewport }).promise;
		}

		if (generation === renderGenerationRef.current) {
			setPageSizes(sizes);
		}
	}, []);

	useEffect(() => {
		let cancelled = false;

		async function loadAgreement() {
			try {
				const doc = await agreementsService.get(agreementId);
				if (cancelled) return;
				setAgreement(doc);
				setSelectedParticipantId(doc.participants[0]?.id ?? "");
				setFields(
					doc.fields.map((f) => ({
						...f,
						localId: f.id || crypto.randomUUID(),
					})),
				);

				if (!doc.original_file?.url) {
					setPdfError("Este acordo ainda não possui um documento PDF.");
					return;
				}

				setLoadingPdf(true);
				setPdfError(null);

				const pdfjs = await import("pdfjs-dist");
				pdfjs.GlobalWorkerOptions.workerSrc = new URL(
					"pdfjs-dist/build/pdf.worker.min.mjs",
					import.meta.url,
				).toString();
				const pdfBytes = await agreementsService.fetchFileBytes(
					agreementId,
					"original",
				);
				const pdf = await pdfjs.getDocument({ data: pdfBytes }).promise;
				if (cancelled) return;
				pdfDocRef.current = pdf;
				setPageCount(pdf.numPages);
			} catch {
				if (!cancelled) {
					setPdfError("Não foi possível carregar o documento PDF.");
				}
			} finally {
				if (!cancelled) setLoadingPdf(false);
			}
		}

		void loadAgreement();
		return () => {
			cancelled = true;
		};
	}, [agreementId]);

	useEffect(() => {
		if (pageCount < 1 || !pdfDocRef.current) return;
		let cancelled = false;
		const frame = requestAnimationFrame(() => {
			if (cancelled) return;
			void renderAllPages().then(() => {
				// Retry once if some page canvases were not mounted yet.
				if (cancelled) return;
				const missing = Array.from({ length: pageCount }, (_, i) => i + 1).some(
					(page) => !canvasRefs.current.has(page),
				);
				if (missing) {
					requestAnimationFrame(() => {
						if (!cancelled) void renderAllPages();
					});
				}
			});
		});
		return () => {
			cancelled = true;
			cancelAnimationFrame(frame);
		};
	}, [pageCount, renderAllPages]);

	function defaultFieldSize(type: AgreementFieldType) {
		if (type === "checkbox") return { width: 0.04, height: 0.03 };
		if (type === "signature") return { width: 0.28, height: 0.06 };
		return { width: 0.28, height: 0.05 };
	}

	function placeFieldAt(page: number, xRatio: number, yRatio: number) {
		if (!selectedParticipantId) {
			toast.error("Selecione um participante.");
			return;
		}
		const size = defaultFieldSize(selectedFieldType);
		const localId = crypto.randomUUID();
		setFields((prev) => [
			...prev,
			{
				localId,
				id: localId,
				participant_id: selectedParticipantId,
				field_type: selectedFieldType,
				page,
				x: Math.min(Math.max(xRatio - size.width / 2, 0), 1 - size.width),
				y: Math.min(Math.max(yRatio - size.height / 2, 0), 1 - size.height),
				width: size.width,
				height: size.height,
			},
		]);
	}

	function onPageClick(
		page: number,
		event: ReactMouseEvent<HTMLDivElement>,
	) {
		if (suppressClickRef.current) {
			suppressClickRef.current = false;
			return;
		}
		if (draggingId) return;
		const target = event.target as HTMLElement;
		if (target.closest("[data-field-chip]")) return;

		const container = pageContainerRefs.current.get(page);
		if (!container) return;
		const rect = container.getBoundingClientRect();
		if (rect.width <= 0 || rect.height <= 0) return;
		const x = (event.clientX - rect.left) / rect.width;
		const y = (event.clientY - rect.top) / rect.height;
		placeFieldAt(page, x, y);
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

	function onFieldPointerMove(
		page: number,
		event: ReactPointerEvent<HTMLDivElement>,
	) {
		if (!draggingId) return;
		suppressClickRef.current = true;
		const container = pageContainerRefs.current.get(page);
		if (!container) return;
		const rect = container.getBoundingClientRect();
		if (rect.width <= 0 || rect.height <= 0) return;
		const x = (event.clientX - rect.left) / rect.width;
		const y = (event.clientY - rect.top) / rect.height;
		setFields((prev) =>
			prev.map((f) =>
				f.localId === draggingId
					? {
							...f,
							page,
							x: Math.min(Math.max(x - f.width / 2, 0), 1 - f.width),
							y: Math.min(Math.max(y - f.height / 2, 0), 1 - f.height),
						}
					: f,
			),
		);
	}

	function scrollToField(field: EditorField) {
		const el = pageContainerRefs.current.get(field.page);
		el?.scrollIntoView({ behavior: "smooth", block: "center" });
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
			if (err instanceof ApiError && err.code === "profile_incomplete") {
				const details = err.details as { missing?: string[] } | null;
				setMissing(details?.missing ?? []);
			} else {
				toast.error(
					err instanceof ApiError ? err.message : "Falha ao enviar acordo.",
				);
			}
		} finally {
			setSending(false);
		}
	}

	function participantLabel(p: AgreementParticipant) {
		return `${p.name} · ${PARTICIPANT_ROLE_LABELS[p.role]}`;
	}

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

			<div className="grid gap-4 lg:grid-cols-[280px_1fr]">
				<aside className="h-fit space-y-4 rounded-xl border bg-card/80 p-4 lg:sticky lg:top-4">
					<p className="text-sm text-muted-foreground">
						Selecione o participante e o tipo de campo, depois clique no
						documento no local desejado. Arraste para ajustar a posição.
					</p>
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
					<ul className="max-h-[50vh] space-y-2 overflow-auto text-xs">
						{fields.length === 0 ? (
							<li className="rounded-lg border border-dashed p-3 text-muted-foreground">
								Nenhum campo posicionado ainda.
							</li>
						) : null}
						{fields.map((f) => {
							const participant = agreement.participants.find(
								(p) => p.id === f.participant_id,
							);
							return (
								<li key={f.localId} className="rounded-lg border p-2">
									<button
										type="button"
										className="w-full text-left"
										onClick={() => scrollToField(f)}
									>
										<p className="font-medium">
											Pág. {f.page} · {FIELD_TYPE_LABELS[f.field_type]}
										</p>
										<p className="text-muted-foreground">{participant?.name}</p>
									</button>
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

				<div className="min-w-0 space-y-3">
					{loadingPdf ? (
						<p className="text-sm text-muted-foreground">
							Carregando documento completo…
						</p>
					) : null}
					{pdfError ? (
						<p className="text-sm text-destructive">{pdfError}</p>
					) : null}

					{pageCount > 0 ? (
						<div className="max-h-[calc(100vh-10rem)] space-y-6 overflow-y-auto rounded-xl border bg-muted/30 p-4">
							{Array.from({ length: pageCount }, (_, index) => {
								const pageNumber = index + 1;
								const size = pageSizes[pageNumber];
								const pageFields = fields.filter((f) => f.page === pageNumber);
								return (
									<div
										key={pageNumber}
										className="mx-auto w-full max-w-[900px]"
									>
										<p className="mb-2 text-center text-xs font-medium uppercase tracking-wide text-muted-foreground">
											Página {pageNumber} de {pageCount}
										</p>
										<div
											ref={(el) => {
												if (el) {
													pageContainerRefs.current.set(pageNumber, el);
												} else {
													pageContainerRefs.current.delete(pageNumber);
												}
											}}
											className="relative mx-auto cursor-crosshair overflow-hidden rounded-lg border bg-white shadow-sm"
											style={{
												width: size?.width
													? Math.min(size.width, 900)
													: "100%",
												aspectRatio: size
													? `${size.width} / ${size.height}`
													: "210 / 297",
												maxWidth: "100%",
											}}
											onClick={(e) => onPageClick(pageNumber, e)}
											onPointerMove={(e) =>
												onFieldPointerMove(pageNumber, e)
											}
											onPointerUp={() => setDraggingId(null)}
											onPointerLeave={() => setDraggingId(null)}
										>
											<canvas
												ref={(el) => {
													if (el) canvasRefs.current.set(pageNumber, el);
													else canvasRefs.current.delete(pageNumber);
												}}
												className="pointer-events-none block h-full w-full"
											/>
											{pageFields.map((field) => {
												const participant = agreement.participants.find(
													(p) => p.id === field.participant_id,
												);
												return (
													<button
														key={field.localId}
														type="button"
														data-field-chip
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
															e.stopPropagation();
															setDraggingId(field.localId);
														}}
														onClick={(e) => e.stopPropagation()}
													>
														{FIELD_TYPE_LABELS[field.field_type]}
														<br />
														{participant?.name.split(" ")[0]}
													</button>
												);
											})}
										</div>
									</div>
								);
							})}
						</div>
					) : null}
				</div>
			</div>
			{missing && missing.length > 0 ? (
				<ProfileGateDialog
					missing={missing}
					companyId={agreement?.company_id}
					onClose={() => setMissing(null)}
				/>
			) : null}
		</div>
	);
}
