
-- Add new department values
ALTER TYPE public.department ADD VALUE IF NOT EXISTS 'Marketing';
ALTER TYPE public.department ADD VALUE IF NOT EXISTS 'E-Commerce';
ALTER TYPE public.department ADD VALUE IF NOT EXISTS 'Product';
ALTER TYPE public.department ADD VALUE IF NOT EXISTS 'Legal';
ALTER TYPE public.department ADD VALUE IF NOT EXISTS 'Logistics';

-- Add new room values
ALTER TYPE public.room_name ADD VALUE IF NOT EXISTS 'Apollo';
ALTER TYPE public.room_name ADD VALUE IF NOT EXISTS 'Chandrayaan';
ALTER TYPE public.room_name ADD VALUE IF NOT EXISTS 'Banyan';

-- Add attendees column to bookings
ALTER TABLE public.bookings ADD COLUMN attendees text NOT NULL DEFAULT '';
