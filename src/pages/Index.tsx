import AppLayout from '@/components/AppLayout';
import WeeklyCalendar from '@/components/WeeklyCalendar';
import BookingForm from '@/components/BookingForm';
import { useBookings } from '@/hooks/useBookings';
import { useAuth } from '@/hooks/useAuth';
import { useRooms } from '@/hooks/useRooms';
import { format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

const Index = () => {
  const { bookings = [], isLoading: bookingsLoading, updateBookingStatus } = useBookings();
  const { rooms = [], isLoading: roomsLoading } = useRooms();
  const { isAdmin } = useAuth();
  const [activeRoom, setActiveRoom] = useState<string | null>(null);

  const isLoading = bookingsLoading || roomsLoading;


  // Set first room as default active tab once rooms load
  useEffect(() => {
    if (rooms.length > 0 && !activeRoom) {
      setActiveRoom(rooms[0].name);
    }
  }, [rooms]);

  return (
    <AppLayout>
      <div className="animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 bg-background/20 backdrop-blur-sm p-4 rounded-xl border border-white/5">
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground">Dashboard</h1>
            <p className="text-foreground/80 text-sm mt-1 font-medium">View room availability and create bookings</p>
          </div>
          <BookingForm />
        </div>

        {/* Room Calendar Tabs */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : (
          <div>
            {/* Tab Buttons */}
            <div className="flex flex-wrap gap-2 mb-4">
              {Array.isArray(rooms) && rooms.map(room => (
                <button
                  key={room.id}
                  onClick={() => setActiveRoom(room.name)}
                  className={`
                    relative px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300
                    ${activeRoom === room.name
                      ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30 scale-105'
                      : 'bg-card text-muted-foreground hover:text-foreground hover:bg-card/80 border border-white/5'
                    }
                  `}
                >
                  {room.name}
                  {activeRoom === room.name && (
                    <motion.span
                      layoutId="active-tab-indicator"
                      className="absolute inset-0 rounded-xl bg-primary/10"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                    />
                  )}
                </button>
              ))}
            </div>

            {/* Active Calendar Panel */}
            <AnimatePresence mode="wait">
              {Array.isArray(rooms) && rooms
                .filter(room => room.name === activeRoom)
                .map(room => (
                  <motion.div
                    key={room.name}
                    initial={{ opacity: 0, y: 16, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -16, scale: 0.98 }}
                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                  >
                    <WeeklyCalendar bookings={bookings || []} room={room.name} />
                  </motion.div>
                ))
              }
            </AnimatePresence>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Index;


