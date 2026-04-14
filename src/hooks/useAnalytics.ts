import { useQuery } from '@tanstack/react-query';
import { api } from '@/integrations/supabase/client';

export interface AnalyticsData {
  peakHours: { hour: number; count: number }[];
  roomOccupancy: { name: string; value: number }[];
  deptActivity: { name: string; value: number }[];
  stats: {
    totalBookings: number;
    totalRooms: number;
    totalUsers: number;
  };
}

export const useAnalytics = () => {
  return useQuery({
    queryKey: ['analytics'],
    queryFn: async () => {
      const { data, error } = await api.analytics.get();
      if (error) throw new Error(error);
      return data as AnalyticsData;
    },
    refetchInterval: 60000, // Refresh every minute
  });
};
