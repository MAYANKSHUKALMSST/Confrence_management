import { useMemo, useState } from 'react';
import { format, startOfWeek, addDays, isSameDay, addWeeks, subWeeks } from 'date-fns';
import type { Booking, RoomName } from '@/lib/types';
import StatusBadge from './StatusBadge';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const HOURS = Array.from({ length: 12 }, (_, i) => i + 8); // 8AM - 7PM

interface WeeklyCalendarProps {
  bookings: Booking[];
  room: string;
}

const WeeklyCalendar = ({ bookings, room }: WeeklyCalendarProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const days = Array.from({ length: 5 }, (_, i) => addDays(weekStart, i)); // Mon-Fri

  const roomBookings = useMemo(
    () => bookings.filter(b => b.room === room && b.status !== 'rejected'),
    [bookings, room]
  );

  return (
    <div className="bg-card rounded-xl border overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-heading font-semibold text-lg">{room}</h3>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => setCurrentDate(d => subWeeks(d, 1))}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm font-medium min-w-[160px] text-center">
            {format(days[0], 'MMM d')} — {format(days[4], 'MMM d, yyyy')}
          </span>
          <Button variant="ghost" size="icon" onClick={() => setCurrentDate(d => addWeeks(d, 1))}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="grid grid-cols-[60px_repeat(5,1fr)] min-w-[700px]">
          {/* Header row */}
          <div className="border-b border-r bg-muted/50 p-2" />
          {days.map(day => (
            <div
              key={day.toISOString()}
              className={cn(
                'border-b border-r p-2 text-center text-sm font-medium',
                isSameDay(day, new Date()) && 'bg-primary/5'
              )}
            >
              <div className="text-muted-foreground text-xs">{format(day, 'EEE')}</div>
              <div className={cn(
                'w-7 h-7 rounded-full flex items-center justify-center mx-auto mt-0.5',
                isSameDay(day, new Date()) && 'bg-primary text-primary-foreground'
              )}>
                {format(day, 'd')}
              </div>
            </div>
          ))}

          {/* Time rows */}
          {HOURS.map(hour => (
            <>
              <div key={`h-${hour}`} className="border-r border-b p-1 text-xs text-muted-foreground text-right pr-2 h-16 flex items-start justify-end">
                {format(new Date(2000, 0, 1, hour), 'h a')}
              </div>
              {days.map(day => {
                const cellBookings = roomBookings.filter(b => {
                  const bStart = new Date(b.start_time);
                  const bEnd = new Date(b.end_time);
                  const cellStart = new Date(day);
                  cellStart.setHours(hour, 0, 0, 0);
                  const cellEnd = new Date(day);
                  cellEnd.setHours(hour + 1, 0, 0, 0);
                  return isSameDay(bStart, day) && bStart < cellEnd && bEnd > cellStart;
                });

                return (
                  <div
                    key={`${day.toISOString()}-${hour}`}
                    className={cn(
                      'border-r border-b h-16 p-0.5 relative',
                      isSameDay(day, new Date()) && 'bg-primary/[0.02]'
                    )}
                  >
                    {cellBookings.map(b => (
                      <div
                        key={b.id}
                        className={cn(
                          'text-[10px] leading-tight px-1.5 py-0.5 rounded',
                          b.status === 'confirmed'
                            ? 'bg-success/15 text-success border border-success/20'
                            : 'bg-pending/15 text-pending border border-pending/20'
                        )}
                        title={`${b.title} — Booked by ${b.department} (${format(new Date(b.start_time), 'h:mm a')} - ${format(new Date(b.end_time), 'h:mm a')})`}
                      >
                        <div className="truncate font-medium">{b.title}</div>
                        <div className="truncate text-[9px] opacity-75">by {b.department}</div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WeeklyCalendar;
