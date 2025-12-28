import { NextResponse } from 'next/server';
import { query, getClient } from '@/lib/database/aurora';
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
    const caseId = searchParams.get('caseId');
    const userId = searchParams.get('userId');
    const billable = searchParams.get('billable');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const invoiced = searchParams.get('invoiced');

    let sql = `
      SELECT 
        te.*,
        c.case_number,
        c.title as case_title,
        cl.name as client_name,
        u.name as user_name,
        u.email as user_email,
        u.hourly_rate as user_hourly_rate
      FROM time_entries te
      LEFT JOIN cases c ON te.case_id = c.id
      LEFT JOIN clients cl ON c.client_id = cl.id
      LEFT JOIN users u ON te.user_id = u.id
      WHERE te.deleted_at IS NULL
    `;

    const params = [];
    let paramCount = 1;

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

    if (billable !== null && billable !== undefined) {
      sql += ` AND te.billable = $${paramCount}`;
      params.push(billable === 'true');
      paramCount++;
    }

    if (invoiced !== null && invoiced !== undefined) {
      if (invoiced === 'true') {
        sql += ` AND te.invoice_id IS NOT NULL`;
      } else {
        sql += ` AND te.invoice_id IS NULL`;
      }
    }

    if (startDate) {
      sql += ` AND te.date >= $${paramCount}`;
      params.push(startDate);
      paramCount++;
    }

    if (endDate) {
      sql += ` AND te.date <= $${paramCount}`;
      params.push(endDate);
      paramCount++;
    }

    sql += `
      ORDER BY te.date DESC, te.created_at DESC
    `;

    const result = await query(sql, params);

    const statsResult = await query(
      `SELECT 
        COUNT(*) as total_entries,
        SUM(hours) as total_hours,
        SUM(CASE WHEN billable THEN hours ELSE 0 END) as billable_hours,
        SUM(CASE WHEN NOT billable THEN hours ELSE 0 END) as non_billable_hours,
        SUM(billable_amount) as total_billable_amount,
        SUM(CASE WHEN invoice_id IS NOT NULL THEN billable_amount ELSE 0 END) as invoiced_amount,
        SUM(CASE WHEN invoice_id IS NULL AND billable THEN billable_amount ELSE 0 END) as unbilled_amount
      FROM time_entries
      WHERE deleted_at IS NULL
        ${caseId ? `AND case_id = '${caseId}'` : ''}
        ${userId ? `AND user_id = '${userId}'` : ''}
        ${startDate ? `AND date >= '${startDate}'` : ''}
        ${endDate ? `AND date <= '${endDate}'` : ''}
    `);

    return NextResponse.json({
      success: true,
      data: result.rows,
      stats: statsResult.rows[0],
      count: result.rows.length
    });

  } catch (error) {
    console.error('Error fetching time entries:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch time entries' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  const client = await getClient();
  
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.authenticated) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { 
      case_id,
      date,
      hours,
      description,
      task_type,
      billable = true,
      hourly_rate,
      user_id
    } = body;

    if (!case_id || !date || !hours || !description) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: case_id, date, hours, description' },
        { status: 400 }
      );
    }

    if (hours <= 0 || hours > 24) {
      return NextResponse.json(
        { success: false, error: 'Hours must be between 0 and 24' },
        { status: 400 }
      );
    }

    const effectiveUserId = user_id || authResult.user.id;

    let effectiveHourlyRate = hourly_rate;
    if (!effectiveHourlyRate) {
      const userResult = await client.query(
        'SELECT hourly_rate FROM users WHERE id = $1',
        [effectiveUserId]
      );
      effectiveHourlyRate = userResult.rows[0]?.hourly_rate || 0;
    }

    const billableAmount = billable ? (hours * effectiveHourlyRate) : 0;

    await client.query('BEGIN');

    const insertResult = await client.query(
      `INSERT INTO time_entries (
        case_id, user_id, date, hours, description, task_type,
        billable, hourly_rate, billable_amount,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
      RETURNING *`,
      [
        case_id, effectiveUserId, date, hours, description, task_type,
        billable, effectiveHourlyRate, billableAmount
      ]
    );

    const timeEntry = insertResult.rows[0];

    await client.query(
      `INSERT INTO audit_logs (
        user_id, action, entity_type, entity_id, details, created_at
      ) VALUES ($1, $2, $3, $4, $5, NOW())`,
      [
        authResult.user.id,
        'CREATE',
        'time_entry',
        timeEntry.id,
        JSON.stringify({ case_id, hours, billable_amount: billableAmount })
      ]
    );

    await client.query('COMMIT');

    return NextResponse.json({
      success: true,
      data: timeEntry,
      message: 'Time entry created successfully'
    }, { status: 201 });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating time entry:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create time entry' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}