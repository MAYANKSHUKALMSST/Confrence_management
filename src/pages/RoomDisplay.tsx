import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '@/integrations/supabase/client';
import { format, isToday, isTomorrow, addDays, startOfDay, endOfDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { useRooms } from '@/hooks/useRooms';
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

  const selectedRoomData = useMemo(() => {
    if (!roomParam) return null;
    const today = getRoomBookings(roomParam, todayBookings);
    const tomorrow = getRoomBookings(roomParam, tomorrowBookings);
    const current = today.find(isActive);
    return { today, tomorrow, current };
  }, [roomParam, todayBookings, tomorrowBookings, now]);

  if (roomParam && selectedRoomData?.current) {
    const { today, tomorrow, current } = selectedRoomData;
    return (
      <div className="flex h-screen w-screen overflow-hidden">
        {/* Left Half: Schedule in Day Mode */}
        <div className="w-1/2 h-full bg-white text-slate-900 p-12 flex flex-col border-r border-slate-100">
          <div className="flex items-center justify-between mb-12">
            <div className="flex items-center gap-4">
              <button 
                onClick={currentFullscreenCb}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-sm transition-colors font-medium"
              >
                ← Back
              </button>
              <h1 className="text-5xl font-heading font-bold text-slate-900">{roomParam}</h1>
            </div>
            <div className="text-right">
              <div className="text-5xl font-heading font-bold tabular-nums text-slate-900">
                {format(now, 'h:mm a')}
              </div>
              <div className="text-slate-400 text-xl font-medium">{format(now, 'EEE, MMM d')}</div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-4">
            {/* Current Meeting Detail */}
            <div className="mb-12 p-8 rounded-3xl bg-blue-50 border border-blue-100">
              <div className="text-sm font-bold text-blue-600 uppercase tracking-[0.2em] mb-3">Ongoing Meeting</div>
              <h2 className="text-4xl font-heading font-bold mb-4 text-slate-900">{current.title}</h2>
              <div className="flex items-center gap-4 text-xl text-slate-600 mb-6 font-medium">
                <span className="font-semibold">{current.department}</span>
                <span>•</span>
                <span>{current.attendees} Attendees</span>
              </div>
              <div className="text-3xl font-mono font-bold text-blue-600">
                Ends at {format(new Date(current.end_time), 'h:mm a')}
              </div>
            </div>

            <h2 className="text-2xl font-heading font-semibold text-slate-400 uppercase tracking-widest mb-8">Schedule</h2>
            
            <div className="space-y-6">
              {today.filter(b => !isActive(b) && isUpcoming(b)).map(b => (
                <div key={b.id} className="flex items-center gap-6 p-6 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-2xl font-mono text-blue-500 font-bold min-w-[200px]">
                    {format(new Date(b.start_time), 'h:mm a')} – {format(new Date(b.end_time), 'h:mm a')}
                  </span>
                  <div className="flex-1">
                    <div className="text-2xl font-bold text-slate-800">{b.title}</div>
                    <div className="text-slate-400 text-lg font-medium">{b.department}</div>
                  </div>
                </div>
              ))}
              
              {tomorrow.length > 0 && (
                <div className="mt-12">
                  <h3 className="text-xl font-heading font-semibold text-slate-300 uppercase tracking-widest mb-6">Tomorrow</h3>
                  {tomorrow.slice(0, 3).map(b => (
                    <div key={b.id} className="flex items-center gap-6 p-4 rounded-xl bg-slate-50 mb-3">
                      <span className="text-lg font-mono text-slate-400 min-w-[180px]">
                        {format(new Date(b.start_time), 'h:mm a')} – {format(new Date(b.end_time), 'h:mm a')}
                      </span>
                      <span className="text-xl text-slate-600 font-medium">{b.title}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Half: Meeting in Progress in Light Red Background */}
        <div className="w-1/2 h-full flex flex-col items-center justify-center bg-[#ff4d4d] text-white p-12">
          <div className="text-8xl font-heading font-black uppercase tracking-wider text-center leading-[1.2]">
            Meeting <br /> In <br /> Progress
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <div className="flex items-center gap-4">
            {roomParam && (
              <button 
                onClick={currentFullscreenCb}
                className="px-4 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-xl text-sm transition-colors"
              >
                ← Back
              </button>
            )}
            <h1 className="text-4xl font-heading font-bold tracking-tight">
              {roomParam ? `${roomParam} — Schedule` : 'Conference Room Schedules'}
            </h1>
          </div>
          <p className="text-muted-foreground text-lg mt-2 font-medium">Internal Display System</p>
        </div>
        <div className="flex items-center gap-8 text-right">
          <div>
            <div className="text-5xl font-heading font-bold tabular-nums">
              {format(now, 'h:mm a')}
            </div>
            <div className="text-muted-foreground text-lg">{format(now, 'EEEE, MMMM d')}</div>
          </div>
        </div>
      </div>

      {/* Rooms Grid */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className={cn(
          'grid gap-8',
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
                'rounded-3xl border p-8 transition-all text-left w-full h-full shadow-md backdrop-blur-md',
                !roomParam && 'cursor-pointer hover:border-primary/30 hover:bg-muted/30 hover:-translate-y-1',
                currentMeeting
                  ? 'border-destructive/30 bg-destructive/5'
                  : 'border-border bg-card'
              )}
            >
              {/* Room header */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "p-3 rounded-2xl text-white", 
                    currentMeeting ? 'bg-destructive shadow-[0_0_20px_rgba(239,68,68,0.4)]' : 'bg-primary'
                  )}>
                    <MonitorPlay className="w-8 h-8" />
                  </div>
                  <h2 className="text-3xl font-heading font-bold">{room}</h2>
                </div>
                {currentMeeting ? (
                  <span className="px-5 py-2 rounded-full text-sm font-bold bg-destructive text-white animate-pulse shadow-lg">
                    IN USE
                  </span>
                ) : (
                  <span className="px-5 py-2 rounded-full text-sm font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                    AVAILABLE
                  </span>
                )}
              </div>

              {/* Current meeting highlight */}
              {currentMeeting && (
                <div className="mb-10 p-6 rounded-2xl bg-destructive/5 border border-destructive/20">
                  <div className="text-sm text-destructive font-bold uppercase tracking-widest mb-2">Ongoing</div>
                  <div className="font-bold text-2xl mb-1 text-slate-800">{currentMeeting.title}</div>
                  <div className="text-muted-foreground text-lg">
                    {format(new Date(currentMeeting.start_time), 'h:mm a')} – {format(new Date(currentMeeting.end_time), 'h:mm a')}
                  </div>
                </div>
              )}

              {/* Schedule preview */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-muted-foreground/60 uppercase tracking-widest flex items-center gap-2">
                  <CalendarCheck2 className="w-4 h-4" />
                  Schedule
                </h3>
                {today.length === 0 ? (
                  <div className="py-10 text-center border border-dashed border-muted rounded-2xl bg-muted/10">
                    <p className="text-muted-foreground/50 font-medium">No meetings today</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {today.slice(0, 5).map(b => (
                      <div
                        key={b.id}
                        className={cn(
                          'flex items-center gap-4 px-4 py-3 rounded-xl text-lg',
                          isActive(b) ? 'hidden' : isUpcoming(b) ? 'bg-muted/30 border border-muted' : 'opacity-40'
                        )}
                      >
                        <span className="text-primary font-mono font-bold text-sm min-w-[100px]">
                          {format(new Date(b.start_time), 'h:mm a')}
                        </span>
                        <span className="truncate font-medium">{b.title}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );

};

export default RoomDisplay;
