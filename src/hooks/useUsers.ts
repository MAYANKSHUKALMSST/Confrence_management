import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/integrations/supabase/client';
import { Profile, AppRole } from '@/lib/types';
import { toast } from 'sonner';

export const useUsers = () => {
  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data, error } = await api.users.list();
      if (error) throw new Error(error);
      return data as (Profile & { email: string; role: AppRole })[];
    },
  });

  const createUser = useMutation({
    mutationFn: async (newUser: any) => {
      const { data, error } = await api.users.create(newUser);
      if (error) throw new Error(error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User created successfully');
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const changePassword = useMutation({
    mutationFn: async ({ id, password }: { id: string; password: string }) => {
      const { data, error } = await api.users.changePassword(id, password);
      if (error) throw new Error(error);
      return data;
    },
    onSuccess: () => {
      toast.success('Password updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const updateRole = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: AppRole }) => {
      const { data, error } = await api.users.updateRole(id, role);
      if (error) throw new Error(error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Role updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const deleteUser = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await api.users.delete(id);
      if (error) throw new Error(error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  return {
    users,
    isLoading,
    createUser,
    changePassword,
    updateRole,
    deleteUser,
  };
};
