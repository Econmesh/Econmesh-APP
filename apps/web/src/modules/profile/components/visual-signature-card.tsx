"use client";

import { Button } from "@econmesh-app/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@econmesh-app/ui/components/card";
import { Label } from "@econmesh-app/ui/components/label";
import { Select } from "@econmesh-app/ui/components/select";
import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { SignaturePad } from "@/modules/profile/components/signature-pad";
import { visualSignaturesService } from "@/services/profile/visual-signatures.service";
import type {
  VisualSignature,
  VisualSignatureFont,
  VisualSignatureInitialsOption,
  VisualSignatureKind,
  VisualSignaturePreview,
} from "@/types/api";
import { ApiError } from "@/utils/errors";

type Mode = "choose" | "draw" | "auto";

type VisualSignatureCardProps = {
  kind: VisualSignatureKind;
  artifact: VisualSignature | null;
  onCreated: (artifact: VisualSignature) => void;
  compact?: boolean;
};

const COPY: Record<
  VisualSignatureKind,
  { title: string; description: string; draw: string; auto: string }
> = {
  signature: {
    title: "Assinatura visual",
    description:
      "Crie sua assinatura uma única vez. Depois de confirmada, ela fica vinculada ao perfil e é usada nos acordos.",
    draw: "Desenhar assinatura",
    auto: "Gerar automaticamente",
  },
  initials: {
    title: "Rúbrica",
    description:
      "Crie sua rúbrica uma única vez. Depois de confirmada, ela fica vinculada ao perfil e é usada nos acordos.",
    draw: "Desenhar rúbrica",
    auto: "Gerar automaticamente",
  },
};

export function VisualSignatureCard({
  kind,
  artifact,
  onCreated,
  compact = false,
}: VisualSignatureCardProps) {
  const copy = COPY[kind];

  if (artifact) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{copy.title}</CardTitle>
          <CardDescription>Confirmada e imutável.</CardDescription>
        </CardHeader>
        <CardContent>
          <ConfirmedSignature artifact={artifact} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{copy.title}</CardTitle>
        <CardDescription>{copy.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <VisualSignatureWizard kind={kind} onCreated={onCreated} compact={compact} />
      </CardContent>
    </Card>
  );
}

