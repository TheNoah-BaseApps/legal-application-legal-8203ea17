'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import DataTable from '@/components/common/DataTable';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { Download, Trash2, File } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function DocumentTable({ documents, onRefresh }) {
  const [deleteId, setDeleteId] = useState(null);

  const handleDownload = async (documentId) => {
    try {
      window.open(`/api/documents/${documentId}`, '_blank');
    } catch (error) {
      console.error('Error downloading document:', error);
      toast.error('Failed to download document');
    }
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/documents/${deleteId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete document');

      toast.success('Document deleted successfully');
      setDeleteId(null);
      onRefresh();
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Failed to delete document');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const columns = [
    {
      id: 'document_name',
      header: 'Document Name',
      sortable: true,
      cell: (row) => (
        <div className="flex items-center gap-2">
          <File className="h-4 w-4 text-muted-foreground" />
          {row.document_name}
        </div>
      ),
    },
    {
      id: 'document_type',
      header: 'Type',
      sortable: true,
    },
    {
      id: 'file_size',
      header: 'Size',
      sortable: true,
      cell: (row) => formatFileSize(row.file_size || 0),
    },
    {
      id: 'version',
      header: 'Version',
      sortable: true,
      cell: (row) => `v${row.version || 1}`,
    },
    {
      id: 'tags',
      header: 'Tags',
      cell: (row) => (
        <div className="flex flex-wrap gap-1">
          {(row.tags || []).slice(0, 3).map((tag, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      id: 'uploaded_at',
      header: 'Uploaded',
      sortable: true,
      cell: (row) => row.uploaded_at ? format(new Date(row.uploaded_at), 'PP') : 'N/A',
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleDownload(row.id)}
          >
            <Download className="h-4 w-4" />
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
        data={documents}
        emptyMessage="No documents found"
      />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        title="Delete Document"
        description="Are you sure you want to delete this document? This action cannot be undone."
        onConfirm={handleDelete}
        variant="destructive"
        confirmText="Delete"
      />
    </>
  );
}