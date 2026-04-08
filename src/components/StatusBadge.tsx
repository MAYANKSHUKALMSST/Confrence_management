import { cn } from '@/lib/utils';
import type { BookingStatus } from '@/lib/types';

const statusConfig: Record<BookingStatus, { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'bg-pending/15 text-pending border-pending/30' },
  confirmed: { label: 'Confirmed', className: 'bg-success/15 text-success border-success/30' },
  rejected: { label: 'Rejected', className: 'bg-destructive/15 text-destructive border-destructive/30' },
};

const StatusBadge = ({ status }: { status: BookingStatus }) => {
  const config = statusConfig[status];
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border', config.className)}>
      {config.label}
    </span>
  );
};

export default StatusBadge;
