import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

interface SocketContextType {
  socket: Socket | null;
  connected: boolean;
}

const SocketContext = createContext<SocketContextType>({ socket: null, connected: false });

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    // In production, this should match your API URL
    const newSocket = io(window.location.origin.replace('8080', '3001'), {
      withCredentials: true,
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      setConnected(true);
      console.log('🔌 Socket connected');
    });

    newSocket.on('disconnect', () => {
      setConnected(false);
      console.log('🔌 Socket disconnected');
    });

    // Real-time Booking Events
    newSocket.on('booking_created', (data) => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      toast({
        title: "New Booking",
        description: `A new booking has been created in ${data.bookings[0].room}.`,
      });
    });

    newSocket.on('booking_updated', (data) => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      // Optional: more specific toast if status changed
    });

    newSocket.on('booking_deleted', () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [queryClient, toast]);

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
