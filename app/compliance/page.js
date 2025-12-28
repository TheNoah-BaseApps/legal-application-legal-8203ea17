'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import ComplianceTable from '@/components/compliance/ComplianceTable';
import ComplianceForm from '@/components/compliance/ComplianceForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, AlertCircle, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

export default function CompliancePage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddDialog, setShowAddDialog] = useState(false);

  const fetchCompliance = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/compliance');
      if (!response.ok) throw new Error('Failed to fetch compliance items');
      const data = await response.json();
      setItems(data.data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching compliance:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompliance();
  }, []);

  const handleAddSuccess = () => {
    setShowAddDialog(false);
    fetchCompliance();
    toast.success('Compliance item created successfully');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ShieldCheck className="h-8 w-8" />
            Compliance Tracker
          </h1>
          <p className="text-muted-foreground mt-1">
            Monitor compliance requirements and deadlines
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Compliance Item
        </Button>
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
        <ComplianceTable items={items} onRefresh={fetchCompliance} />
      )}

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Compliance Item</DialogTitle>
          </DialogHeader>
          <ComplianceForm onSuccess={handleAddSuccess} onCancel={() => setShowAddDialog(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}