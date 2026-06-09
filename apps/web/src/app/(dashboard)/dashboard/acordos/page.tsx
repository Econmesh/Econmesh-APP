import { EmptyState } from "@/components/feedback/empty-state";
import { Handshake } from "lucide-react";

export default function AcordosPage() {
  return (
    <EmptyState
      icon={Handshake}
      title="Acordos"
      description="Módulo em construção. Em breve você poderá gerenciar acordos aqui."
    />
  );
}
