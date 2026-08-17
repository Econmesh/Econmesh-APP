"use client";

import { Badge } from "@econmesh-app/ui/components/badge";
import { Button } from "@econmesh-app/ui/components/button";
import { Input } from "@econmesh-app/ui/components/input";
import { Textarea } from "@econmesh-app/ui/components/textarea";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { CONTRACT_PROPOSAL_STATUS_LABELS } from "@/modules/minutas/constants";
import { RichTextEditor } from "@/modules/minutas/components/rich-text-editor";
import { BRAZILIAN_STATES } from "@/modules/companies/schemas";
import { contractProposalsService } from "@/services/contract-proposals/contract-proposals.service";
import type {
  ContractProposal,
  ForoFillMode,
  PartySnapshot,
  ProposalSection,
} from "@/types/api";
import { ApiError } from "@/utils/errors";

type MinutaDetailViewProps = {
  proposalId: string;
};

type PartyDraft = Omit<PartySnapshot, "company_id">;

function isForoSection(section: ProposalSection): boolean {
  const title = section.title.trim().toLowerCase();
  return title === "foro" || title === "do foro";
}

function partyToDraft(party: PartySnapshot): PartyDraft {
  const { company_id: _id, ...rest } = party;
  return rest;
}

export function MinutaDetailView({ proposalId }: MinutaDetailViewProps) {
  const router = useRouter();
  const [proposal, setProposal] = useState<ContractProposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [title, setTitle] = useState("");
  const [contractor, setContractor] = useState<PartyDraft | null>(null);
  const [contracted, setContracted] = useState<PartyDraft | null>(null);
  const [prazo, setPrazo] = useState("");
  const [price, setPrice] = useState("");
  const [sections, setSections] = useState<ProposalSection[]>([]);
  const [foroCity, setForoCity] = useState("");
  const [foroState, setForoState] = useState("");
  const [reasonOpen, setReasonOpen] = useState<"changes" | "reject" | null>(null);
  const [reasonText, setReasonText] = useState("");
  const [acting, setActing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await contractProposalsService.get(proposalId);
      setProposal(data);
      setTitle(data.title);
      setContractor(partyToDraft(data.contractor));
      setContracted(partyToDraft(data.contracted));
      setPrazo(data.opportunity.prazo ?? "");
      setPrice(
        data.opportunity.price != null ? String(data.opportunity.price) : "",
      );
      setSections([...data.sections].sort((a, b) => a.sort_order - b.sort_order));
      setForoCity(data.foro_city ?? "");
      setForoState(data.foro_state ?? "");
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : "Não foi possível carregar a minuta.",
      );
    } finally {
      setLoading(false);
    }
  }, [proposalId]);

  useEffect(() => {
    void load();
  }, [load]);

  const canEdit =
    proposal?.my_role === "offerer" &&
    (proposal.status === "draft" || proposal.status === "changes_requested");

  const canReview =
    proposal?.my_role === "interested" && proposal.status === "pending_approval";

  const foroFillMode: ForoFillMode = proposal?.foro_fill_mode ?? "company";
  const foroEditable = canEdit && foroFillMode === "company";

  async function handleSave(showToast = true) {
    if (!proposal || !contractor || !contracted) return;
    setSaving(true);
    try {
      const updated = await contractProposalsService.update(proposal.id, {
        title,
        contractor,
        contracted,
        opportunity: {
          prazo: prazo || null,
          price: price ? Number(price) : null,
          price_negotiable: !price,
        },
        sections: sections.map((section, index) => ({
          id: section.id,
          title: section.title,
          content_html: section.content_html,
          sort_order: index,
          is_core: section.is_core,
          is_admin_managed: section.is_admin_managed,
          is_editable: section.is_editable,
          template_id: section.template_id,
        })),
        ...(foroFillMode === "company"
          ? { foro_city: foroCity || null, foro_state: foroState || null }
          : {}),
      });
      setProposal(updated);
      setSections([...updated.sections].sort((a, b) => a.sort_order - b.sort_order));
      setForoCity(updated.foro_city ?? "");
      setForoState(updated.foro_state ?? "");
      if (showToast) toast.success("Minuta salva.");
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Não foi possível salvar.",
      );
      throw error;
    } finally {
      setSaving(false);
    }
  }

  async function handleGeneratePdf() {
    if (!proposal) return;
    setGenerating(true);
    try {
      try {
        await handleSave(false);
      } catch {
        return;
      }
      const updated = await contractProposalsService.generatePdf(proposal.id);
      setProposal(updated);
      toast.success("PDF gerado. Aguardando aprovação da interessada.");
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : "Não foi possível gerar o PDF.",
      );
    } finally {
      setGenerating(false);
    }
  }

  async function handleApprove() {
    if (!proposal) return;
    setActing(true);
    try {
      const result = await contractProposalsService.approve(proposal.id);
      setProposal(result.proposal);
      toast.success("Minuta aprovada. Processo de acordo iniciado.");
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Não foi possível aprovar.",
      );
    } finally {
      setActing(false);
    }
  }

  async function handleReasonSubmit() {
    if (!proposal || !reasonOpen || !reasonText.trim()) return;
    setActing(true);
    try {
      const updated =
        reasonOpen === "changes"
          ? await contractProposalsService.requestChanges(
              proposal.id,
              reasonText.trim(),
            )
          : await contractProposalsService.reject(proposal.id, reasonText.trim());
      setProposal(updated);
      setReasonOpen(null);
      setReasonText("");
      if (reasonOpen === "changes") {
        toast.success("Alterações solicitadas.");
      } else {
        toast.success("Minuta rejeitada.");
      }
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Não foi possível concluir.",
      );
    } finally {
      setActing(false);
    }
  }

  function moveSection(index: number, direction: -1 | 1) {
    const section = sections[index];
    if (!section || section.is_core || !(section.is_editable ?? true)) return;
    const target = index + direction;
    if (target < 0 || target >= sections.length) return;
    const targetSection = sections[target];
    if (targetSection?.is_core) return;
    const next = [...sections];
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item);
    setSections(next.map((s, i) => ({ ...s, sort_order: i })));
  }

  function removeSection(index: number) {
    const section = sections[index];
    if (!section || section.is_core || !(section.is_editable ?? true)) return;
    setSections((prev) =>
      prev.filter((_, i) => i !== index).map((s, i) => ({
        ...s,
        sort_order: i,
      })),
    );
  }

  function addSection() {
    setSections((prev) => {
      const foroIndex = prev.findIndex(isForoSection);
      const insertAt = foroIndex === -1 ? prev.length : foroIndex;
      const next = [...prev];
      next.splice(insertAt, 0, {
        id: crypto.randomUUID(),
        title: "Nova seção",
        content_html: "<p></p>",
        sort_order: insertAt,
        is_core: false,
        is_admin_managed: false,
        is_editable: true,
        template_id: null,
      });
      return next.map((s, i) => ({ ...s, sort_order: i }));
    });
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Carregando minuta...</p>;
  }

  if (!proposal || !contractor || !contracted) {
    return (
      <p className="text-sm text-muted-foreground">
        Minuta não encontrada.{" "}
        <Link href="/dashboard/conversas" className="text-primary underline">
          Voltar
        </Link>
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href={`/dashboard/conversas/${proposal.conversation_id}`}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Voltar à conversa
          </Link>
          <h1 className="mt-1 text-2xl font-semibold">Minuta contratual</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Oportunidade: {proposal.opportunity.title}
          </p>
        </div>
        <Badge>
          {CONTRACT_PROPOSAL_STATUS_LABELS[proposal.status] ?? proposal.status}
        </Badge>
      </div>

      {proposal.change_request_message ? (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          <strong>Alterações solicitadas:</strong> {proposal.change_request_message}
        </div>
      ) : null}

      {proposal.rejection_reason ? (
        <div className="space-y-3 rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm">
          <p>
            <strong>Rejeitada:</strong> {proposal.rejection_reason}
          </p>
          <div className="rounded-md border border-border bg-background p-3">
            <p className="font-medium">Recomendação</p>
            <p className="mt-1 text-muted-foreground">
              Considere encerrar o contato se não houver interesse em continuar a
              negociação. O encerramento não ocorre automaticamente.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() =>
                router.push(
                  `/dashboard/conversas/${proposal.conversation_id}?recommendClose=1`,
                )
              }
            >
              Avaliar encerramento do contato
            </Button>
          </div>
        </div>
      ) : null}

      <div className="space-y-2">
        <label className="text-sm font-medium">Título do documento</label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={!canEdit}
        />
      </div>

      <PartyFields
        label="Contratante (empresa interessada)"
        party={contractor}
        onChange={setContractor}
        disabled={!canEdit}
      />
      <PartyFields
        label="Contratada (empresa ofertante)"
        party={contracted}
        onChange={setContracted}
        disabled={!canEdit}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">Valor</label>
          <Input
            type="number"
            min={0}
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            disabled={!canEdit}
            placeholder="A combinar se vazio"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Prazo</label>
          <Input
            value={prazo}
            onChange={(e) => setPrazo(e.target.value)}
            disabled={!canEdit}
          />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">Seções</h2>
          {canEdit ? (
            <Button type="button" variant="outline" size="sm" onClick={addSection}>
              <Plus className="size-4" aria-hidden />
              Adicionar seção
            </Button>
          ) : null}
        </div>

        {sections.map((section, index) => {
          const foro = isForoSection(section);
          const sectionEditable =
            canEdit && !section.is_core && !foro && (section.is_editable ?? true);
          return (
          <div
            key={section.id}
            className="space-y-3 rounded-xl border border-border bg-card p-4"
          >
            <div className="flex flex-wrap items-center gap-2">
              <Input
                value={section.title}
                onChange={(e) => {
                  const next = [...sections];
                  next[index] = { ...section, title: e.target.value };
                  setSections(next);
                }}
                disabled={!sectionEditable}
                className="max-w-md font-medium"
              />
              {section.is_core || foro ? (
                <Badge variant="secondary">Automática</Badge>
              ) : null}
              {section.is_admin_managed && !foro ? (
                <Badge variant="secondary">
                  {(section.is_editable ?? true) ? "Admin · editável" : "Admin · bloqueada"}
                </Badge>
              ) : null}
              {canEdit && !foro ? (
                <div className="ml-auto flex gap-1">
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => moveSection(index, -1)}
                        disabled={!sectionEditable || index === 0 || sections[index - 1]?.is_core}
                      >
                        <ArrowUp className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => moveSection(index, 1)}
                        disabled={
                          !sectionEditable ||
                          index === sections.length - 1 ||
                          sections[index + 1]?.is_core ||
                          isForoSection(sections[index + 1])
                        }
                      >
                    <ArrowDown className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => removeSection(index)}
                    disabled={!sectionEditable}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ) : null}
            </div>
            {foro ? (
              <ForoFields
                city={foroCity}
                state={foroState}
                onCityChange={setForoCity}
                onStateChange={setForoState}
                editable={foroEditable}
                contentHtml={section.content_html}
                contractorName={contractor.legal_name}
                contractedName={contracted.legal_name}
              />
            ) : (
              <RichTextEditor
                value={section.content_html}
                editable={sectionEditable}
                onChange={(html) => {
                  const next = [...sections];
                  next[index] = { ...section, content_html: html };
                  setSections(next);
                }}
              />
            )}
          </div>
          );
        })}
      </div>

      {canEdit ? (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              void handleSave().catch(() => undefined);
            }}
            disabled={saving}
          >
            {saving ? "Salvando..." : "Salvar rascunho"}
          </Button>
          <Button type="button" onClick={handleGeneratePdf} disabled={generating}>
            {generating ? "Gerando..." : "Gerar PDF"}
          </Button>
        </div>
      ) : null}

      {proposal.pdf_file ? (
        <div className="space-y-3 rounded-xl border border-border p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-semibold">PDF da minuta</h2>
            <Link
              href={`/dashboard/minutas/${proposal.id}/pdf`}
              className="text-sm text-primary hover:underline"
            >
              Abrir visualização
            </Link>
          </div>
          <iframe
            title="PDF da minuta"
            src={proposal.pdf_file.url}
            className="h-[480px] w-full rounded-md border border-border"
          />
        </div>
      ) : null}

      {canReview ? (
        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={handleApprove} disabled={acting}>
            Aprovar
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setReasonOpen("changes");
              setReasonText("");
            }}
            disabled={acting}
          >
            Solicitar alterações
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => {
              setReasonOpen("reject");
              setReasonText("");
            }}
            disabled={acting}
          >
            Rejeitar
          </Button>
        </div>
      ) : null}

      {proposal.status === "sent_to_agreements" && proposal.agreement_id ? (
        <div className="space-y-3 rounded-xl border border-primary/30 bg-primary/5 p-4">
          <div>
            <h2 className="text-base font-semibold text-primary">
              Processo de acordo iniciado!
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {proposal.my_role === "interested"
                ? "A minuta foi aprovada com sucesso. Em breve, você receberá o documento para assinatura. Fique de olho nas suas notificações."
                : "A minuta foi aprovada e o processo de acordo foi iniciado. Acompanhe as assinaturas na área de Acordos."}
            </p>
          </div>
          {proposal.my_role === "offerer" ? (
            <Button
              type="button"
              onClick={() =>
                router.push(`/dashboard/acordos/${proposal.agreement_id}`)
              }
            >
              Ir para Acordos
            </Button>
          ) : null}
        </div>
      ) : null}

      {reasonOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md space-y-4 rounded-xl bg-background p-5 shadow-lg">
            <h3 className="text-lg font-semibold">
              {reasonOpen === "changes"
                ? "Solicitar alterações"
                : "Rejeitar minuta"}
            </h3>
            <Textarea
              value={reasonText}
              onChange={(e) => setReasonText(e.target.value)}
              rows={4}
              placeholder={
                reasonOpen === "changes"
                  ? "Descreva as alterações necessárias..."
                  : "Informe o motivo da rejeição..."
              }
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setReasonOpen(null)}
                disabled={acting}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleReasonSubmit}
                disabled={acting || !reasonText.trim()}
              >
                Confirmar
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function PartyFields({
  label,
  party,
  onChange,
  disabled,
}: {
  label: string;
  party: PartyDraft;
  onChange: (party: PartyDraft) => void;
  disabled: boolean;
}) {
  function setField<K extends keyof PartyDraft>(key: K, value: PartyDraft[K]) {
    onChange({ ...party, [key]: value });
  }

  return (
    <div className="space-y-3 rounded-xl border border-border p-4">
      <h2 className="font-semibold">{label}</h2>
      <div className="grid gap-3 md:grid-cols-2">
        <Field
          label="Razão social"
          value={party.legal_name}
          onChange={(v) => setField("legal_name", v)}
          disabled={disabled}
        />
        <Field
          label="Nome fantasia"
          value={party.trade_name ?? ""}
          onChange={(v) => setField("trade_name", v || null)}
          disabled={disabled}
        />
        <Field
          label="CNPJ"
          value={party.tax_id}
          onChange={(v) => setField("tax_id", v)}
          disabled={disabled}
        />
        <Field
          label="Representante legal"
          value={party.legal_representative ?? ""}
          onChange={(v) => setField("legal_representative", v || null)}
          disabled={disabled}
        />
        <Field
          label="Endereço"
          value={party.address_line ?? ""}
          onChange={(v) => setField("address_line", v || null)}
          disabled={disabled}
          className="md:col-span-2"
        />
        <Field
          label="Cidade"
          value={party.city ?? ""}
          onChange={(v) => setField("city", v || null)}
          disabled={disabled}
        />
        <Field
          label="Estado"
          value={party.state ?? ""}
          onChange={(v) => setField("state", v || null)}
          disabled={disabled}
        />
        <Field
          label="E-mail"
          value={party.email ?? ""}
          onChange={(v) => setField("email", v || null)}
          disabled={disabled}
        />
        <Field
          label="Telefone"
          value={party.phone ?? ""}
          onChange={(v) => setField("phone", v || null)}
          disabled={disabled}
        />
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  disabled,
  className,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
  className?: string;
}) {
  return (
    <div className={`space-y-1 ${className ?? ""}`}>
      <label className="text-xs text-muted-foreground">{label}</label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      />
    </div>
  );
}

