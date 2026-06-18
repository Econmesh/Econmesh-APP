import { api } from "@/services/api/client";
import type {
  Company,
  CompanyCreatePayload,
  CompanyUpdatePayload,
  LogoPresignResponse,
  StorageUploadResponse,
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
    const formData = new FormData();
    formData.append("file", file);

    const result = await api.upload<StorageUploadResponse>(
      "/companies/logo/upload",
      formData,
      { auth: true },
    );

    return {
      storage_key: result.storage_key,
      public_url: result.public_url,
    };
  },
};
