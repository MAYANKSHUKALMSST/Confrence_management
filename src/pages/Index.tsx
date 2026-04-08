import AppLayout from '@/components/AppLayout';
import WeeklyCalendar from '@/components/WeeklyCalendar';
import BookingForm from '@/components/BookingForm';
import { useBookings } from '@/hooks/useBookings';
import { useAuth } from '@/hooks/useAuth';
import { ROOMS } from '@/lib/types';
import { format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const Index = () => {
  const { bookings, isLoading, updateBookingStatus } = useBookings();
  const { isAdmin } = useAuth();

  const pendingBookings = bookings.filter(b => b.status === 'pending');

  return (
    <AppLayout>
      <div className="animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-heading font-bold">Dashboard</h1>
            <p className="text-muted-foreground text-sm mt-1">View room availability and create bookings</p>
          </div>
          <BookingForm />
        </div>

        {isAdmin && pendingBookings.length > 0 && (
          <div className="mb-6">
            <h2 className="font-heading font-semibold text-lg mb-3">
              Pending Approvals ({pendingBookings.length})
            </h2>
            <div className="bg-card rounded-xl border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Room</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingBookings.map(b => (
                    <TableRow key={b.id}>
                      <TableCell>{b.room}</TableCell>
                      <TableCell>{b.title}</TableCell>
                      <TableCell>{b.department}</TableCell>
                      <TableCell>{format(new Date(b.start_time), 'MMM d, yyyy')}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(b.start_time), 'h:mm a')} – {format(new Date(b.end_time), 'h:mm a')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            className="gap-1 bg-success hover:bg-success/90 text-success-foreground"
                            onClick={() => updateBookingStatus.mutate({ id: b.id, status: 'confirmed' })}
                            disabled={updateBookingStatus.isPending}
                          >
                            <Check className="w-3.5 h-3.5" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="gap-1"
                            onClick={() => updateBookingStatus.mutate({ id: b.id, status: 'rejected' })}
                            disabled={updateBookingStatus.isPending}
                          >
                            <X className="w-3.5 h-3.5" />
                            Reject
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            {ROOMS.map(room => (
              <motion.div key={room} variants={itemVariants}>
                <WeeklyCalendar bookings={bookings} room={room} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </AppLayout>
  );
};

export default Index;
