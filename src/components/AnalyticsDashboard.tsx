import React from 'react';
import { useAnalytics } from '@/hooks/useAnalytics';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, AreaChart, Area, Legend
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Users, Calendar, DoorOpen, Clock, Award, Briefcase, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', '#00C49F', '#FFBB28'];

const AnalyticsDashboard = () => {
  const { data, isLoading } = useAnalytics();

  const handleExportExcel = () => {
    if (!data) return;

    // Create workbook
    const wb = XLSX.utils.book_new();

    // 1. Overview Sheet
    const overviewData = [
      { Metric: 'Total Bookings', Value: data.stats?.totalBookings || 0 },
      { Metric: 'Total Rooms', Value: data.stats?.totalRooms || 0 },
      { Metric: 'Active Users', Value: data.stats?.totalUsers || 0 },
      { 
        Metric: 'Average Meeting Duration', 
        Value: data.stats?.avgDurationMinutes 
          ? (data.stats.avgDurationMinutes >= 60 
              ? `${Math.floor(data.stats.avgDurationMinutes / 60)}h ${data.stats.avgDurationMinutes % 60}m` 
              : `${data.stats.avgDurationMinutes} mins`)
          : '0 mins'
      },
      { Metric: 'Most Popular Room', Value: data.stats?.popularRoom || 'N/A' },
      { Metric: 'Most Active Department', Value: data.stats?.activeDept || 'N/A' },
    ];
    const wsOverview = XLSX.utils.json_to_sheet(overviewData);
    XLSX.utils.book_append_sheet(wb, wsOverview, 'Overview');

    // 2. Bookings Log Sheet
    const bookingsLog = (data.bookings || []).map(b => {
      let formattedDate = '';
      let formattedStartTime = '';
      let formattedEndTime = '';
      try {
        if (b.start_time) {
          const s = new Date(b.start_time);
          formattedDate = s.toLocaleDateString();
          formattedStartTime = s.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        if (b.end_time) {
          const e = new Date(b.end_time);
          formattedEndTime = e.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
      } catch (err) {
        console.error('Date parsing error during excel export:', err);
      }

      return {
        'Booking ID': b.id,
        'Room': b.room,
        'Title': b.title,
        'Department': b.department,
        'Attendees': b.attendees || '',
        'Requester Name': b.profile_full_name || 'N/A',
        'Requester Email': b.profile_email || 'N/A',
        'Date': formattedDate,
        'Start Time': formattedStartTime,
        'End Time': formattedEndTime,
      };
    });
    const wsBookings = XLSX.utils.json_to_sheet(bookingsLog);
    XLSX.utils.book_append_sheet(wb, wsBookings, 'Bookings Log');

    // 3. Room Occupancy Sheet
    const roomOccupancyData = (data.roomOccupancy || []).map(r => ({
      'Room Name': r.name,
      'Total Bookings': r.value
    }));
    const wsRooms = XLSX.utils.json_to_sheet(roomOccupancyData);
    XLSX.utils.book_append_sheet(wb, wsRooms, 'Room Popularity');

    // 4. Department Activity Sheet
    const deptActivityData = (data.deptActivity || []).map(d => ({
      'Department': d.name,
      'Total Bookings': d.value
    }));
    const wsDepts = XLSX.utils.json_to_sheet(deptActivityData);
    XLSX.utils.book_append_sheet(wb, wsDepts, 'Department Activity');

    // Write file
    XLSX.writeFile(wb, `availa-room-analytics-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card/40 backdrop-blur-md p-4 rounded-xl border border-white/5 shadow-md">
        <div>
          <h2 className="text-xl font-bold font-heading text-foreground">Analytics Dashboard</h2>
          <p className="text-xs text-foreground/70 font-medium">Real-time room occupancy and system metrics</p>
        </div>
        <Button onClick={handleExportExcel} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold self-start sm:self-auto">
          <FileSpreadsheet className="w-4 h-4" />
          Export to Excel
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card className="bg-card/50 backdrop-blur-md border border-white/10 shadow-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold flex items-center gap-2 text-foreground/80">
              <Calendar className="w-4 h-4 text-primary" />
              Total Bookings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{data.stats?.totalBookings || 0}</div>
            <p className="text-[10px] text-foreground/60 mt-1 font-medium">Confirmed meetings</p>
          </CardContent>
        </Card>
        
        <Card className="bg-card/50 backdrop-blur-md border border-white/10 shadow-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold flex items-center gap-2 text-foreground/80">
              <DoorOpen className="w-4 h-4 text-primary" />
              Rooms
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{data.stats?.totalRooms || 0}</div>
            <p className="text-[10px] text-foreground/60 mt-1 font-medium">Active rooms in system</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-md border border-white/10 shadow-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold flex items-center gap-2 text-foreground/80">
              <Users className="w-4 h-4 text-primary" />
              Active Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{data.stats?.totalUsers || 0}</div>
            <p className="text-[10px] text-foreground/60 mt-1 font-medium">Registered users</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-md border border-white/10 shadow-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold flex items-center gap-2 text-foreground/80">
              <Clock className="w-4 h-4 text-primary" />
              Avg Duration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {data.stats?.avgDurationMinutes >= 60 
                ? `${Math.floor(data.stats.avgDurationMinutes / 60)}h ${data.stats.avgDurationMinutes % 60}m`
                : `${data.stats?.avgDurationMinutes || 0}m`
              }
            </div>
            <p className="text-[10px] text-foreground/60 mt-1 font-medium">Per meeting booking</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-md border border-white/10 shadow-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold flex items-center gap-2 text-foreground/80">
              <Award className="w-4 h-4 text-primary" />
              Popular Room
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground truncate" title={data.stats?.popularRoom || 'N/A'}>
              {data.stats?.popularRoom || 'N/A'}
            </div>
            <p className="text-[10px] text-foreground/60 mt-1 font-medium">Most booked space</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-md border border-white/10 shadow-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold flex items-center gap-2 text-foreground/80">
              <Briefcase className="w-4 h-4 text-primary" />
              Active Dept
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground truncate" title={data.stats?.activeDept || 'N/A'}>
              {data.stats?.activeDept || 'N/A'}
            </div>
            <p className="text-[10px] text-foreground/60 mt-1 font-medium">Most active team</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Peak Hours Heatmap */}
        <Card className="bg-card/50 backdrop-blur-md border border-white/10 shadow-xl">
          <CardHeader>
            <CardTitle>Peak Hours</CardTitle>
            <CardDescription>Most active times for meetings (Business Hours)</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.peakHours}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis 
                  dataKey="hour" 
                  tickFormatter={(h) => `${h > 12 ? h - 12 : h}${h >= 12 ? 'pm' : 'am'}`}
                  stroke="currentColor" 
                  className="text-foreground/40 font-bold"
                  fontSize={10}
                />
                <YAxis stroke="currentColor" className="text-foreground/40 font-bold" fontSize={10} allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(23, 23, 23, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  labelFormatter={(h) => `${h}:00`}
                />
                <Area type="monotone" dataKey="count" stroke="#8884d8" fillOpacity={1} fill="url(#colorCount)" name="Active Meetings" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Room Occupancy */}
        <Card className="bg-card/50 backdrop-blur-md border border-white/10 shadow-xl">
          <CardHeader>
            <CardTitle>Room Popularity</CardTitle>
            <CardDescription>Share of total bookings by room</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] flex flex-col items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.roomOccupancy}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, value }) => value > 0 ? `${name}: ${value}` : ''}
                >
                  {data.roomOccupancy.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                   contentStyle={{ backgroundColor: 'rgba(23, 23, 23, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                />
                <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Monthly Trend */}
        <Card className="bg-card/50 backdrop-blur-md border border-white/10 shadow-xl lg:col-span-2">
          <CardHeader>
            <CardTitle>Monthly Booking Trend</CardTitle>
            <CardDescription>Daily booking volume for the current month</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.monthlyTrend}>
                <defs>
                  <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00c49f" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#00c49f" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis 
                  dataKey="date" 
                  stroke="currentColor" 
                  className="text-foreground/40 font-bold"
                  fontSize={10}
                />
                <YAxis stroke="currentColor" className="text-foreground/40 font-bold" fontSize={10} allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(23, 23, 23, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                />
                <Area type="monotone" dataKey="count" stroke="#00c49f" fillOpacity={1} fill="url(#colorTrend)" name="Bookings" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Department Activity */}
        <Card className="bg-card/50 backdrop-blur-md border border-white/10 shadow-xl lg:col-span-2">
          <CardHeader>
            <CardTitle>Departmental Activity</CardTitle>
            <CardDescription>Number of confirmed meetings by department</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.deptActivity}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" stroke="currentColor" className="text-foreground/40 font-bold" fontSize={10} />
                <YAxis stroke="currentColor" className="text-foreground/40 font-bold" fontSize={10} allowDecimals={false} />
                <Tooltip 
                   contentStyle={{ backgroundColor: 'rgba(23, 23, 23, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                />
                <Bar dataKey="value" fill="#82ca9d" radius={[4, 4, 0, 0]} name="Meetings" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
