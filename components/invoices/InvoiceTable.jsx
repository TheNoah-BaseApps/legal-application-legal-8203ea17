'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import DataTable from '@/components/common/DataTable';
import StatusBadge from '@/components/common/StatusBadge';
import { Eye } from 'lucide-react';
import { format } from 'date-fns';

export default function InvoiceTable({ invoices }) {
  const router = useRouter();

  const columns = [
    {
      id: 'invoice_number',
      header: 'Invoice #',
      sortable: true,
    },
    {
      id: 'customer_name',
      header: 'Customer',
      sortable: true,
    },
    {
      id: 'total_amount',
      header: 'Amount',
      sortable: true,
      cell: (row) => `$${parseFloat(row.total_amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
    },
    {
      id: 'status',
      header: 'Status',
      sortable: true,
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      id: 'issue_date',
      header: 'Issue Date',
      sortable: true,
      cell: (row) => row.issue_date ? format(new Date(row.issue_date), 'PP') : 'N/A',
    },
    {
      id: 'due_date',
      header: 'Due Date',
      sortable: true,
      cell: (row) => row.due_date ? format(new Date(row.due_date), 'PP') : 'N/A',
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/invoices/${row.id}`)}
          >
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={invoices}
      emptyMessage="No invoices found"
    />
  );
}