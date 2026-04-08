export type Department = 'Technical' | 'Pre-Sales' | 'Admin' | 'Accounts' | 'HR' | 'Marketing' | 'E-Commerce' | 'Product' | 'Legal' | 'Logistics';
export type BookingStatus = 'pending' | 'confirmed' | 'rejected';
export type RoomName = 'Liberty' | 'Unity' | 'Banyan';
export type AppRole = 'admin' | 'user';

export const DEPARTMENTS: Department[] = ['Technical', 'Pre-Sales', 'Admin', 'Accounts', 'HR', 'Marketing', 'E-Commerce', 'Product', 'Legal', 'Logistics'];
export const ROOMS: RoomName[] = ['Liberty', 'Unity', 'Banyan'];

export interface Profile {
  id: string;
  full_name: string;
  department: Department;
  created_at: string;
  updated_at: string;
}

export interface Booking {
  id: string;
  user_id: string;
  room: RoomName;
  title: string;
  department: Department;
  attendees: string;
  start_time: string;
  end_time: string;
  status: BookingStatus;
  created_at: string;
  updated_at: string;
  profiles?: { full_name: string } | null;
}
