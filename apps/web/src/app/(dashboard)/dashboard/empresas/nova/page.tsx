"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { CompanyForm } from "@/modules/companies/components/company-form";
import { companiesService } from "@/services/companies/companies.service";

export default function NovaEmpresaPage() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">
          <Link href="/dashboard/empresas" className="hover:underline">
            Empresas
          </Link>
          {" / "}Nova empresa
        </p>
        <h1 className="mt-1 text-2xl font-semibold">Cadastrar empresa</h1>
        <p className="text-sm text-muted-foreground">
          Preencha os dados da empresa para adicioná-la à sua conta.
        </p>
      </div>

      <CompanyForm
        mode="create"
        submitLabel="Cadastrar empresa"
        onSubmit={async (payload) => {
          const company = await companiesService.create(payload);
          toast.success("Empresa cadastrada com sucesso.");
          router.push(`/dashboard/empresas/${company.id}`);
        }}
      />
    </div>
  );
}
