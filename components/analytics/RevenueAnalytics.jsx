'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ChartWidget from '@/components/common/ChartWidget';

export default function RevenueAnalytics({ data }) {
  if (!data) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Revenue Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Total Revenue (YTD)</span>
            <span className="text-2xl font-bold">
              ${(data.totalRevenue || 0).toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">This Month</span>
            <span className="text-xl font-bold">
              ${(data.thisMonth || 0).toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Outstanding</span>
            <span className="text-xl font-bold text-orange-600">
              ${(data.outstanding || 0).toLocaleString()}
            </span>
          </div>
        </CardContent>
      </Card>

      <ChartWidget title="Revenue by Month" description="Monthly revenue trend">
        <div className="space-y-3">
          {(data.byMonth || []).map((item, index) => (
            <div key={index} className="flex items-center justify-between">
              <span className="text-sm font-medium">{item.month}</span>
              <span className="text-sm text-muted-foreground">
                ${item.amount.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </ChartWidget>

      <ChartWidget title="Billable Hours" description="Time tracking summary">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Total Hours Logged</span>
            <span className="text-sm text-muted-foreground">
              {data.totalHours || 0} hrs
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Billable Hours</span>
            <span className="text-sm text-muted-foreground">
              {data.billableHours || 0} hrs
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Unbilled Hours</span>
            <span className="text-sm text-muted-foreground">
              {data.unbilledHours || 0} hrs
            </span>
          </div>
        </div>
      </ChartWidget>

      <Card>
        <CardHeader>
          <CardTitle>Invoice Statistics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Total Invoices</span>
            <span className="text-lg font-bold">{data.totalInvoices || 0}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Paid</span>
            <span className="text-lg font-bold text-green-600">
              {data.paidInvoices || 0}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Pending</span>
            <span className="text-lg font-bold text-orange-600">
              {data.pendingInvoices || 0}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}