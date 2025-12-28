import { NextResponse } from 'next/server';
import { query } from '@/lib/database/aurora';
import { verifyAuth } from '@/lib/auth';

export async function GET(request, { params }) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.authenticated) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { clientId } = params;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const includeStats = searchParams.get('includeStats') === 'true';

    let sql = `
      SELECT 
        e.*,
        u.name as assigned_to_name,
        u.email as assigned_to_email,
        creator.name as created_by_name
    `;

    if (includeStats) {
      sql += `,
        COUNT(DISTINCT ca.id) as case_count,
        COUNT(DISTINCT te.id) as time_entry_count,
        COALESCE(SUM(te.hours), 0) as total_hours,
        COALESCE(SUM(te.billable_amount), 0) as total_billed,
        COALESCE(SUM(CASE WHEN i.status = 'paid' THEN i.total_amount ELSE 0 END), 0) as total_paid
      `;
    }

    sql += `
      FROM engagements e
      LEFT JOIN users u ON e.assigned_to = u.id
      LEFT JOIN users creator ON e.created_by = creator.id
    `;

    if (includeStats) {
      sql += `
        LEFT JOIN cases ca ON ca.engagement_id = e.id AND ca.deleted_at IS NULL
        LEFT JOIN time_entries te ON te.case_id = ca.id AND te.deleted_at IS NULL
        LEFT JOIN invoices i ON i.engagement_id = e.id AND i.deleted_at IS NULL
      `;
    }

    sql += `
      WHERE e.client_id = $1 AND e.deleted_at IS NULL
    `;

    const params = [clientId];
    let paramCount = 2;

    if (status) {
      sql += ` AND e.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (includeStats) {
      sql += `
        GROUP BY e.id, u.name, u.email, creator.name
      `;
    }

    sql += `
      ORDER BY e.created_at DESC
    `;

    const result = await query(sql, params);

    const clientResult = await query(
      `SELECT id, name, email, company, phone 
       FROM clients 
       WHERE id = $1 AND deleted_at IS NULL`,
      [clientId]
    );

    if (clientResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Client not found' },
        { status: 404 }
      );
    }

    const statsResult = await query(
      `SELECT 
        COUNT(DISTINCT e.id) as total_engagements,
        COUNT(DISTINCT e.id) FILTER (WHERE e.status = 'active') as active_engagements,
        COUNT(DISTINCT e.id) FILTER (WHERE e.status = 'completed') as completed_engagements,
        COUNT(DISTINCT ca.id) as total_cases,
        COALESCE(SUM(te.hours), 0) as total_hours,
        COALESCE(SUM(te.billable_amount), 0) as total_billed,
        COALESCE(SUM(CASE WHEN i.status = 'paid' THEN i.total_amount ELSE 0 END), 0) as total_paid
      FROM clients c
      LEFT JOIN engagements e ON e.client_id = c.id AND e.deleted_at IS NULL
      LEFT JOIN cases ca ON ca.engagement_id = e.id AND ca.deleted_at IS NULL
      LEFT JOIN time_entries te ON te.case_id = ca.id AND te.deleted_at IS NULL
      LEFT JOIN invoices i ON i.engagement_id = e.id AND i.deleted_at IS NULL
      WHERE c.id = $1`,
      [clientId]
    );

    return NextResponse.json({
      success: true,
      data: {
        client: clientResult.rows[0],
        engagements: result.rows,
        stats: statsResult.rows[0]
      },
      count: result.rows.length
    });

  } catch (error) {
    console.error('Error fetching client engagements:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch client engagements' },
      { status: 500 }
    );
  }
}