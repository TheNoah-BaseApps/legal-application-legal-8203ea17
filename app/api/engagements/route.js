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
    const clientId = searchParams.get('clientId');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    let sql = `
      SELECT 
        e.*,
        c.name as client_name,
        c.email as client_email,
        u.name as assigned_to_name,
        COUNT(DISTINCT ca.id) as case_count,
        SUM(te.hours) as total_hours,
        SUM(te.billable_amount) as total_billed
      FROM engagements e
      LEFT JOIN clients c ON e.client_id = c.id
      LEFT JOIN users u ON e.assigned_to = u.id
      LEFT JOIN cases ca ON ca.engagement_id = e.id
      LEFT JOIN time_entries te ON te.case_id = ca.id
      WHERE e.deleted_at IS NULL
    `;

    const params = [];
    let paramCount = 1;

    if (clientId) {
      sql += ` AND e.client_id = $${paramCount}`;
      params.push(clientId);
      paramCount++;
    }

    if (status) {
      sql += ` AND e.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (search) {
      sql += ` AND (e.title ILIKE $${paramCount} OR e.description ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }

    sql += `
      GROUP BY e.id, c.name, c.email, u.name
      ORDER BY e.created_at DESC
    `;

    const result = await query(sql, params);

    return NextResponse.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });

  } catch (error) {
    console.error('Error fetching engagements:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch engagements' },
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
      client_id, 
      title, 
      description, 
      engagement_type,
      status = 'active',
      start_date,
      end_date,
      estimated_hours,
      hourly_rate,
      assigned_to
    } = body;

    if (!client_id || !title || !engagement_type) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: client_id, title, engagement_type' },
        { status: 400 }
      );
    }

    await client.query('BEGIN');

    const insertResult = await client.query(
      `INSERT INTO engagements (
        client_id, title, description, engagement_type, status,
        start_date, end_date, estimated_hours, hourly_rate, assigned_to,
        created_by, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
      RETURNING *`,
      [
        client_id, title, description, engagement_type, status,
        start_date, end_date, estimated_hours, hourly_rate, assigned_to,
        authResult.user.id
      ]
    );

    const engagement = insertResult.rows[0];

    await client.query(
      `INSERT INTO audit_logs (
        user_id, action, entity_type, entity_id, details, created_at
      ) VALUES ($1, $2, $3, $4, $5, NOW())`,
      [
        authResult.user.id,
        'CREATE',
        'engagement',
        engagement.id,
        JSON.stringify({ title, engagement_type })
      ]
    );

    await client.query('COMMIT');

    return NextResponse.json({
      success: true,
      data: engagement,
      message: 'Engagement created successfully'
    }, { status: 201 });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating engagement:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create engagement' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}