'use client';

import { Button } from '@/components/ui/button';
import DataTable from '@/components/common/DataTable';
import StatusBadge from '@/components/common/StatusBadge';
import { CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function ComplianceTable({ items, onRefresh }) {
  const handleMarkComplete = async (id) => {
    try {
      const response = await fetch(`/api/compliance/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'Completed',
          completed_date: new Date().toISOString().split('T')[0],
        }),
      });

      if (!response.ok) throw new Error('Failed to update compliance item');

      toast.success('Compliance item marked as complete');
      onRefresh();
    } catch (error) {
      console.error('Error updating compliance item:', error);
      toast.error('Failed to update compliance item');
    }
  };

  const columns = [
    {
      id: 'case_title',
      header: 'Case',
      sortable: true,
    },
    {
      id: 'compliance_type',
      header: 'Type',
      sortable: true,
    },
    {
      id: 'description',
      header: 'Description',
      sortable: false,
    },
    {
      id: 'status',
      header: 'Status',
      sortable: true,
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      id: 'due_date',
      header: 'Due Date',
      sortable: true,
      cell: (row) => row.due_date ? format(new Date(row.due_date), 'PP') : 'N/A',
    },
    {
      id: 'assigned_to_name',
      header: 'Assigned To',
      sortable: true,
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: (row) => (
        <div className="flex items-center gap-2">
          {row.status !== 'Completed' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleMarkComplete(row.id)}
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Complete
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={items}
      emptyMessage="No compliance items found"
    />
  );
}