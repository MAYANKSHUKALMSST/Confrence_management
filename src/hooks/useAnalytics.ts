import { useQuery } from '@tanstack/react-query';
import { api } from '@/integrations/supabase/client';

export interface AnalyticsData {
  peakHours: { hour: number; count: number }[];
  roomOccupancy: { name: string; value: number }[];
  deptActivity: { name: string; value: number }[];
  monthlyTrend: { date: string; count: number }[];
  bookings: {
    id: string;
    room: string;
    title: string;
    department: string;
    attendees: string;
    start_time: string;
    end_time: string;
    profile_full_name?: string;
    profile_email?: string;
  }[];
  stats: {
    totalBookings: number;
    totalRooms: number;
    totalUsers: number;
    avgDurationMinutes: number;
    popularRoom: string;
    activeDept: string;
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
