'use client';

import DataTable from '@/components/common/DataTable';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

export default function AuditLogTable({ logs }) {
  const columns = [
    {
      id: 'created_at',
      header: 'Timestamp',
      sortable: true,
      cell: (row) => row.created_at ? format(new Date(row.created_at), 'PPp') : 'N/A',
    },
    {
      id: 'user_name',
      header: 'User',
      sortable: true,
    },
    {
      id: 'action',
      header: 'Action',
      sortable: true,
      cell: (row) => <Badge variant="outline">{row.action}</Badge>,
    },
    {
      id: 'entity_type',
      header: 'Entity Type',
      sortable: true,
      cell: (row) => <span className="capitalize">{row.entity_type}</span>,
    },
    {
      id: 'ip_address',
      header: 'IP Address',
      sortable: true,
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={logs}
      emptyMessage="No audit logs found"
    />
  );
}