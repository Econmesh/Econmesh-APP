import { TicketCreateForm } from "@/modules/support/components/ticket-create-form";

export default function NovoChamadoPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Novo chamado</h1>
        <p className="text-sm text-muted-foreground">
          Descreva sua solicitação. Nossa equipe responderá em breve.
        </p>
      </div>
      <TicketCreateForm />
    </div>
  );
}
