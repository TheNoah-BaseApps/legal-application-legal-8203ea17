'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import EngagementTimeline from '@/components/engagements/EngagementTimeline';
import { ArrowLeft, AlertCircle } from 'lucide-react';

export default function ClientEngagementsPage() {
  const params = useParams();
  const router = useRouter();
  const [engagements, setEngagements] = useState([]);
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [engagementsRes, clientRes] = await Promise.all([
          fetch(`/api/engagements/client/${params.clientId}`),
          fetch(`/api/customers/${params.clientId}`),
        ]);

        if (!engagementsRes.ok || !clientRes.ok) {
          throw new Error('Failed to fetch data');
        }

        const [engagementsData, clientData] = await Promise.all([
          engagementsRes.json(),
          clientRes.json(),
        ]);

        setEngagements(engagementsData.data || []);
        setClient(clientData.data);
      } catch (err) {
        console.error('Error fetching client engagements:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (params.clientId) {
      fetchData();
    }
  }, [params.clientId]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Button variant="outline" onClick={() => router.push('/engagements')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Engagements
        </Button>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button variant="outline" onClick={() => router.push('/engagements')}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Engagements
      </Button>

      <div>
        <h1 className="text-3xl font-bold">
          Engagement History: {client?.customer_name}
        </h1>
        <p className="text-muted-foreground mt-1">
          All interactions and communications with this client
        </p>
      </div>

      <EngagementTimeline engagements={engagements} />
    </div>
  );
}