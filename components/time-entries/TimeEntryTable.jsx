'use client';

import DataTable from '@/components/common/DataTable';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

export default function TimeEntryTable({ entries }) {
  const columns = [
    {
      id: 'case_title',
      header: 'Case',
      sortable: true,
    },
    {
      id: 'date',
      header: 'Date',
      sortable: true,
      cell: (row) => row.date ? format(new Date(row.date), 'PP') : 'N/A',
    },
    {
      id: 'activity_description',
      header: 'Activity',
      sortable: false,
    },
    {
      id: 'hours',
      header: 'Hours',
      sortable: true,
      cell: (row) => parseFloat(row.hours || 0).toFixed(2),
    },
    {
      id: 'rate',
      header: 'Rate',
      sortable: true,
      cell: (row) => row.rate ? `$${parseFloat(row.rate).toFixed(2)}` : 'N/A',
    },
    {
      id: 'billable',
      header: 'Billable',
      sortable: true,
      cell: (row) => (
        <Badge variant={row.billable ? 'default' : 'secondary'}>
          {row.billable ? 'Yes' : 'No'}
        </Badge>
      ),
    },
    {
      id: 'total',
      header: 'Total',
      sortable: true,
      cell: (row) => {
        const total = (parseFloat(row.hours || 0) * parseFloat(row.rate || 0)).toFixed(2);
        return row.rate ? `$${total}` : 'N/A';
      },
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={entries}
      emptyMessage="No time entries found"
    />
  );
}