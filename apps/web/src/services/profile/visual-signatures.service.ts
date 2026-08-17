import { api } from "@/services/api/client";
import type {
  VisualSignature,
  VisualSignatureFont,
  VisualSignatureInitialsOption,
  VisualSignatureKind,
  VisualSignaturePreview,
  VisualSignaturesBundle,
} from "@/types/api";

export const visualSignaturesService = {
  list() {
    return api.get<VisualSignaturesBundle>("/users/me/visual-signatures", { auth: true });
  },

  fonts() {
    return api.get<VisualSignatureFont[]>("/users/me/visual-signatures/fonts", { auth: true });
  },

  initialsOptions() {
    return api.get<VisualSignatureInitialsOption[]>(
      "/users/me/visual-signatures/initials-options",
      { auth: true },
    );
  },

  preview(body: {
    kind: VisualSignatureKind;
    font_id: string;
    text_variant?: string | null;
  }) {
    return api.post<VisualSignaturePreview>(
      "/users/me/visual-signatures/preview",
      body,
      { auth: true },
    );
  },

  confirmAutomatic(body: {
    kind: VisualSignatureKind;
    font_id: string;
    text_variant?: string | null;
  }) {
    return api.post<VisualSignature>(
      "/users/me/visual-signatures/automatic",
      body,
      { auth: true },
    );
  },

  confirmManual(kind: VisualSignatureKind, file: File) {
    const formData = new FormData();
    formData.append("kind", kind);
    formData.append("file", file);
    return api.upload<VisualSignature>("/users/me/visual-signatures/manual", formData, {
      auth: true,
    });
  },

  getImage(id: string) {
    return api.getArrayBuffer(`/users/me/visual-signatures/${id}/image`, { auth: true });
  },
};
