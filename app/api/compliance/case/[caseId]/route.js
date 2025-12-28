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

    const { caseId } = params;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');

    let sql = `
      SELECT 
        comp.*,
        u.name as assigned_to_name,
        u.email as assigned_to_email,
        creator.name as created_by_name
      FROM compliance_items comp
      LEFT JOIN users u ON comp.assigned_to = u.id
      LEFT JOIN users creator ON comp.created_by = creator.id
      WHERE comp.case_id = $1 AND comp.deleted_at IS NULL
    `;

    const params_arr = [caseId];
    let paramCount = 2;

    if (status) {
      sql += ` AND comp.status = $${paramCount}`;
      params_arr.push(status);
      paramCount++;
    }

    if (priority) {
      sql += ` AND comp.priority = $${paramCount}`;
      params_arr.push(priority);
      paramCount++;
    }

    sql += `
      ORDER BY 
        CASE 
          WHEN comp.priority = 'critical' THEN 1
          WHEN comp.priority = 'high' THEN 2
          WHEN comp.priority = 'medium' THEN 3
          WHEN comp.priority = 'low' THEN 4
        END,
        comp.due_date ASC NULLS LAST,
        comp.created_at DESC
    `;

    const result = await query(sql, params_arr);

    const caseResult = await query(
      `SELECT 
        c.id, c.case_number, c.title, c.status,
        cl.name as client_name,
        cl.email as client_email
      FROM cases c
      LEFT JOIN clients cl ON c.client_id = cl.id
      WHERE c.id = $1 AND c.deleted_at IS NULL`,
      [caseId]
    );

    if (caseResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Case not found' },
        { status: 404 }
      );
    }

    const statsResult = await query(
      `SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'pending') as pending,
        COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress,
        COUNT(*) FILTER (WHERE status = 'completed') as completed,
        COUNT(*) FILTER (WHERE due_date < NOW() AND status != 'completed') as overdue,
        COUNT(*) FILTER (WHERE priority = 'critical') as critical,
        COUNT(*) FILTER (WHERE priority = 'high') as high,
        COUNT(*) FILTER (WHERE priority = 'medium') as medium,
        COUNT(*) FILTER (WHERE priority = 'low') as low
      FROM compliance_items
      WHERE case_id = $1 AND deleted_at IS NULL`,
      [caseId]
    );

    return NextResponse.json({
      success: true,
      data: {
        case: caseResult.rows[0],
        compliance_items: result.rows,
        stats: statsResult.rows[0]
      },
      count: result.rows.length
    });

  } catch (error) {
    console.error('Error fetching case compliance items:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch case compliance items' },
      { status: 500 }
    );
  }
}