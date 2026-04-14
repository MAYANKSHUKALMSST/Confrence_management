import AppLayout from '@/components/AppLayout';
import StatusBadge from '@/components/StatusBadge';
import { useBookings } from '@/hooks/useBookings';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Check, X, Mail, Settings, Trash2, Send, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useEmailSettings } from '@/hooks/useEmailSettings';
import { useState, useEffect } from 'react';
import AnalyticsDashboard from '@/components/AnalyticsDashboard';
import RoomManagement from '@/components/RoomManagement';
import UserManagement from '@/components/UserManagement';
import { BarChart3, Building, Users } from 'lucide-react';

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
          <p className="text-muted-foreground text-sm mt-1">Manage bookings and system settings</p>
        </div>

        <Tabs defaultValue="bookings" className="space-y-6">
          <TabsList className="bg-card border w-full justify-start h-auto p-1 gap-1">
            <TabsTrigger value="bookings" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2 py-2">
              <Mail className="w-4 h-4" />
              Bookings
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2 py-2">
              <BarChart3 className="w-4 h-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="rooms" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2 py-2">
              <Building className="w-4 h-4" />
              Room Management
            </TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2 py-2">
              <Users className="w-4 h-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="email" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2 py-2">
              <Settings className="w-4 h-4" />
              Email Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="bookings" className="space-y-6">
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
                        <TableCell>
                          {(() => {
                            try {
                              const d = new Date(b.start_time);
                              return isNaN(d.getTime()) ? 'Invalid Date' : format(d, 'MMM d, yyyy');
                            } catch { return 'Invalid Date'; }
                          })()}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {(() => {
                            try {
                              const s = new Date(b.start_time);
                              const e = new Date(b.end_time);
                              if (isNaN(s.getTime()) || isNaN(e.getTime())) return 'Invalid Range';
                              return `${format(s, 'h:mm a')} – ${format(e, 'h:mm a')}`;
                            } catch { return 'Invalid Range'; }
                          })()}
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
                        <TableCell>
                          {(() => {
                            try {
                              const d = new Date(b.start_time);
                              return isNaN(d.getTime()) ? 'Invalid Date' : format(d, 'MMM d, yyyy');
                            } catch { return 'Invalid Date'; }
                          })()}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {(() => {
                            try {
                              const s = new Date(b.start_time);
                              const e = new Date(b.end_time);
                              if (isNaN(s.getTime()) || isNaN(e.getTime())) return 'Invalid Range';
                              return `${format(s, 'h:mm a')} – ${format(e, 'h:mm a')}`;
                            } catch { return 'Invalid Range'; }
                          })()}
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
        </TabsContent>

          <TabsContent value="email">
            <EmailSettingsForm />
          </TabsContent>

          <TabsContent value="analytics">
            <AnalyticsDashboard />
          </TabsContent>

          <TabsContent value="rooms">
            <RoomManagement />
          </TabsContent>

          <TabsContent value="users">
            <UserManagement />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

const EmailSettingsForm = () => {
  const { settings, isLoading, updateSettings, deleteSettings, testSettings } = useEmailSettings();
  const [formData, setFormData] = useState({
    smtp_host: '',
    smtp_port: 587,
    email: '',
    app_password: ''
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        smtp_host: settings.smtp_host,
        smtp_port: settings.smtp_port,
        email: settings.email,
        app_password: '' // Don't populate password
      });
    }
  }, [settings]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings.mutate(formData);
  };

  const handleTest = () => {
    testSettings.mutate(formData);
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete these settings?')) {
      deleteSettings.mutate();
    }
  };

  if (isLoading) return <div className="text-center py-8">Loading settings...</div>;

  return (
    <div className="bg-card rounded-xl border p-6 max-w-2xl">
      <h2 className="font-heading font-semibold text-lg mb-4 flex items-center gap-2">
        <Mail className="w-5 h-5" />
        SMTP Configuration
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="smtp_host">SMTP Host</Label>
            <Input
              id="smtp_host"
              placeholder="smtp.gmail.com"
              value={formData.smtp_host}
              onChange={(e) => setFormData({ ...formData, smtp_host: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="smtp_port">SMTP Port</Label>
            <Input
              id="smtp_port"
              type="number"
              placeholder="587"
              value={formData.smtp_port}
              onChange={(e) => setFormData({ ...formData, smtp_port: parseInt(e.target.value) })}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            placeholder="your-email@gmail.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="app_password">
            App Password
            {settings?.has_password && <span className="text-xs text-muted-foreground ml-2">(Already set. Leave blank to keep existing.)</span>}
          </Label>
          <Input
            id="app_password"
            type="password"
            placeholder="••••••••••••••••"
            value={formData.app_password}
            onChange={(e) => setFormData({ ...formData, app_password: e.target.value })}
            required={!settings?.has_password}
          />
        </div>

        <div className="flex items-center gap-3 pt-4">
          <Button 
            type="submit" 
            className="flex-1 gap-2"
            disabled={updateSettings.isPending}
          >
            {updateSettings.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Save Settings
          </Button>
          
          <Button 
            type="button" 
            variant="outline" 
            className="gap-2"
            onClick={handleTest}
            disabled={testSettings.isPending || !formData.smtp_host || !formData.email}
          >
            {testSettings.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Test Connection
          </Button>

          {settings && (
            <Button 
              type="button" 
              variant="destructive" 
              className="gap-2"
              onClick={handleDelete}
              disabled={deleteSettings.isPending}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </form>

      <div className="mt-6 p-4 bg-muted/30 rounded-lg border border-border/50">
        <h3 className="text-sm font-semibold mb-2">How to get an App Password?</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          For Gmail: Log in to your Google Account {'>'} Security {'>'} 2-Step Verification {'>'} App Passwords.
          Generate a password for "Mail" and "Other (Custom name)".
        </p>
      </div>
    </div>
  );
};

export default AdminPanel;
