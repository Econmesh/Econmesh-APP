import { EmptyState } from "@/components/feedback/empty-state";
import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold tracking-tight">Configurações</h1>
      <EmptyState
        icon={Settings}
        title="Preferências"
        description="Configurações da conta estarão disponíveis em uma próxima versão."
      />
    </div>
  );
}
