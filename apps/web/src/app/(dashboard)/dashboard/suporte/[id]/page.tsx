import { TicketDetailView } from "@/modules/support/components/ticket-detail-view";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ChamadoDetailPage({ params }: PageProps) {
  const { id } = await params;
  return <TicketDetailView ticketId={id} />;
}
