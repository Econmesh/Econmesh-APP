import { Suspense } from "react";

import { ConversationDetailView } from "@/modules/conversations/components/conversation-detail-view";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ConversaDetailPage({ params }: PageProps) {
  const { id } = await params;
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Carregando conversa...</p>}>
      <ConversationDetailView conversationId={id} />
    </Suspense>
  );
}
