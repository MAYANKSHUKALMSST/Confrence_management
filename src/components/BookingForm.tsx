import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DEPARTMENTS, type Department, type Booking } from '@/lib/types';
import { useBookings } from '@/hooks/useBookings';
import { useRooms } from '@/hooks/useRooms';
import { useAuth } from '@/hooks/useAuth';
import { Plus, Edit2, RotateCw } from 'lucide-react';
import { toast } from 'sonner';

interface BookingFormProps {
  mode?: 'create' | 'edit';
  initialData?: Booking;
  trigger?: React.ReactNode;
}

const BookingForm = ({ mode = 'create', initialData, trigger }: BookingFormProps) => {
  const { createBooking, updateBooking, bookings } = useBookings();
  const { profile } = useAuth();
  const [open, setOpen] = useState(false);
  
  // Format initial date/times if editing
  const safeToISO = (dateStr: string | undefined) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return isNaN(d.getTime()) ? '' : d.toISOString();
    } catch {
      return '';
    }
  };

  const fullISO = safeToISO(initialData?.start_time);
  const initDate = fullISO ? fullISO.split('T')[0] : '';
  const initStart = initialData?.start_time ? new Date(initialData.start_time).toTimeString().substring(0,5) : '';
  const initEnd = initialData?.end_time ? new Date(initialData.end_time).toTimeString().substring(0,5) : '';

  const { rooms = [] } = useRooms() || {};
  const [room, setRoom] = useState(initialData?.room ?? 'Liberty');
  const [title, setTitle] = useState(initialData?.title ?? '');
  const [department, setDepartment] = useState<Department>((initialData?.department ?? profile?.department ?? 'Technical') as Department);
  const [date, setDate] = useState(initDate || '');
  const [startTime, setStartTime] = useState(initStart || '');
  const [endTime, setEndTime] = useState(initEnd || '');
  const [attendees, setAttendees] = useState(initialData?.attendees ?? '');
  const [recurrence, setRecurrence] = useState<'none' | 'daily' | 'weekly' | 'biweekly' | 'monthly'>('none');

  if (!rooms) return null; // Safe guard

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (startTime >= endTime) {
      toast.error('End time must be after start time');
      return;
    }

    const startDt = new Date(`${date}T${startTime}`);
    const endDt = new Date(`${date}T${endTime}`);

    if (startDt < new Date()) {
      toast.error('Cannot book in the past');
      return;
    }

    // Check for conflicts
    const conflict = (bookings || []).some(b =>
      b.room === room &&
      b.id !== initialData?.id &&
      b.status !== 'rejected' &&
      new Date(b.start_time) < endDt &&
      new Date(b.end_time) > startDt
    );

    if (conflict) {
      toast.error('This room has a conflicting booking for that time slot');
      return;
    }

    const payload = {
      room,
      title,
      department,
      attendees,
      start_time: startDt.toISOString(),
      end_time: endDt.toISOString(),
      recurrence
    };

    if (mode === 'edit' && initialData) {
      updateBooking.mutate(
        { id: initialData.id, booking: payload },
        {
          onSuccess: () => {
            setOpen(false);
          },
        }
      );
    } else {
      createBooking.mutate(payload, {
        onSuccess: () => {
          setOpen(false);
          setTitle('');
          setDate('');
          setStartTime('');
          setEndTime('');
          setAttendees('');
        },
      });
    }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            New Booking
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading">Request a Booking</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <Label>Room <span className="text-red-500">*</span></Label>
            <Select value={room} onValueChange={v => setRoom(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(rooms || []).map(r => <SelectItem key={r.id} value={r.name}>{r.name} (Cap: {r.capacity})</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Meeting Title <span className="text-red-500">*</span></Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} required maxLength={100} placeholder="e.g., Sprint Planning" />
          </div>
          <div>
            <Label>Department <span className="text-red-500">*</span></Label>
            <Select value={department} onValueChange={v => setDepartment(v as Department)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Attendees <span className="text-red-500">*</span></Label>
            <Input value={attendees} onChange={e => setAttendees(e.target.value)} required placeholder="e.g., John, Sarah, Mike" />
          </div>
          <div>
            <Label>Date <span className="text-red-500">*</span></Label>
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} min={today} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Start Time <span className="text-red-500">*</span></Label>
              <Input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} required />
            </div>
            <div>
              <Label>End Time <span className="text-red-500">*</span></Label>
              <Input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} required />
            </div>
          </div>

          {!initialData && (
            <div className="bg-muted/30 p-3 rounded-lg border space-y-2">
              <Label className="flex items-center gap-2">
                <RotateCw className="w-3.5 h-3.5" />
                Repeat Meeting
              </Label>
              <Select value={recurrence} onValueChange={(v: any) => setRecurrence(v)}>
                <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Does not repeat</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="biweekly">Every 2 weeks</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          <Button type="submit" className="w-full" disabled={createBooking.isPending || updateBooking.isPending}>
            {createBooking.isPending || updateBooking.isPending ? 'Submitting...' : mode === 'edit' ? 'Save Changes' : 'Submit Request'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default BookingForm;
