import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Notification {
  id: string;
  user_id: string;
  booking_id: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
}

export const useNotifications = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data, error } = await api.notifications.list();
      if (error) throw new Error(error);
      return data as Notification[];
    },
    enabled: !!user,
    refetchInterval: 10_000, // Poll every 10 seconds (replaces Supabase realtime)
  });

  const markAsRead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await api.notifications.markAsRead(id);
      if (error) throw new Error(error);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllAsRead = useMutation({
    mutationFn: async () => {
      const { error } = await api.notifications.markAllAsRead();
      if (error) throw new Error(error);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const unreadCount = query.data?.filter(n => !n.is_read).length ?? 0;

  return { notifications: query.data ?? [], unreadCount, markAsRead, markAllAsRead, isLoading: query.isLoading };
};
