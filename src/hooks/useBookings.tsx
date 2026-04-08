import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/integrations/supabase/client';
import type { Booking, RoomName, Department, BookingStatus } from '@/lib/types';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export const useBookings = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const bookingsQuery = useQuery({
    queryKey: ['bookings'],
    queryFn: async () => {
      const { data, error } = await api.bookings.list();
      if (error) throw new Error(error);
      return data as Booking[];
    },
    enabled: !!user,
  });

  const createBooking = useMutation({
    mutationFn: async (booking: {
      room: RoomName;
      title: string;
      department: Department;
      attendees: string;
      start_time: string;
      end_time: string;
    }) => {
      const { data, error } = await api.bookings.create(booking);
      if (error) throw new Error(error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      toast.success('Booking request submitted');
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const updateBookingStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: BookingStatus }) => {
      const { data, error } = await api.bookings.updateStatus(id, status);
      if (error) throw new Error(error);
      return data;
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      toast.success(`Booking ${status}`);
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const updateBooking = useMutation({
    mutationFn: async ({ id, booking }: { 
      id: string; 
      booking: {
        room: RoomName;
        title: string;
        department: Department;
        attendees: string;
        start_time: string;
        end_time: string;
      }
    }) => {
      const { data, error } = await api.bookings.update(id, booking);
      if (error) throw new Error(error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      toast.success('Booking updated successfully');
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const deleteBooking = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await api.bookings.delete(id);
      if (error) throw new Error(error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      toast.success('Booking deleted');
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  return { bookings: bookingsQuery.data ?? [], isLoading: bookingsQuery.isLoading, createBooking, updateBookingStatus, updateBooking, deleteBooking };
};