const SELECT_CLASS =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none disabled:cursor-not-allowed disabled:opacity-50 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";

function ForoFields({
  city,
  state,
  onCityChange,
  onStateChange,
  editable,
  contentHtml,
  contractorName,
  contractedName,
}: {
  city: string;
  state: string;
  onCityChange: (value: string) => void;
  onStateChange: (value: string) => void;
  editable: boolean;
  contentHtml: string;
  contractorName: string;
  contractedName: string;
}) {
  const cidade = city.trim() || "[cidade]";
  const uf = state.trim() || "[UF]";
  const preview = editable
    ? `<p>As partes elegem o foro da Comarca de <strong>${cidade}</strong> - <strong>${uf}</strong>, para dirimir quaisquer dúvidas deste Instrumento, renunciando a qualquer outro por mais privilegiado que seja.</p><p>E, por estarem justas e contratadas, firmam o presente em 2 (duas) vias de igual teor, juntamente com 2 (duas) testemunhas.</p><p class="closing-date">${cidade}- ${uf}, [dia] de [mês] de [ano].</p><div class="signatures"><p class="signature">____________________________________<br/>${contractorName || "[razão social da contratante]"}</p><p class="signature-spacer"><br/><br/><br/><br/></p><p class="signature signature-next">____________________________________<br/>${contractedName || "[razão social da contratada]"}</p></div>`
    : contentHtml;

  return (
    <div className="space-y-3">
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Cidade da comarca</label>
          <Input
            value={city}
            onChange={(e) => onCityChange(e.target.value)}
            disabled={!editable}
            placeholder="Cidade"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Estado</label>
          <select
            className={SELECT_CLASS}
            value={state}
            onChange={(e) => onStateChange(e.target.value)}
            disabled={!editable}
          >
            <option value="">Selecione</option>
            {BRAZILIAN_STATES.map((ufOption) => (
              <option key={ufOption} value={ufOption}>
                {ufOption}
              </option>
            ))}
          </select>
        </div>
      </div>
      {!editable ? (
        <p className="text-xs text-muted-foreground">
          A comarca é definida pelo administrador da plataforma.
        </p>
      ) : null}
      <div
        className="rounded-md border border-border bg-muted/20 p-3 text-sm leading-relaxed [&_p]:mb-2 last:[&_p]:mb-0 [&_.closing-date]:text-center [&_.signatures]:mt-4 [&_.signatures]:text-center [&_.signature]:mt-0 [&_.signature]:text-center [&_.signature-next]:mt-28"
        dangerouslySetInnerHTML={{ __html: preview }}
      />
    </div>
  );
}
