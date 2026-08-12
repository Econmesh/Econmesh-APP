import type { UserDashboardResponse } from "@/types/dashboard";
import { api } from "@/services/api/client";

export const dashboardService = {
  get(days = 30) {
    return api.get<UserDashboardResponse>(`/dashboard?days=${days}`, {
      auth: true,
    });
  },
};
