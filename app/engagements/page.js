'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import EngagementTable from '@/components/engagements/EngagementTable';
import EngagementForm from '@/components/engagements/EngagementForm';
import SearchBar from '@/components/common/SearchBar';
import FilterPanel from '@/components/common/FilterPanel';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, AlertCircle, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

export default function EngagementsPage() {
  const [engagements, setEngagements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({});

  const fetchEngagements = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (filters.type) params.append('type', filters.type);
      if (filters.channel) params.append('channel', filters.channel);

      const response = await fetch(`/api/engagements?${params}`);
      if (!response.ok) throw new Error('Failed to fetch engagements');
      const data = await response.json();
      setEngagements(data.data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching engagements:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEngagements();
  }, [searchTerm, filters]);

  const handleAddSuccess = () => {
    setShowAddDialog(false);
    fetchEngagements();
    toast.success('Engagement recorded successfully');
  };

  const filterOptions = [
    {
      id: 'type',
      label: 'Type',
      options: [
        { value: 'Meeting', label: 'Meeting' },
        { value: 'Call', label: 'Call' },
        { value: 'Email', label: 'Email' },
        { value: 'Consultation', label: 'Consultation' },
      ],
    },
    {
      id: 'channel',
      label: 'Channel',
      options: [
        { value: 'Phone', label: 'Phone' },
        { value: 'Email', label: 'Email' },
        { value: 'In-Person', label: 'In-Person' },
        { value: 'Video Call', label: 'Video Call' },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <MessageSquare className="h-8 w-8" />
            Client Engagements
          </h1>
          <p className="text-muted-foreground mt-1">
            Track client interactions and communications
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Record Engagement
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search engagements by client or notes..."
          />
        </div>
        <FilterPanel
          filters={filterOptions}
          values={filters}
          onChange={setFilters}
        />
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : (
        <EngagementTable engagements={engagements} onRefresh={fetchEngagements} />
      )}

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Record Client Engagement</DialogTitle>
          </DialogHeader>
          <EngagementForm onSuccess={handleAddSuccess} onCancel={() => setShowAddDialog(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}