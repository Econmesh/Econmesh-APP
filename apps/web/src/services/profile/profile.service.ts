import { api } from "@/services/api/client";
import type {
  AvatarPresignResponse,
  StorageUploadResponse,
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
    const formData = new FormData();
    formData.append("file", file);

    const result = await api.upload<StorageUploadResponse>(
      "/users/avatar/upload",
      formData,
      { auth: true },
    );

    return {
      storage_key: result.storage_key,
      public_url: result.public_url,
    };
  },
};
