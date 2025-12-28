'use client';

import { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CaseStatistics from '@/components/analytics/CaseStatistics';
import RevenueAnalytics from '@/components/analytics/RevenueAnalytics';
import { AlertCircle, BarChart3 } from 'lucide-react';

export default function AnalyticsPage() {
  const [caseStats, setCaseStats] = useState(null);
  const [revenueStats, setRevenueStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const [casesRes, revenueRes] = await Promise.all([
          fetch('/api/analytics/cases'),
          fetch('/api/analytics/revenue'),
        ]);

        if (!casesRes.ok || !revenueRes.ok) {
          throw new Error('Failed to fetch analytics');
        }

        const [casesData, revenueData] = await Promise.all([
          casesRes.json(),
          revenueRes.json(),
        ]);

        setCaseStats(casesData.data);
        setRevenueStats(revenueData.data);
      } catch (err) {
        console.error('Error fetching analytics:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

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
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <BarChart3 className="h-8 w-8" />
          Analytics & Reports
        </h1>
        <p className="text-muted-foreground mt-1">
          View detailed insights and performance metrics
        </p>
      </div>

      <Tabs defaultValue="cases" className="space-y-4">
        <TabsList>
          <TabsTrigger value="cases">Case Statistics</TabsTrigger>
          <TabsTrigger value="revenue">Revenue Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="cases" className="space-y-4">
          <CaseStatistics data={caseStats} />
        </TabsContent>

        <TabsContent value="revenue" className="space-y-4">
          <RevenueAnalytics data={revenueStats} />
        </TabsContent>
      </Tabs>
    </div>
  );
}