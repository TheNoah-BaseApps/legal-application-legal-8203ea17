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
    const groupBy = searchParams.get('groupBy') || 'status';

    const dateFilter = startDate && endDate 
      ? `AND c.created_at BETWEEN '${startDate}' AND '${endDate}'`
      : '';

    const overviewResult = await query(
      `SELECT 
        COUNT(*) as total_cases,
        COUNT(*) FILTER (WHERE c.status = 'open') as open_cases,
        COUNT(*) FILTER (WHERE c.status = 'in_progress') as in_progress_cases,
        COUNT(*) FILTER (WHERE c.status = 'closed') as closed_cases,
        COUNT(*) FILTER (WHERE c.status = 'on_hold') as on_hold_cases,
        COUNT(*) FILTER (WHERE c.priority = 'high') as high_priority,
        COUNT(*) FILTER (WHERE c.priority = 'medium') as medium_priority,
        COUNT(*) FILTER (WHERE c.priority = 'low') as low_priority,
        AVG(EXTRACT(EPOCH FROM (COALESCE(c.closed_at, NOW()) - c.created_at))/86400) as avg_duration_days,
        SUM(te.hours) as total_hours,
        SUM(te.billable_amount) as total_revenue
      FROM cases c
      LEFT JOIN time_entries te ON te.case_id = c.id AND te.deleted_at IS NULL
      WHERE c.deleted_at IS NULL ${dateFilter}`
    );

    const casesByStatusResult = await query(
      `SELECT 
        c.status,
        COUNT(*) as count,
        SUM(te.hours) as total_hours,
        SUM(te.billable_amount) as total_revenue
      FROM cases c
      LEFT JOIN time_entries te ON te.case_id = c.id AND te.deleted_at IS NULL
      WHERE c.deleted_at IS NULL ${dateFilter}
      GROUP BY c.status
      ORDER BY count DESC`
    );

    const casesByTypeResult = await query(
      `SELECT 
        ct.name as case_type,
        COUNT(c.id) as count,
        SUM(te.hours) as total_hours,
        SUM(te.billable_amount) as total_revenue
      FROM case_types ct
      LEFT JOIN cases c ON c.case_type_id = ct.id AND c.deleted_at IS NULL ${dateFilter.replace('c.created_at', 'c.created_at')}
      LEFT JOIN time_entries te ON te.case_id = c.id AND te.deleted_at IS NULL
      GROUP BY ct.name
      ORDER BY count DESC`
    );

    const casesByPriorityResult = await query(
      `SELECT 
        c.priority,
        COUNT(*) as count,
        SUM(te.hours) as total_hours,
        SUM(te.billable_amount) as total_revenue
      FROM cases c
      LEFT JOIN time_entries te ON te.case_id = c.id AND te.deleted_at IS NULL
      WHERE c.deleted_at IS NULL ${dateFilter}
      GROUP BY c.priority
      ORDER BY 
        CASE c.priority
          WHEN 'high' THEN 1
          WHEN 'medium' THEN 2
          WHEN 'low' THEN 3
        END`
    );

    const casesByClientResult = await query(
      `SELECT 
        cl.id,
        cl.name as client_name,
        cl.company,
        COUNT(c.id) as case_count,
        SUM(te.hours) as total_hours,
        SUM(te.billable_amount) as total_revenue
      FROM clients cl
      LEFT JOIN cases c ON c.client_id = cl.id AND c.deleted_at IS NULL ${dateFilter.replace('c.created_at', 'c.created_at')}
      LEFT JOIN time_entries te ON te.case_id = c.id AND te.deleted_at IS NULL
      WHERE cl.deleted_at IS NULL
      GROUP BY cl.id, cl.name, cl.company
      HAVING COUNT(c.id) > 0
      ORDER BY case_count DESC
      LIMIT 20`
    );

    const monthlyTrendResult = await query(
      `SELECT 
        DATE_TRUNC('month', c.created_at) as month,
        COUNT(*) as cases_created,
        COUNT(*) FILTER (WHERE c.status = 'closed') as cases_closed,
        SUM(te.hours) as total_hours,
        SUM(te.billable_amount) as total_revenue
      FROM cases c
      LEFT JOIN time_entries te ON te.case_id = c.id AND te.deleted_at IS NULL
      WHERE c.deleted_at IS NULL 
        AND c.created_at >= NOW() - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', c.created_at)
      ORDER BY month DESC`
    );

    const casePerformanceResult = await query(
      `SELECT 
        c.id,
        c.case_number,
        c.title,
        c.status,
        c.priority,
        cl.name as client_name,
        ct.name as case_type,
        EXTRACT(EPOCH FROM (COALESCE(c.closed_at, NOW()) - c.created_at))/86400 as duration_days,
        COUNT(te.id) as time_entry_count,
        SUM(te.hours) as total_hours,
        SUM(te.billable_amount) as total_revenue,
        c.created_at,
        c.closed_at
      FROM cases c
      LEFT JOIN clients cl ON c.client_id = cl.id
      LEFT JOIN case_types ct ON c.case_type_id = ct.id
      LEFT JOIN time_entries te ON te.case_id = c.id AND te.deleted_at IS NULL
      WHERE c.deleted_at IS NULL ${dateFilter}
      GROUP BY c.id, c.case_number, c.title, c.status, c.priority, 
               cl.name, ct.name, c.created_at, c.closed_at
      ORDER BY total_revenue DESC NULLS LAST
      LIMIT 50`
    );

    const avgTimeToCloseResult = await query(
      `SELECT 
        AVG(EXTRACT(EPOCH FROM (closed_at - created_at))/86400) as avg_days,
        MIN(EXTRACT(EPOCH FROM (closed_at - created_at))/86400) as min_days,
        MAX(EXTRACT(EPOCH FROM (closed_at - created_at))/86400) as max_days
      FROM cases
      WHERE deleted_at IS NULL 
        AND status = 'closed' 
        AND closed_at IS NOT NULL
        ${dateFilter}`
    );

    return NextResponse.json({
      success: true,
      data: {
        overview: overviewResult.rows[0],
        by_status: casesByStatusResult.rows,
        by_type: casesByTypeResult.rows,
        by_priority: casesByPriorityResult.rows,
        by_client: casesByClientResult.rows,
        monthly_trend: monthlyTrendResult.rows,
        case_performance: casePerformanceResult.rows,
        time_to_close: avgTimeToCloseResult.rows[0]
      }
    });

  } catch (error) {
    console.error('Error fetching case analytics:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch case analytics' },
      { status: 500 }
    );
  }
}