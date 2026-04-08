import AppLayout from '@/components/AppLayout';
import StatusBadge from '@/components/StatusBadge';
import { useBookings } from '@/hooks/useBookings';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';

const AdminPanel = () => {
  const { isAdmin } = useAuth();
  const { bookings, isLoading, updateBookingStatus } = useBookings();

  if (!isAdmin) return <Navigate to="/" replace />;

  const pendingBookings = bookings.filter(b => b.status === 'pending');
  const otherBookings = bookings.filter(b => b.status !== 'pending');

  return (
    <AppLayout>
      <div className="animate-fade-in">
        <div className="mb-6">
          <h1 className="text-2xl font-heading font-bold">Admin Panel</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage booking requests</p>
        </div>

        <div className="space-y-6">
          {/* Pending Requests */}
          <div>
            <h2 className="font-heading font-semibold text-lg mb-3">
              Pending Requests ({pendingBookings.length})
            </h2>
            {pendingBookings.length === 0 ? (
              <div className="bg-card rounded-xl border p-8 text-center text-muted-foreground">
                No pending requests
              </div>
            ) : (
              <div className="bg-card rounded-xl border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Requester</TableHead>
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
                        <TableCell className="font-medium">{b.profiles?.full_name || '—'}</TableCell>
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
            )}
          </div>

          {/* All Bookings */}
          <div>
            <h2 className="font-heading font-semibold text-lg mb-3">All Bookings</h2>
            <div className="bg-card rounded-xl border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Requester</TableHead>
                    <TableHead>Room</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">Loading...</TableCell>
                    </TableRow>
                  ) : otherBookings.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No bookings</TableCell>
                    </TableRow>
                  ) : (
                    otherBookings.map(b => (
                      <TableRow key={b.id}>
                        <TableCell className="font-medium">{b.profiles?.full_name || '—'}</TableCell>
                        <TableCell>{b.room}</TableCell>
                        <TableCell>{b.title}</TableCell>
                        <TableCell>{b.department}</TableCell>
                        <TableCell>{format(new Date(b.start_time), 'MMM d, yyyy')}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(b.start_time), 'h:mm a')} – {format(new Date(b.end_time), 'h:mm a')}
                        </TableCell>
                        <TableCell><StatusBadge status={b.status} /></TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {b.status === 'rejected' ? (
                              <Button
                                size="sm"
                                variant="outline"
                                className="gap-1 text-success hover:text-success"
                                onClick={() => updateBookingStatus.mutate({ id: b.id, status: 'confirmed' })}
                                disabled={updateBookingStatus.isPending}
                              >
                                <Check className="w-3.5 h-3.5" />
                                Approve
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                className="gap-1 text-destructive hover:text-destructive"
                                onClick={() => updateBookingStatus.mutate({ id: b.id, status: 'rejected' })}
                                disabled={updateBookingStatus.isPending}
                              >
                                <X className="w-3.5 h-3.5" />
                                Reject
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default AdminPanel;
