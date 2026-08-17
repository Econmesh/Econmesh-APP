import { api } from "@/services/api/client";
import type { PlatformSettings } from "@/types/api";

export const platformSettingsService = {
  get() {
    return api.get<PlatformSettings>("/platform/settings", { auth: true });
  },
};
