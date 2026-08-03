"use client";

import { Skeleton } from "@econmesh-app/ui/components/skeleton";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { ConversationList } from "@/modules/conversations/components/conversation-list";
import { conversationsService } from "@/services/conversations/conversations.service";
import type { Conversation } from "@/types/api";
import { ApiError } from "@/utils/errors";

export default function ConversasPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  const loadConversations = useCallback(async () => {
    setLoading(true);
    try {
      const data = await conversationsService.list({ page: 1, page_size: 50 });
      setConversations(data.items);
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : "Não foi possível carregar as conversas.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadConversations();
  }, [loadConversations]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Conversas</h1>
        <p className="text-sm text-muted-foreground">
          Negocie com outras empresas a partir das oportunidades.
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : (
        <ConversationList conversations={conversations} />
      )}
    </div>
  );
}
