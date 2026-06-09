import { EmptyState } from "@/components/feedback/empty-state";
import { Headphones } from "lucide-react";

export default function SuportePage() {
  return (
    <EmptyState
      icon={Headphones}
      title="Suporte"
      description="Módulo em construção. Em breve você poderá abrir chamados de suporte aqui."
    />
  );
}
