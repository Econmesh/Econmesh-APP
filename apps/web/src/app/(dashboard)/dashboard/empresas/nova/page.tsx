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
            Empresa
          </Link>
          {" / "}Nova empresa
        </p>
        <h1 className="mt-1 text-2xl font-semibold">Cadastrar empresa</h1>
        <p className="text-sm text-muted-foreground">
          Preencha os dados da sua empresa. Cada conta pode ter apenas uma empresa.
        </p>
      </div>

      <CompanyForm
        mode="create"
        submitLabel="Cadastrar empresa"
        onSubmit={async (payload, files) => {
          const company = await companiesService.create(payload);
          await companiesService.uploadDocument(
            company.id,
            "operating_license",
            files.operating_license,
          );
          await companiesService.uploadDocument(company.id, "mtr", files.mtr);
          if (files.signature_authorization) {
            await companiesService.uploadDocument(
              company.id,
              "signature_authorization",
              files.signature_authorization,
            );
          }
          toast.success("Empresa cadastrada com sucesso.");
          router.push("/dashboard/empresas");
        }}
      />
    </div>
  );
}
