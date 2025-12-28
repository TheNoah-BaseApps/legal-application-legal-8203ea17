'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import DataTable from '@/components/common/DataTable';
import StatusBadge from '@/components/common/StatusBadge';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { Eye, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function CaseTable({ cases, onRefresh }) {
  const router = useRouter();
  const [deleteId, setDeleteId] = useState(null);

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/cases/${deleteId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete case');

      toast.success('Case deleted successfully');
      setDeleteId(null);
      onRefresh();
    } catch (error) {
      console.error('Error deleting case:', error);
      toast.error('Failed to delete case');
    }
  };

  const columns = [
    {
      id: 'case_id',
      header: 'Case ID',
      sortable: true,
    },
    {
      id: 'case_title',
      header: 'Title',
      sortable: true,
    },
    {
      id: 'case_type',
      header: 'Type',
      sortable: true,
    },
    {
      id: 'case_status',
      header: 'Status',
      sortable: true,
      cell: (row) => <StatusBadge status={row.case_status} />,
    },
    {
      id: 'priority',
      header: 'Priority',
      sortable: true,
      cell: (row) => <StatusBadge status={row.priority} />,
    },
    {
      id: 'filing_date',
      header: 'Filing Date',
      sortable: true,
      cell: (row) => row.filing_date ? format(new Date(row.filing_date), 'PP') : 'N/A',
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/cases/${row.id}`)}
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
        data={cases}
        emptyMessage="No cases found"
      />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        title="Delete Case"
        description="Are you sure you want to delete this case? This action cannot be undone."
        onConfirm={handleDelete}
        variant="destructive"
        confirmText="Delete"
      />
    </>
  );
}