'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import DataTable from '@/components/common/DataTable';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function EngagementTable({ engagements, onRefresh }) {
  const [deleteId, setDeleteId] = useState(null);

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/engagements/${deleteId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete engagement');

      toast.success('Engagement deleted successfully');
      setDeleteId(null);
      onRefresh();
    } catch (error) {
      console.error('Error deleting engagement:', error);
      toast.error('Failed to delete engagement');
    }
  };

  const columns = [
    {
      id: 'engagement_id',
      header: 'Engagement ID',
      sortable: true,
    },
    {
      id: 'client_name',
      header: 'Client',
      sortable: true,
    },
    {
      id: 'engagement_type',
      header: 'Type',
      sortable: true,
    },
    {
      id: 'engagement_channel',
      header: 'Channel',
      sortable: true,
    },
    {
      id: 'engagement_date',
      header: 'Date',
      sortable: true,
      cell: (row) => row.engagement_date ? format(new Date(row.engagement_date), 'PP') : 'N/A',
    },
    {
      id: 'engagement_outcome',
      header: 'Outcome',
      sortable: true,
    },
    {
      id: 'duration_minutes',
      header: 'Duration',
      sortable: true,
      cell: (row) => row.duration_minutes ? `${row.duration_minutes} min` : 'N/A',
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: (row) => (
        <div className="flex items-center gap-2">
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
        data={engagements}
        emptyMessage="No engagements found"
      />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        title="Delete Engagement"
        description="Are you sure you want to delete this engagement record?"
        onConfirm={handleDelete}
        variant="destructive"
        confirmText="Delete"
      />
    </>
  );
}