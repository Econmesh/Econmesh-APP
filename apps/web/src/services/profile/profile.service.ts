import { api } from "@/services/api/client";
import type {
  AvatarPresignResponse,
  UserProfile,
  UserProfileUpdatePayload,
} from "@/types/api";

export const profileService = {
  get() {
    return api.get<UserProfile>("/users/me/profile", { auth: true });
  },

  update(body: UserProfileUpdatePayload) {
    return api.patch<UserProfile>("/users/me/profile", body, { auth: true });
  },

  presignAvatar(filename: string, contentType: string) {
    return api.post<AvatarPresignResponse>(
      "/users/avatar/presign",
      { filename, content_type: contentType },
      { auth: true },
    );
  },

  async uploadAvatar(file: File): Promise<{ storage_key: string; public_url: string }> {
    const presign = await this.presignAvatar(file.name, file.type || "application/octet-stream");

    const uploadResponse = await fetch(presign.upload_url, {
      method: "PUT",
      body: file,
      headers: { "Content-Type": file.type || "application/octet-stream" },
    });

    if (!uploadResponse.ok) {
      throw new Error("Falha ao enviar a foto.");
    }

    return {
      storage_key: presign.storage_key,
      public_url: presign.public_url,
    };
  },
};
