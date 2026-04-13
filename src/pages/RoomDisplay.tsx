import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '@/integrations/supabase/client';
import { format, isToday, isTomorrow, addDays, startOfDay, endOfDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { useRooms } from '@/hooks/useRooms';
import { ThemeToggle } from '@/components/ThemeToggle';
import { motion } from 'framer-motion';
import { MonitorPlay, Users, CalendarCheck2 } from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: { opacity: 1, scale: 1, y: 0 }
};

const HOURS = Array.from({ length: 12 }, (_, i) => i + 8); // 8AM–7PM

const RoomDisplay = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const roomParam = searchParams.get('room') as RoomName | null;
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [now, setNow] = useState(new Date());
  const { rooms: dbRooms, isLoading: roomsLoading } = useRooms();

  // Tick every 15 seconds to keep "now" current
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 15_000);
    return () => clearInterval(timer);
  }, []);

  // Fetch confirmed bookings (public — no auth needed)
  useEffect(() => {
    const fetchBookings = async () => {
      const today = startOfDay(new Date());
      const end = endOfDay(addDays(today, 6));
      const { data } = await api.bookings.listConfirmed(today.toISOString(), end.toISOString());
      if (data) setBookings(data as Booking[]);
    };
    fetchBookings();
    const interval = setInterval(fetchBookings, 60_000); // refresh every minute
    return () => clearInterval(interval);
  }, []);

  const rooms = useMemo(() => {
    if (roomParam) return [roomParam];
    return dbRooms.map(r => r.name);
  }, [roomParam, dbRooms]);

  const todayBookings = useMemo(
    () => bookings.filter(b => isToday(new Date(b.start_time))),
    [bookings, now]
  );

  const tomorrowBookings = useMemo(
    () => bookings.filter(b => isTomorrow(new Date(b.start_time))),
    [bookings]
  );

  const isActive = (b: Booking) => {
    const start = new Date(b.start_time);
    const end = new Date(b.end_time);
    return now >= start && now <= end;
  };

  const isUpcoming = (b: Booking) => {
    const start = new Date(b.start_time);
    return start > now;
  };

  const getRoomBookings = (roomName: string, list: Booking[]) =>
    list.filter(b => b.room === roomName);

  const handleRoomClick = async (roomName: string) => {
    if (roomParam === roomName) return;
    setSearchParams({ room: roomName });
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }
    } catch (err) {
      console.error("Error attempting to enable full-screen mode:", err);
    }
  };

  const currentFullscreenCb = async () => {
    setSearchParams({});
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error("Error attempting to exit full-screen mode:", err);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      {/* Header */}
        <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            {roomParam && (
              <button 
                onClick={currentFullscreenCb}
                className="px-3 py-1.5 bg-foreground/10 hover:bg-foreground/20 rounded-lg text-sm transition-colors mr-2"
              >
                ← Back
              </button>
            )}
            <h1 className="text-3xl font-heading font-bold tracking-tight">
              {roomParam ? `${roomParam} — Schedule` : 'Conference Room Schedules'}
            </h1>
          </div>
          <p className="text-foreground/50 text-sm mt-1">Auto-refreshing display</p>
        </div>
        <div className="flex items-center gap-4 text-right">
          <ThemeToggle />
          <div>
            <div className="text-4xl font-heading font-bold tabular-nums">
              {format(now, 'h:mm a')}
            </div>
            <div className="text-foreground/50 text-sm">{format(now, 'EEEE, MMMM d, yyyy')}</div>
          </div>
        </div>
      </div>

      {/* Rooms */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className={cn(
          'grid gap-5',
          rooms.length === 1 ? 'grid-cols-1' : rooms.length <= 3 ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'
        )}
      >
        {rooms.map(room => {
          const today = getRoomBookings(room, todayBookings);
          const tomorrow = getRoomBookings(room, tomorrowBookings);
          const currentMeeting = today.find(isActive);

          return (
            <motion.div
              variants={itemVariants}
              key={room}
              onClick={() => handleRoomClick(room)}
              className={cn(
                'rounded-2xl border p-5 transition-all text-left w-full h-fit shadow-sm',
                !roomParam && 'cursor-pointer hover:border-foreground/30 hover:shadow-lg hover:-translate-y-1',
                currentMeeting
                  ? 'border-destructive/60 bg-destructive/5'
                  : 'border-foreground/10 bg-foreground/5'
              )}
              role={!roomParam ? "button" : undefined}
              tabIndex={!roomParam ? 0 : undefined}
            >
              {/* Room header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-2.5 rounded-xl text-white", 
                    currentMeeting ? 'bg-destructive shadow-[0_0_15px_rgba(239,68,68,0.5)] animate-pulse' : 'bg-primary'
                  )}>
                    <MonitorPlay className="w-6 h-6" />
                  </div>
                  <h2 className="text-2xl font-heading font-bold">{room}</h2>
                </div>
                {currentMeeting ? (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-destructive text-white animate-pulse shadow-sm">
                    IN USE
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                    AVAILABLE
                  </span>
                )}
              </div>

              {/* Current meeting highlight */}
              {currentMeeting && (
                <div className="mb-4 p-3 rounded-xl bg-destructive/20 border border-destructive/30">
                  <div className="text-xs text-destructive font-semibold uppercase tracking-wider mb-1">Now</div>
                  <div className="font-semibold text-lg">{currentMeeting.title}</div>
                  <div className="text-foreground/80 text-sm">
                    {format(new Date(currentMeeting.start_time), 'h:mm a')} – {format(new Date(currentMeeting.end_time), 'h:mm a')}
                  </div>
                  <div className="text-foreground/60 text-xs mt-1">{currentMeeting.department} · {currentMeeting.attendees}</div>
                </div>
              )}

              {/* Today's schedule */}
              <div className="mb-3 mt-6">
                <div className="flex items-center gap-2 mb-3">
                  <CalendarCheck2 className="w-4 h-4 text-foreground/50" />
                  <h3 className="text-xs font-semibold text-foreground/50 uppercase tracking-wider">Today's Schedule</h3>
                </div>
                {today.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-6 border border-dashed rounded-xl border-foreground/10 bg-foreground/5">
                    <Users className="w-8 h-8 text-foreground/20 mb-2" />
                    <p className="text-foreground/40 text-sm font-medium">No schedule for today</p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {today.filter(b => !isActive(b)).map(b => (
                      <div
                        key={b.id}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2 rounded-lg text-sm',
                          isUpcoming(b) ? 'bg-foreground/5' : 'bg-foreground/[0.02] text-foreground/60'
                        )}
                      >
                        <span className="text-foreground/70 font-mono text-xs min-w-[100px]">
                          {format(new Date(b.start_time), 'h:mm a')} – {format(new Date(b.end_time), 'h:mm a')}
                        </span>
                        <span className="truncate font-medium">{b.title}</span>
                        <span className="text-foreground/50 text-xs ml-auto">{b.department}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Tomorrow preview */}
              {tomorrow.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-foreground/50 uppercase tracking-wider mb-2">Tomorrow</h3>
                  <div className="space-y-1.5">
                    {tomorrow.slice(0, 3).map(b => (
                      <div key={b.id} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm bg-foreground/[0.02] text-foreground/60">
                        <span className="font-mono text-xs min-w-[100px]">
                          {format(new Date(b.start_time), 'h:mm a')} – {format(new Date(b.end_time), 'h:mm a')}
                        </span>
                        <span className="truncate">{b.title}</span>
                      </div>
                    ))}
                    {tomorrow.length > 3 && (
                      <p className="text-foreground/50 text-xs pl-3">+{tomorrow.length - 3} more</p>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}
        </motion.div>
    </div>
  );
};

export default RoomDisplay;
