import { z } from "zod";

export const createTicketSchema = z.object({
  subject: z.string().min(3, "Assunto deve ter pelo menos 3 caracteres").max(200),
  message: z.string().min(1, "Descreva sua solicitação").max(5000),
});

export type CreateTicketFormValues = z.infer<typeof createTicketSchema>;

export const SUPPORT_STATUS_LABELS: Record<string, string> = {
  open: "Aberto",
  in_progress: "Em atendimento",
  closed: "Encerrado",
};
