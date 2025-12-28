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
    const billable = searchParams.get('billable');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const groupBy = searchParams.get('groupBy');

    let sql = `
      SELECT 
        te.*,
        u.name as user_name,
        u.email as user_email,
        u.hourly_rate as user_default_rate
      FROM time_entries te
      LEFT JOIN users u ON te.user_id = u.id
      WHERE te.case_id = $1 AND te.deleted_at IS NULL
    `;

    const params_arr = [caseId];
    let paramCount = 2;

    if (billable !== null && billable !== undefined) {
      sql += ` AND te.billable = $${paramCount}`;
      params_arr.push(billable === 'true');
      paramCount++;
    }

    if (startDate) {
      sql += ` AND te.date >= $${paramCount}`;
      params_arr.push(startDate);
      paramCount++;
    }

    if (endDate) {
      sql += ` AND te.date <= $${paramCount}`;
      params_arr.push(endDate);
      paramCount++;
    }

    sql += `
      ORDER BY te.date DESC, te.created_at DESC
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
        COUNT(*) as total_entries,
        SUM(hours) as total_hours,
        SUM(CASE WHEN billable THEN hours ELSE 0 END) as billable_hours,
        SUM(CASE WHEN NOT billable THEN hours ELSE 0 END) as non_billable_hours,
        SUM(billable_amount) as total_billable_amount,
        SUM(CASE WHEN invoice_id IS NOT NULL THEN billable_amount ELSE 0 END) as invoiced_amount,
        SUM(CASE WHEN invoice_id IS NULL AND billable THEN billable_amount ELSE 0 END) as unbilled_amount,
        COUNT(DISTINCT user_id) as unique_users
      FROM time_entries
      WHERE case_id = $1 AND deleted_at IS NULL
        ${startDate ? `AND date >= '${startDate}'` : ''}
        ${endDate ? `AND date <= '${endDate}'` : ''}`,
      [caseId]
    );

    let groupedData = null;
    if (groupBy === 'user') {
      const groupResult = await query(
        `SELECT 
          u.id as user_id,
          u.name as user_name,
          COUNT(*) as entry_count,
          SUM(te.hours) as total_hours,
          SUM(te.billable_amount) as total_amount
        FROM time_entries te
        LEFT JOIN users u ON te.user_id = u.id
        WHERE te.case_id = $1 AND te.deleted_at IS NULL
        GROUP BY u.id, u.name
        ORDER BY total_hours DESC`,
        [caseId]
      );
      groupedData = groupResult.rows;
    } else if (groupBy === 'date') {
      const groupResult = await query(
        `SELECT 
          te.date,
          COUNT(*) as entry_count,
          SUM(te.hours) as total_hours,
          SUM(te.billable_amount) as total_amount
        FROM time_entries te
        WHERE te.case_id = $1 AND te.deleted_at IS NULL
        GROUP BY te.date
        ORDER BY te.date DESC`,
        [caseId]
      );
      groupedData = groupResult.rows;
    }

    return NextResponse.json({
      success: true,
      data: {
        case: caseResult.rows[0],
        time_entries: result.rows,
        stats: statsResult.rows[0],
        grouped: groupedData
      },
      count: result.rows.length
    });

  } catch (error) {
    console.error('Error fetching case time entries:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch case time entries' },
      { status: 500 }
    );
  }
}