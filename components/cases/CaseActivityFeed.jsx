'use client';

import { useEffect, useState } from 'react';
import TimelineView from '@/components/common/TimelineView';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export default function CaseActivityFeed({ caseId }) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        // In production, create /api/cases/[id]/activity endpoint
        const response = await fetch(`/api/audit-logs?entity_type=case&entity_id=${caseId}`);
        if (!response.ok) throw new Error('Failed to fetch activities');
        
        const data = await response.json();
        const formattedActivities = (data.data || []).map((log) => ({
          title: log.action,
          date: new Date(log.created_at).toLocaleString(),
          description: `User performed ${log.action.toLowerCase()}`,
          badge: log.action,
        }));
        
        setActivities(formattedActivities);
      } catch (err) {
        console.error('Error fetching activities:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, [caseId]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No activity recorded for this case
      </div>
    );
  }

  return <TimelineView items={activities} />;
}