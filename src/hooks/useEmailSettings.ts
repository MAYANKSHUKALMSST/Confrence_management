import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface EmailSettings {
  id?: string;
  smtp_host: string;
  smtp_port: number;
  email: string;
  app_password?: string;
  has_password?: boolean;
}

export const useEmailSettings = () => {
  const queryClient = useQueryClient();

  const settingsQuery = useQuery({
    queryKey: ['email-settings'],
    queryFn: async () => {
      const { data, error } = await api.emailSettings.get();
      if (error) throw new Error(error);
      return data as EmailSettings | null;
    },
  });

  const updateSettings = useMutation({
    mutationFn: async (settings: EmailSettings) => {
      const { data, error } = await api.emailSettings.update(settings);
      if (error) throw new Error(error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-settings'] });
      toast.success('Email settings updated successfully');
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const deleteSettings = useMutation({
    mutationFn: async () => {
      const { data, error } = await api.emailSettings.delete();
      if (error) throw new Error(error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-settings'] });
      toast.success('Email settings deleted');
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const testSettings = useMutation({
    mutationFn: async (settings: EmailSettings) => {
      const { data, error } = await api.emailSettings.test(settings);
      if (error) throw new Error(error);
      return data;
    },
    onSuccess: () => {
      toast.success('Test email sent! Check your inbox.');
    },
    onError: (err: Error) => {
      toast.error(`Test failed: ${err.message}`);
    },
  });

  return {
    settings: settingsQuery.data,
    isLoading: settingsQuery.isLoading,
    updateSettings,
    deleteSettings,
    testSettings,
  };
};
