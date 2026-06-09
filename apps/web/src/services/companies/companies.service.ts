import { api } from "@/services/api/client";
import type {
  Company,
  CompanyCreatePayload,
  CompanyUpdatePayload,
  LogoPresignResponse,
} from "@/types/api";

export const companiesService = {
  list(params?: { page?: number; page_size?: number }) {
    const page = params?.page ?? 1;
    const pageSize = params?.page_size ?? 50;
    return api.get<Company[]>(`/companies?page=${page}&page_size=${pageSize}`, {
      auth: true,
    });
  },

  get(id: string) {
    return api.get<Company>(`/companies/${id}`, { auth: true });
  },

  create(body: CompanyCreatePayload) {
    return api.post<Company>("/companies", body, { auth: true });
  },

  update(id: string, body: CompanyUpdatePayload) {
    return api.patch<Company>(`/companies/${id}`, body, { auth: true });
  },

  delete(id: string) {
    return api.delete<void>(`/companies/${id}`, { auth: true });
  },

  presignLogo(filename: string, contentType: string) {
    return api.post<LogoPresignResponse>(
      "/companies/logo/presign",
      { filename, content_type: contentType },
      { auth: true },
    );
  },

  async uploadLogo(file: File): Promise<{ storage_key: string; public_url: string }> {
    const presign = await this.presignLogo(file.name, file.type || "application/octet-stream");

    const uploadResponse = await fetch(presign.upload_url, {
      method: "PUT",
      body: file,
      headers: { "Content-Type": file.type || "application/octet-stream" },
    });

    if (!uploadResponse.ok) {
      throw new Error("Falha ao enviar o logotipo.");
    }

    return {
      storage_key: presign.storage_key,
      public_url: presign.public_url,
    };
  },
};
