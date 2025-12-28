'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import DataTable from '@/components/common/DataTable';
import StatusBadge from '@/components/common/StatusBadge';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { Eye, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function CustomerTable({ customers, onRefresh }) {
  const router = useRouter();
  const [deleteId, setDeleteId] = useState(null);

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/customers/${deleteId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete customer');

      toast.success('Customer deleted successfully');
      setDeleteId(null);
      onRefresh();
    } catch (error) {
      console.error('Error deleting customer:', error);
      toast.error('Failed to delete customer');
    }
  };

  const columns = [
    {
      id: 'customer_id',
      header: 'Customer ID',
      sortable: true,
    },
    {
      id: 'customer_name',
      header: 'Customer Name',
      sortable: true,
    },
    {
      id: 'contact_person',
      header: 'Contact Person',
      sortable: true,
    },
    {
      id: 'email_address',
      header: 'Email',
      sortable: true,
    },
    {
      id: 'industry_type',
      header: 'Industry',
      sortable: true,
    },
    {
      id: 'customer_status',
      header: 'Status',
      sortable: true,
      cell: (row) => <StatusBadge status={row.customer_status} />,
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/customers/${row.id}`)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDeleteId(row.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <DataTable
        columns={columns}
        data={customers}
        emptyMessage="No customers found"
      />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        title="Delete Customer"
        description="Are you sure you want to delete this customer? This action cannot be undone."
        onConfirm={handleDelete}
        variant="destructive"
        confirmText="Delete"
      />
    </>
  );
}