export function VisualSignatureWizard({
  kind,
  onCreated,
}: {
  kind: VisualSignatureKind;
  onCreated: (artifact: VisualSignature) => void;
  compact?: boolean;
}) {
  const copy = COPY[kind];
  const [mode, setMode] = useState<Mode>("choose");
  const [submitting, setSubmitting] = useState(false);
  const padRef = useRef<{
    exportPng: () => Promise<Blob | null>;
    clear: () => void;
    isEmpty: () => boolean;
  } | null>(null);

  const handlePadReady = useCallback(
    (
      exportPng: () => Promise<Blob | null>,
      clear: () => void,
      isEmpty: () => boolean,
    ) => {
      padRef.current = { exportPng, clear, isEmpty };
    },
    [],
  );

  async function confirmDraw() {
    const pad = padRef.current;
    if (!pad || pad.isEmpty()) {
      toast.error("Desenhe a assinatura antes de confirmar.");
      return;
    }
    const blob = await pad.exportPng();
    if (!blob) {
      toast.error("Não foi possível gerar a imagem.");
      return;
    }
    setSubmitting(true);
    try {
      const file = new File([blob], `${kind}.png`, { type: "image/png" });
      const created = await visualSignaturesService.confirmManual(kind, file);
      toast.success("Assinatura confirmada.");
      onCreated(created);
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Não foi possível salvar a assinatura.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      {mode === "choose" ? (
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={() => setMode("draw")}>
            {copy.draw}
          </Button>
          <Button type="button" onClick={() => setMode("auto")}>
            {copy.auto}
          </Button>
        </div>
      ) : null}

      {mode === "draw" ? (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Desenhe com o mouse em fundo branco. A tinta é preta e, após confirmar, a
            imagem não poderá ser alterada.
          </p>
          <SignaturePad
            width={kind === "initials" ? 240 : 480}
            height={140}
            disabled={submitting}
            onReady={handlePadReady}
          />
          <div className="flex flex-wrap gap-2">
            <Button type="button" disabled={submitting} onClick={() => void confirmDraw()}>
              {submitting ? "Confirmando…" : "Confirmar"}
            </Button>
            <Button type="button" variant="ghost" disabled={submitting} onClick={() => setMode("choose")}>
              Voltar
            </Button>
          </div>
        </div>
      ) : null}

      {mode === "auto" ? (
        <AutomaticGenerator
          kind={kind}
          submitting={submitting}
          setSubmitting={setSubmitting}
          onCreated={onCreated}
          onBack={() => setMode("choose")}
        />
      ) : null}
    </div>
  );
}

function AutomaticGenerator({
  kind,
  submitting,
  setSubmitting,
  onCreated,
  onBack,
}: {
  kind: VisualSignatureKind;
  submitting: boolean;
  setSubmitting: (value: boolean) => void;
  onCreated: (artifact: VisualSignature) => void;
  onBack: () => void;
}) {
  const [fonts, setFonts] = useState<VisualSignatureFont[]>([]);
  const [variants, setVariants] = useState<VisualSignatureInitialsOption[]>([]);
  const [fontId, setFontId] = useState("");
  const [variantId, setVariantId] = useState("");
  const [preview, setPreview] = useState<VisualSignaturePreview | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  useEffect(() => {
    void visualSignaturesService
      .fonts()
      .then((items) => {
        setFonts(items);
        if (items[0]) setFontId(items[0].id);
      })
      .catch((error: unknown) => {
        toast.error(
          error instanceof ApiError
            ? error.message
            : "Não foi possível carregar as fontes.",
        );
      });
    if (kind === "initials") {
      void visualSignaturesService
        .initialsOptions()
        .then((items) => {
          setVariants(items);
          if (items[0]) setVariantId(items[0].id);
        })
        .catch((error: unknown) => {
          toast.error(
            error instanceof ApiError
              ? error.message
              : "Não foi possível carregar as opções de rúbrica.",
          );
        });
    }
  }, [kind]);

  useEffect(() => {
    if (!fontId) return;
    if (kind === "initials" && !variantId) return;
    const timer = window.setTimeout(() => {
      setLoadingPreview(true);
      void visualSignaturesService
        .preview({
          kind,
          font_id: fontId,
          text_variant: kind === "initials" ? variantId : undefined,
        })
        .then(setPreview)
        .catch((error: unknown) => {
          setPreview(null);
          toast.error(
            error instanceof ApiError
              ? error.message
              : "Não foi possível gerar a pré-visualização.",
          );
        })
        .finally(() => setLoadingPreview(false));
    }, 200);
    return () => window.clearTimeout(timer);
  }, [fontId, kind, variantId]);

  async function confirm() {
    if (!preview?.unique) {
      toast.error("Esta combinação de caracteres e fonte já está em uso.");
      return;
    }
    setSubmitting(true);
    try {
      const created = await visualSignaturesService.confirmAutomatic({
        kind,
        font_id: fontId,
        text_variant: kind === "initials" ? variantId : undefined,
      });
      toast.success("Assinatura confirmada.");
      onCreated(created);
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Não foi possível confirmar a assinatura.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-3">
      {kind === "initials" ? (
        <div className="space-y-1">
          <Label htmlFor={`${kind}-variant`}>Forma da rúbrica</Label>
          <Select
            id={`${kind}-variant`}
            value={variantId}
            onChange={(event) => setVariantId(event.target.value)}
            disabled={submitting}
          >
            {variants.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label} ({option.text})
              </option>
            ))}
          </Select>
        </div>
      ) : null}

      <div className="space-y-1">
        <Label htmlFor={`${kind}-font`}>Fonte</Label>
        <Select
          id={`${kind}-font`}
          value={fontId}
          onChange={(event) => setFontId(event.target.value)}
          disabled={submitting}
        >
          {fonts.map((font) => (
            <option key={font.id} value={font.id}>
              {font.name}
            </option>
          ))}
        </Select>
      </div>

      <div className="overflow-hidden rounded-md border bg-white p-3">
        {loadingPreview ? (
          <div className="flex h-24 items-center justify-center">
            <Loader2 className="size-5 animate-spin text-muted-foreground" aria-hidden />
          </div>
        ) : preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            alt="Pré-visualização"
            src={`data:${preview.content_type};base64,${preview.image_base64}`}
            className="mx-auto h-24 w-auto"
          />
        ) : (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Escolha uma fonte para visualizar.
          </p>
        )}
      </div>

      {preview && !preview.unique ? (
        <p className="text-sm text-destructive">
          Já existe uma assinatura gerada com estes caracteres e esta fonte. Escolha outra
          fonte{kind === "initials" ? " ou outra forma da rúbrica" : ""}.
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          disabled={submitting || !preview?.unique}
          onClick={() => void confirm()}
        >
          {submitting ? "Confirmando…" : "Confirmar"}
        </Button>
        <Button type="button" variant="ghost" disabled={submitting} onClick={onBack}>
          Voltar
        </Button>
      </div>
    </div>
  );
}

function ConfirmedSignature({ artifact }: { artifact: VisualSignature }) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;
    void visualSignaturesService.getImage(artifact.id).then((buffer) => {
      if (cancelled) return;
      objectUrl = URL.createObjectURL(new Blob([buffer], { type: "image/png" }));
      setSrc(objectUrl);
    });
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [artifact.id]);

  const created = new Date(artifact.created_at);
  const createdLabel = Number.isNaN(created.getTime())
    ? artifact.created_at
    : created.toLocaleString("pt-BR");

  return (
    <div className="space-y-3">
      <div className="rounded-md border bg-white p-3">
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img alt="Assinatura confirmada" src={src} className="mx-auto h-24 w-auto" />
        ) : (
          <div className="flex h-24 items-center justify-center">
            <Loader2 className="size-5 animate-spin text-muted-foreground" aria-hidden />
          </div>
        )}
      </div>
      <dl className="grid gap-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs text-muted-foreground">Origem</dt>
          <dd>{artifact.source === "automatic" ? "Gerada automaticamente" : "Desenhada"}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Criada em</dt>
          <dd>{createdLabel}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-xs text-muted-foreground">Hash</dt>
          <dd className="break-all font-mono text-xs">{artifact.sha256}</dd>
        </div>
      </dl>
    </div>
  );
}
