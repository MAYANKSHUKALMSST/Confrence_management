export type Department = 'Technical' | 'Pre-Sales' | 'Admin' | 'Accounts' | 'HR' | 'Marketing' | 'E-Commerce' | 'Product' | 'Legal' | 'Logistics';
export type BookingStatus = 'pending' | 'confirmed' | 'rejected';
export type AppRole = 'admin' | 'user';

export const DEPARTMENTS: Department[] = ['Technical', 'Pre-Sales', 'Admin', 'Accounts', 'HR', 'Marketing', 'E-Commerce', 'Product', 'Legal', 'Logistics'];

export interface Room {
  id: string;
  name: string;
  capacity: number;
  equipment: string;
  image_url: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  full_name: string;
  department: Department;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Booking {
  id: string;
  user_id: string;
  room: string;
  title: string;
  department: Department;
  attendees: string;
  start_time: string;
  end_time: string;
  status: BookingStatus;
  recurrence_id?: string;
  recurrence_rule?: string;
  created_at: string;
  updated_at: string;
  profiles?: { full_name: string } | null;
}
