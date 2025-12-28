'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const statusColors = {
  // Customer statuses
  Active: 'bg-green-500',
  Inactive: 'bg-gray-500',
  Prospect: 'bg-blue-500',
  'Former Client': 'bg-orange-500',
  
  // Case statuses
  New: 'bg-blue-500',
  Open: 'bg-green-500',
  'In Progress': 'bg-yellow-500',
  Pending: 'bg-orange-500',
  Closed: 'bg-gray-500',
  Archived: 'bg-slate-500',
  
  // Priority
  Low: 'bg-gray-500',
  Medium: 'bg-blue-500',
  High: 'bg-orange-500',
  Critical: 'bg-red-500',
  
  // Invoice statuses
  Draft: 'bg-gray-500',
  Sent: 'bg-blue-500',
  Paid: 'bg-green-500',
  Overdue: 'bg-red-500',
  Cancelled: 'bg-slate-500',
  
  // Compliance statuses
  'Not Started': 'bg-gray-500',
  'In Review': 'bg-yellow-500',
  Completed: 'bg-green-500',
};

export default function StatusBadge({ status, className }) {
  const color = statusColors[status] || 'bg-gray-500';

  return (
    <Badge
      className={cn(
        color,
        'text-white',
        className
      )}
    >
      {status}
    </Badge>
  );
}