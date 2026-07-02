"use client";

import { Button } from "@econmesh-app/ui/components/button";
import { Input } from "@econmesh-app/ui/components/input";
import { Label } from "@econmesh-app/ui/components/label";
import { Textarea } from "@econmesh-app/ui/components/textarea";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { createTicketSchema } from "@/modules/support/schemas";
import { supportService } from "@/services/support/support.service";
import { ApiError } from "@/utils/errors";

export function TicketCreateForm() {
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = createTicketSchema.safeParse({ subject, message });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Dados inválidos.");
      return;
    }

    setSubmitting(true);
    try {
      const ticket = await supportService.create(parsed.data);
      toast.success("Chamado aberto com sucesso.", {
        description: "Nossa equipe responderá em breve.",
      });
      router.push(`/dashboard/suporte/${ticket.id}`);
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Não foi possível abrir o chamado.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-xl space-y-4">
      <div className="space-y-2">
        <Label htmlFor="subject">Assunto</Label>
        <Input
          id="subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Ex.: Dúvida sobre oportunidade"
          maxLength={200}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="message">Descreva sua solicitação</Label>
        <Textarea
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Conte o que aconteceu ou o que você precisa..."
          rows={6}
          maxLength={5000}
        />
      </div>
      <p className="text-sm text-muted-foreground">
        Seu chamado será analisado pela equipe. Você receberá uma resposta em breve — não é um
        chat em tempo real.
      </p>
      <Button type="submit" disabled={submitting}>
        {submitting ? "Abrindo..." : "Abrir chamado"}
      </Button>
    </form>
  );
}
