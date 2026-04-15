import AppLayout from '@/components/AppLayout';
import StatusBadge from '@/components/StatusBadge';
import BookingForm from '@/components/BookingForm';
import { useBookings } from '@/hooks/useBookings';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ClipboardList, Edit2, Trash2, MoreHorizontal, CalendarPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { downloadIcs } from '@/lib/calendar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { motion, AnimatePresence } from 'framer-motion';

const MyBookings = () => {
  const { bookings, isLoading, deleteBooking } = useBookings();
  const { user } = useAuth();
  const myBookings = bookings.filter(b => b.user_id === user?.id);

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this booking?')) {
      deleteBooking.mutate(id);
    }
  };

  return (
    <AppLayout>
      <div className="animate-fade-in">
        <div className="flex items-center justify-between mb-6 bg-background/20 backdrop-blur-sm p-4 rounded-xl border border-white/5">
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground">My Bookings</h1>
            <p className="text-foreground/80 text-sm mt-1 font-medium">Track your booking requests</p>
          </div>
          <BookingForm />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : myBookings.length === 0 ? (
          <div className="text-center py-20 bg-card rounded-xl border">
            <ClipboardList className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No bookings yet. Create your first booking!</p>
          </div>
        ) : (
          <div className="bg-card rounded-xl border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Room</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence>
                  {myBookings.map(b => (
                    <motion.tr 
                      key={b.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                    >
                      <TableCell className="font-medium p-4 align-middle">{b.room}</TableCell>
                      <TableCell className="p-4 align-middle">{b.title}</TableCell>
                      <TableCell className="p-4 align-middle">{format(new Date(b.start_time), 'MMM d, yyyy')}</TableCell>
                      <TableCell className="text-muted-foreground p-4 align-middle">
                        {format(new Date(b.start_time), 'h:mm a')} – {format(new Date(b.end_time), 'h:mm a')}
                      </TableCell>
                      <TableCell className="p-4 align-middle"><StatusBadge status={b.status} /></TableCell>
                      <TableCell className="p-4 align-middle text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <BookingForm 
                              mode="edit" 
                              initialData={b} 
                              trigger={
                                <button className="w-full relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground">
                                  <Edit2 className="mr-2 h-4 w-4" />
                                  Edit
                                </button>
                              }
                            />
                            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleDelete(b.id)}>
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                            {b.status === 'confirmed' && (
                              <DropdownMenuItem onClick={() => downloadIcs(b)}>
                                <CalendarPlus className="mr-2 h-4 w-4" />
                                Add to Calendar
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default MyBookings;
