import { NextResponse } from 'next/server';
import { query } from '@/lib/database/aurora';
import { verifyAuth } from '@/lib/auth';

export async function GET(request) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.authenticated) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const dateFilter = startDate && endDate 
      ? `AND created_at BETWEEN '${startDate}' AND '${endDate}'`
      : `AND created_at >= NOW() - INTERVAL '30 days'`;

    const caseStatsResult = await query(
      `SELECT 
        COUNT(*) as total_cases,
        COUNT(*) FILTER (WHERE status = 'open') as open_cases,
        COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress_cases,
        COUNT(*) FILTER (WHERE status = 'closed') as closed_cases,
        COUNT(*) FILTER (WHERE priority = 'high') as high_priority_cases,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as new_cases_this_month
      FROM cases
      WHERE deleted_at IS NULL`
    );

    const revenueStatsResult = await query(
      `SELECT 
        SUM(total_amount) as total_revenue,
        SUM(CASE WHEN status = 'paid' THEN total_amount ELSE 0 END) as paid_revenue,
        SUM(CASE WHEN status IN ('sent', 'overdue') THEN total_amount ELSE 0 END) as outstanding_revenue,
        COUNT(*) as total_invoices,
        COUNT(*) FILTER (WHERE status = 'paid') as paid_invoices,
        COUNT(*) FILTER (WHERE status = 'overdue') as overdue_invoices
      FROM invoices
      WHERE deleted_at IS NULL ${dateFilter.replace('created_at', 'invoice_date')}`
    );

    const timeStatsResult = await query(
      `SELECT 
        SUM(hours) as total_hours,
        SUM(CASE WHEN billable THEN hours ELSE 0 END) as billable_hours,
        SUM(CASE WHEN NOT billable THEN hours ELSE 0 END) as non_billable_hours,
        SUM(billable_amount) as total_billable_amount,
        SUM(CASE WHEN invoice_id IS NULL AND billable THEN billable_amount ELSE 0 END) as unbilled_amount,
        COUNT(*) as total_entries,
        COUNT(DISTINCT user_id) as active_users
      FROM time_entries
      WHERE deleted_at IS NULL ${dateFilter}`
    );

    const clientStatsResult = await query(
      `SELECT 
        COUNT(*) as total_clients,
        COUNT(*) FILTER (WHERE status = 'active') as active_clients,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as new_clients_this_month
      FROM clients
      WHERE deleted_at IS NULL`
    );

    const engagementStatsResult = await query(
      `SELECT 
        COUNT(*) as total_engagements,
        COUNT(*) FILTER (WHERE status = 'active') as active_engagements,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_engagements
      FROM engagements
      WHERE deleted_at IS NULL`
    );

    const complianceStatsResult = await query(
      `SELECT 
        COUNT(*) as total_items,
        COUNT(*) FILTER (WHERE status = 'pending') as pending,
        COUNT(*) FILTER (WHERE status = 'completed') as completed,
        COUNT(*) FILTER (WHERE due_date < NOW() AND status != 'completed') as overdue,
        COUNT(*) FILTER (WHERE priority = 'critical') as critical
      FROM compliance_items
      WHERE deleted_at IS NULL`
    );

    const recentActivityResult = await query(
      `SELECT 
        al.*,
        u.name as user_name,
        u.email as user_email
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      ORDER BY al.created_at DESC
      LIMIT 20`
    );

    const monthlyRevenueResult = await query(
      `SELECT 
        DATE_TRUNC('month', invoice_date) as month,
        SUM(total_amount) as total,
        SUM(CASE WHEN status = 'paid' THEN total_amount ELSE 0 END) as paid,
        COUNT(*) as invoice_count
      FROM invoices
      WHERE deleted_at IS NULL 
        AND invoice_date >= NOW() - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', invoice_date)
      ORDER BY month DESC
      LIMIT 12`
    );

    const topClientsResult = await query(
      `SELECT 
        cl.id,
        cl.name,
        cl.company,
        COUNT(DISTINCT i.id) as invoice_count,
        SUM(i.total_amount) as total_revenue,
        SUM(CASE WHEN i.status = 'paid' THEN i.total_amount ELSE 0 END) as paid_revenue
      FROM clients cl
      LEFT JOIN invoices i ON i.client_id = cl.id AND i.deleted_at IS NULL
      WHERE cl.deleted_at IS NULL
      GROUP BY cl.id, cl.name, cl.company
      ORDER BY total_revenue DESC NULLS LAST
      LIMIT 10`
    );

    const casesByStatusResult = await query(
      `SELECT 
        status,
        COUNT(*) as count
      FROM cases
      WHERE deleted_at IS NULL
      GROUP BY status
      ORDER BY count DESC`
    );

    const utilizationResult = await query(
      `SELECT 
        u.id,
        u.name,
        u.hourly_rate,
        COUNT(te.id) as entry_count,
        SUM(te.hours) as total_hours,
        SUM(CASE WHEN te.billable THEN te.hours ELSE 0 END) as billable_hours,
        SUM(te.billable_amount) as total_revenue
      FROM users u
      LEFT JOIN time_entries te ON te.user_id = u.id 
        AND te.deleted_at IS NULL 
        AND te.date >= NOW() - INTERVAL '30 days'
      WHERE u.deleted_at IS NULL
      GROUP BY u.id, u.name, u.hourly_rate
      ORDER BY total_hours DESC NULLS LAST
      LIMIT 10`
    );

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          cases: caseStatsResult.rows[0],
          revenue: revenueStatsResult.rows[0],
          time: timeStatsResult.rows[0],
          clients: clientStatsResult.rows[0],
          engagements: engagementStatsResult.rows[0],
          compliance: complianceStatsResult.rows[0]
        },
        charts: {
          monthly_revenue: monthlyRevenueResult.rows,
          cases_by_status: casesByStatusResult.rows,
          top_clients: topClientsResult.rows,
          user_utilization: utilizationResult.rows
        },
        recent_activity: recentActivityResult.rows
      }
    });

  } catch (error) {
    console.error('Error fetching dashboard analytics:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dashboard analytics' },
      { status: 500 }
    );
  }
}