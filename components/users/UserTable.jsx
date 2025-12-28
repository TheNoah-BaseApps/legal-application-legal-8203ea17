'use client';

import DataTable from '@/components/common/DataTable';
import { Badge } from '@/components/ui/badge';

export default function UserTable({ users }) {
  const columns = [
    {
      id: 'name',
      header: 'Name',
      sortable: true,
    },
    {
      id: 'email',
      header: 'Email',
      sortable: true,
    },
    {
      id: 'phone',
      header: 'Phone',
      sortable: true,
    },
    {
      id: 'role',
      header: 'Role',
      sortable: true,
      cell: (row) => (
        <Badge variant="secondary" className="capitalize">
          {row.role.replace('_', ' ')}
        </Badge>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={users}
      emptyMessage="No users found"
    />
  );
}