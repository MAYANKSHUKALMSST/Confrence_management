import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/integrations/supabase/client';
import { Room } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

export const useRooms = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: rooms = [], isLoading } = useQuery({
    queryKey: ['rooms'],
    queryFn: async () => {
      const { data, error } = await api.rooms.list();
      if (error) throw new Error(error);
      return data as Room[];
    },
  });

  const createRoom = useMutation({
    mutationFn: (newRoom: Partial<Room>) => api.rooms.create(newRoom),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      toast({ title: 'Success', description: 'Room created successfully' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const updateRoom = useMutation({
    mutationFn: ({ id, room }: { id: string; room: Partial<Room> }) => api.rooms.update(id, room),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      toast({ title: 'Success', description: 'Room updated successfully' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const deleteRoom = useMutation({
    mutationFn: (id: string) => api.rooms.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      toast({ title: 'Success', description: 'Room deleted' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  return {
    rooms,
    isLoading,
    createRoom,
    updateRoom,
    deleteRoom,
  };
};
