import { NextResponse } from 'next/server';
import { query, getClient } from '@/lib/database/aurora';
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

    const { id } = params;

    const result = await query(
      `SELECT 
        e.*,
        c.name as client_name,
        c.email as client_email,
        c.phone as client_phone,
        c.company as client_company,
        u.name as assigned_to_name,
        u.email as assigned_to_email,
        creator.name as created_by_name,
        COUNT(DISTINCT ca.id) as case_count,
        SUM(te.hours) as total_hours,
        SUM(te.billable_amount) as total_billed
      FROM engagements e
      LEFT JOIN clients c ON e.client_id = c.id
      LEFT JOIN users u ON e.assigned_to = u.id
      LEFT JOIN users creator ON e.created_by = creator.id
      LEFT JOIN cases ca ON ca.engagement_id = e.id AND ca.deleted_at IS NULL
      LEFT JOIN time_entries te ON te.case_id = ca.id AND te.deleted_at IS NULL
      WHERE e.id = $1 AND e.deleted_at IS NULL
      GROUP BY e.id, c.name, c.email, c.phone, c.company, u.name, u.email, creator.name`,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Engagement not found' },
        { status: 404 }
      );
    }

    const casesResult = await query(
      `SELECT 
        ca.*,
        ct.name as case_type_name,
        COUNT(DISTINCT te.id) as time_entry_count,
        SUM(te.hours) as total_hours,
        SUM(te.billable_amount) as total_billed
      FROM cases ca
      LEFT JOIN case_types ct ON ca.case_type_id = ct.id
      LEFT JOIN time_entries te ON te.case_id = ca.id AND te.deleted_at IS NULL
      WHERE ca.engagement_id = $1 AND ca.deleted_at IS NULL
      GROUP BY ca.id, ct.name
      ORDER BY ca.created_at DESC`,
      [id]
    );

    const engagement = {
      ...result.rows[0],
      cases: casesResult.rows
    };

    return NextResponse.json({
      success: true,
      data: engagement
    });

  } catch (error) {
    console.error('Error fetching engagement:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch engagement' },
      { status: 500 }
    );
  }
}

export async function PATCH(request, { params }) {
  const client = await getClient();
  
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.authenticated) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;
    const body = await request.json();

    const allowedFields = [
      'title', 'description', 'engagement_type', 'status',
      'start_date', 'end_date', 'estimated_hours', 'hourly_rate', 'assigned_to'
    ];

    const updates = [];
    const values = [];
    let paramCount = 1;

    for (const [key, value] of Object.entries(body)) {
      if (allowedFields.includes(key)) {
        updates.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    updates.push(`updated_at = NOW()`);
    values.push(id);

    await client.query('BEGIN');

    const result = await client.query(
      `UPDATE engagements 
       SET ${updates.join(', ')}
       WHERE id = $${paramCount} AND deleted_at IS NULL
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json(
        { success: false, error: 'Engagement not found' },
        { status: 404 }
      );
    }

    await client.query(
      `INSERT INTO audit_logs (
        user_id, action, entity_type, entity_id, details, created_at
      ) VALUES ($1, $2, $3, $4, $5, NOW())`,
      [
        authResult.user.id,
        'UPDATE',
        'engagement',
        id,
        JSON.stringify(body)
      ]
    );

    await client.query('COMMIT');

    return NextResponse.json({
      success: true,
      data: result.rows[0],
      message: 'Engagement updated successfully'
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating engagement:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update engagement' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

export async function DELETE(request, { params }) {
  const client = await getClient();
  
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.authenticated) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;

    await client.query('BEGIN');

    const result = await client.query(
      `UPDATE engagements 
       SET deleted_at = NOW()
       WHERE id = $1 AND deleted_at IS NULL
       RETURNING id`,
      [id]
    );

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json(
        { success: false, error: 'Engagement not found' },
        { status: 404 }
      );
    }

    await client.query(
      `INSERT INTO audit_logs (
        user_id, action, entity_type, entity_id, details, created_at
      ) VALUES ($1, $2, $3, $4, $5, NOW())`,
      [
        authResult.user.id,
        'DELETE',
        'engagement',
        id,
        JSON.stringify({ soft_delete: true })
      ]
    );

    await client.query('COMMIT');

    return NextResponse.json({
      success: true,
      message: 'Engagement deleted successfully'
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting engagement:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete engagement' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}