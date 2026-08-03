import { ConversationDetailView } from "@/modules/conversations/components/conversation-detail-view";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ConversaDetailPage({ params }: PageProps) {
  const { id } = await params;
  return <ConversationDetailView conversationId={id} />;
}
