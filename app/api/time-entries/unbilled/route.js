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
    const clientId = searchParams.get('clientId');
    const caseId = searchParams.get('caseId');
    const userId = searchParams.get('userId');
    const groupBy = searchParams.get('groupBy');

    let sql = `
      SELECT 
        te.*,
        c.case_number,
        c.title as case_title,
        c.id as case_id,
        cl.id as client_id,
        cl.name as client_name,
        cl.email as client_email,
        u.name as user_name,
        u.email as user_email,
        e.id as engagement_id,
        e.title as engagement_title
      FROM time_entries te
      LEFT JOIN cases c ON te.case_id = c.id
      LEFT JOIN clients cl ON c.client_id = cl.id
      LEFT JOIN engagements e ON c.engagement_id = e.id
      LEFT JOIN users u ON te.user_id = u.id
      WHERE te.deleted_at IS NULL 
        AND te.billable = true 
        AND te.invoice_id IS NULL
    `;

    const params = [];
    let paramCount = 1;

    if (clientId) {
      sql += ` AND cl.id = $${paramCount}`;
      params.push(clientId);
      paramCount++;
    }

    if (caseId) {
      sql += ` AND te.case_id = $${paramCount}`;
      params.push(caseId);
      paramCount++;
    }

    if (userId) {
      sql += ` AND te.user_id = $${paramCount}`;
      params.push(userId);
      paramCount++;
    }

    sql += `
      ORDER BY cl.name, c.case_number, te.date DESC
    `;

    const result = await query(sql, params);

    const statsResult = await query(
      `SELECT 
        COUNT(*) as total_entries,
        SUM(te.hours) as total_hours,
        SUM(te.billable_amount) as total_amount,
        COUNT(DISTINCT c.id) as total_cases,
        COUNT(DISTINCT cl.id) as total_clients
      FROM time_entries te
      LEFT JOIN cases c ON te.case_id = c.id
      LEFT JOIN clients cl ON c.client_id = cl.id
      WHERE te.deleted_at IS NULL 
        AND te.billable = true 
        AND te.invoice_id IS NULL
        ${clientId ? `AND cl.id = '${clientId}'` : ''}
        ${caseId ? `AND te.case_id = '${caseId}'` : ''}
        ${userId ? `AND te.user_id = '${userId}'` : ''}
    `);

    let groupedData = null;
    if (groupBy === 'client') {
      const groupResult = await query(
        `SELECT 
          cl.id as client_id,
          cl.name as client_name,
          COUNT(DISTINCT c.id) as case_count,
          COUNT(te.id) as entry_count,
          SUM(te.hours) as total_hours,
          SUM(te.billable_amount) as total_amount
        FROM time_entries te
        LEFT JOIN cases c ON te.case_id = c.id
        LEFT JOIN clients cl ON c.client_id = cl.id
        WHERE te.deleted_at IS NULL 
          AND te.billable = true 
          AND te.invoice_id IS NULL
        GROUP BY cl.id, cl.name
        ORDER BY total_amount DESC`
      );
      groupedData = groupResult.rows;
    } else if (groupBy === 'case') {
      const groupResult = await query(
        `SELECT 
          c.id as case_id,
          c.case_number,
          c.title as case_title,
          cl.name as client_name,
          COUNT(te.id) as entry_count,
          SUM(te.hours) as total_hours,
          SUM(te.billable_amount) as total_amount
        FROM time_entries te
        LEFT JOIN cases c ON te.case_id = c.id
        LEFT JOIN clients cl ON c.client_id = cl.id
        WHERE te.deleted_at IS NULL 
          AND te.billable = true 
          AND te.invoice_id IS NULL
          ${clientId ? `AND cl.id = '${clientId}'` : ''}
        GROUP BY c.id, c.case_number, c.title, cl.name
        ORDER BY total_amount DESC`
      );
      groupedData = groupResult.rows;
    } else if (groupBy === 'user') {
      const groupResult = await query(
        `SELECT 
          u.id as user_id,
          u.name as user_name,
          COUNT(te.id) as entry_count,
          SUM(te.hours) as total_hours,
          SUM(te.billable_amount) as total_amount
        FROM time_entries te
        LEFT JOIN users u ON te.user_id = u.id
        WHERE te.deleted_at IS NULL 
          AND te.billable = true 
          AND te.invoice_id IS NULL
        GROUP BY u.id, u.name
        ORDER BY total_amount DESC`
      );
      groupedData = groupResult.rows;
    }

    return NextResponse.json({
      success: true,
      data: result.rows,
      stats: statsResult.rows[0],
      grouped: groupedData,
      count: result.rows.length
    });

  } catch (error) {
    console.error('Error fetching unbilled time entries:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch unbilled time entries' },
      { status: 500 }
    );
  }
}