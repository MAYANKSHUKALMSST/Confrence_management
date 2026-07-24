import { useState, KeyboardEvent, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DEPARTMENTS, type Department, type Booking } from '@/lib/types';
import { useBookings } from '@/hooks/useBookings';
import { useRooms } from '@/hooks/useRooms';
import { useAuth } from '@/hooks/useAuth';
import { Plus, Edit2, RotateCw, X, Mail } from 'lucide-react';
import { toast } from 'sonner';

interface BookingFormProps {
  mode?: 'create' | 'edit';
  initialData?: Partial<Booking>;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

const BookingForm = ({ mode = 'create', initialData, trigger, open, onOpenChange }: BookingFormProps) => {
  const { createBooking, updateBooking, bookings } = useBookings();
  const { profile } = useAuth();
  const [internalOpen, setInternalOpen] = useState(false);

  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;
  const setIsOpen = isControlled ? onOpenChange : setInternalOpen;

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
  const initStart = initialData?.start_time ? new Date(initialData.start_time).toTimeString().substring(0, 5) : '';
  const initEnd = initialData?.end_time ? new Date(initialData.end_time).toTimeString().substring(0, 5) : '';

  const { rooms = [] } = useRooms() || {};
  const [room, setRoom] = useState(initialData?.room ?? 'Liberty');
  const [title, setTitle] = useState(initialData?.title ?? '');
  const [department, setDepartment] = useState<Department>((initialData?.department ?? profile?.department ?? 'Technical') as Department);
  const [date, setDate] = useState(initDate || '');
  const [startTime, setStartTime] = useState(initStart || '');
  const [endTime, setEndTime] = useState(initEnd || '');
  const [attendees, setAttendees] = useState(initialData?.attendees ?? '');
  const [meetingLink, setMeetingLink] = useState(initialData?.meeting_link ?? '');
  const [notes, setNotes] = useState(initialData?.notes ?? '');
  const [recurrence, setRecurrence] = useState<'none' | 'daily' | 'weekly' | 'biweekly' | 'monthly'>('none');

  // Attendee emails tag state
  const [attendeeEmails, setAttendeeEmails] = useState<string[]>(
    initialData?.attendee_emails ? (initialData.attendee_emails as string).split(',').filter(Boolean) : []
  );
  const [emailInput, setEmailInput] = useState('');

  useEffect(() => {
    if (isOpen) {
      const fullISO = safeToISO(initialData?.start_time);
      const initDate = fullISO ? fullISO.split('T')[0] : '';
      const initStart = initialData?.start_time ? new Date(initialData.start_time).toTimeString().substring(0, 5) : '';
      const initEnd = initialData?.end_time ? new Date(initialData.end_time).toTimeString().substring(0, 5) : '';

      setRoom(initialData?.room ?? 'Liberty');
      setTitle(initialData?.title ?? '');
      setDepartment((initialData?.department ?? profile?.department ?? 'Technical') as Department);
      setDate(initDate || '');
      setStartTime(initStart || '');
      setEndTime(initEnd || '');
      setAttendees(initialData?.attendees ?? '');
      setMeetingLink(initialData?.meeting_link ?? '');
      setNotes(initialData?.notes ?? '');
      setRecurrence('none');
      setAttendeeEmails(initialData?.attendee_emails ? (initialData.attendee_emails as string).split(',').filter(Boolean) : []);
      setEmailInput('');
    }
  }, [isOpen, initialData, profile]);

  if (!rooms) return null;

  const addEmail = () => {
    const email = emailInput.trim();
    if (!email) return;
    if (!isValidEmail(email)) {
      toast.error('Please enter a valid email address');
      return;
    }
    if (attendeeEmails.includes(email)) {
      toast.error('This email is already added');
      return;
    }
    setAttendeeEmails(prev => [...prev, email]);
    setEmailInput('');
  };

  const removeEmail = (email: string) => {
    setAttendeeEmails(prev => prev.filter(e => e !== email));
  };

  const handleEmailKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addEmail();
    }
    if (e.key === 'Backspace' && !emailInput && attendeeEmails.length > 0) {
      setAttendeeEmails(prev => prev.slice(0, -1));
    }
  };

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
      attendee_emails: attendeeEmails.join(','),
      meeting_link: meetingLink,
      notes,
      start_time: startDt.toISOString(),
      end_time: endDt.toISOString(),
      recurrence
    };

    if (mode === 'edit' && initialData) {
      updateBooking.mutate(
        { id: initialData.id, booking: payload },
        {
          onSuccess: () => {
            setIsOpen(false);
          },
        }
      );
    } else {
      createBooking.mutate(payload, {
        onSuccess: () => {
          setIsOpen(false);
          setTitle('');
          setDate('');
          setStartTime('');
          setEndTime('');
          setAttendees('');
          setAttendeeEmails([]);
          setMeetingLink('');
          setNotes('');
          setEmailInput('');
        },
      });
    }
  };

  const today = new Date().toISOString().split('T')[0];

  const dialogContent = (
    <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
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

        {/* Attendee Email Tags */}
        <div>
          <Label className="flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5" />
            Attendee Emails
            <span className="text-xs text-muted-foreground font-normal">(optional — press Enter or comma to add)</span>
          </Label>
          <div className="mt-1.5 min-h-[42px] flex flex-wrap gap-1.5 items-center border rounded-md px-3 py-2 bg-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-0">
            {attendeeEmails.map(email => (
              <span
                key={email}
                className="flex items-center gap-1 bg-primary/15 text-primary text-xs px-2 py-1 rounded-full font-medium"
              >
                {email}
                <button
                  type="button"
                  onClick={() => removeEmail(email)}
                  className="hover:text-destructive transition-colors ml-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            <input
              type="text"
              value={emailInput}
              onChange={e => setEmailInput(e.target.value)}
              onKeyDown={handleEmailKeyDown}
              onBlur={addEmail}
              placeholder={attendeeEmails.length === 0 ? "attendee@company.com" : ""}
              className="flex-1 min-w-[160px] bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          {attendeeEmails.length > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              📧 Meeting details will be sent to {attendeeEmails.length} email{attendeeEmails.length > 1 ? 's' : ''} when confirmed.
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Meeting Link</Label>
            <Input
              value={meetingLink}
              onChange={e => setMeetingLink(e.target.value)}
              placeholder="Zoom, Google Meet, etc."
              type="url"
            />
          </div>
          <div>
            <Label>Notes / Comments</Label>
            <Input
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Any special instructions..."
            />
          </div>
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
  );

  if (isControlled && !trigger) {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        {dialogContent}
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gap-2 bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-bold px-5 py-3 text-sm md:text-base transition-colors shadow-md">
            <Plus className="w-5 h-5 stroke-[3]" />
            New Booking
          </Button>
        )}
      </DialogTrigger>
      {dialogContent}
    </Dialog>
  );
};

export default BookingForm;
