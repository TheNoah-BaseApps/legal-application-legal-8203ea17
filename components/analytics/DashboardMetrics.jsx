'use client';

import MetricCard from '@/components/common/MetricCard';
import { Users, Scale, MessageSquare, FileText, DollarSign, AlertCircle, TrendingUp, Clock } from 'lucide-react';

export default function DashboardMetrics({ metrics }) {
  if (!metrics) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <MetricCard
        title="Total Customers"
        value={metrics.totalCustomers || 0}
        description="Active client accounts"
        icon={Users}
      />
      <MetricCard
        title="Active Cases"
        value={metrics.activeCases || 0}
        description="Currently ongoing cases"
        icon={Scale}
      />
      <MetricCard
        title="Engagements"
        value={metrics.totalEngagements || 0}
        description="Client interactions this month"
        icon={MessageSquare}
      />
      <MetricCard
        title="Documents"
        value={metrics.totalDocuments || 0}
        description="Files in repository"
        icon={FileText}
      />
      <MetricCard
        title="Pending Compliance"
        value={metrics.pendingCompliance || 0}
        description="Items requiring attention"
        icon={AlertCircle}
      />
      <MetricCard
        title="Unbilled Hours"
        value={metrics.unbilledHours || 0}
        description="Hours awaiting invoice"
        icon={Clock}
      />
      <MetricCard
        title="Revenue (YTD)"
        value={`$${(metrics.totalRevenue || 0).toLocaleString()}`}
        description="Year to date earnings"
        icon={DollarSign}
      />
      <MetricCard
        title="Outstanding Invoices"
        value={metrics.outstandingInvoices || 0}
        description="Awaiting payment"
        icon={TrendingUp}
      />
    </div>
  );
}