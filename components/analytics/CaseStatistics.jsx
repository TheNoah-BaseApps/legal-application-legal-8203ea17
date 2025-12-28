'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ChartWidget from '@/components/common/ChartWidget';

export default function CaseStatistics({ data }) {
  if (!data) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <ChartWidget title="Cases by Status" description="Current case distribution">
        <div className="space-y-3">
          {Object.entries(data.byStatus || {}).map(([status, count]) => (
            <div key={status} className="flex items-center justify-between">
              <span className="text-sm font-medium">{status}</span>
              <span className="text-sm text-muted-foreground">{count}</span>
            </div>
          ))}
        </div>
      </ChartWidget>

      <ChartWidget title="Cases by Type" description="Case type breakdown">
        <div className="space-y-3">
          {Object.entries(data.byType || {}).map(([type, count]) => (
            <div key={type} className="flex items-center justify-between">
              <span className="text-sm font-medium">{type}</span>
              <span className="text-sm text-muted-foreground">{count}</span>
            </div>
          ))}
        </div>
      </ChartWidget>

      <ChartWidget title="Cases by Priority" description="Priority distribution">
        <div className="space-y-3">
          {Object.entries(data.byPriority || {}).map(([priority, count]) => (
            <div key={priority} className="flex items-center justify-between">
              <span className="text-sm font-medium">{priority}</span>
              <span className="text-sm text-muted-foreground">{count}</span>
            </div>
          ))}
        </div>
      </ChartWidget>

      <Card>
        <CardHeader>
          <CardTitle>Case Metrics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Total Cases</span>
            <span className="text-lg font-bold">{data.totalCases || 0}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Avg. Case Duration</span>
            <span className="text-lg font-bold">{data.avgDuration || 0} days</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Cases This Month</span>
            <span className="text-lg font-bold">{data.thisMonth || 0}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}