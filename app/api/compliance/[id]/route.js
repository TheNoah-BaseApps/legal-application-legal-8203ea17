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
        comp.*,
        c.case_number,
        c.title as case_title,
        c.status as case_status,
        cl.name as client_name,
        cl.email as client_email,
        u.name as assigned_to_name,
        u.email as assigned_to_email,
        creator.name as created_by_name,
        creator.email as created_by_email
      FROM compliance_items comp
      LEFT JOIN cases c ON comp.case_id = c.id
      LEFT JOIN clients cl ON c.client_id = cl.id
      LEFT JOIN users u ON comp.assigned_to = u.id
      LEFT JOIN users creator ON comp.created_by = creator.id
      WHERE comp.id = $1 AND comp.deleted_at IS NULL`,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Compliance item not found' },
        { status: 404 }
      );
    }

    const historyResult = await query(
      `SELECT 
        al.*,
        u.name as user_name,
        u.email as user_email
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE al.entity_type = 'compliance_item' AND al.entity_id = $1
      ORDER BY al.created_at DESC
      LIMIT 50`,
      [id]
    );

    const complianceItem = {
      ...result.rows[0],
      history: historyResult.rows
    };

    return NextResponse.json({
      success: true,
      data: complianceItem
    });

  } catch (error) {
    console.error('Error fetching compliance item:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch compliance item' },
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
      'title', 'description', 'compliance_type', 'status', 'priority',
      'due_date', 'assigned_to', 'requirements', 'jurisdiction',
      'regulation_reference', 'completion_notes', 'completed_at'
    ];

    const updates = [];
    const values = [];
    let paramCount = 1;

    for (const [key, value] of Object.entries(body)) {
      if (allowedFields.includes(key)) {
        if (key === 'requirements' && value) {
          updates.push(`${key} = $${paramCount}`);
          values.push(JSON.stringify(value));
        } else {
          updates.push(`${key} = $${paramCount}`);
          values.push(value);
        }
        paramCount++;
      }
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    if (body.status === 'completed' && !body.completed_at) {
      updates.push(`completed_at = NOW()`);
    }

    updates.push(`updated_at = NOW()`);
    values.push(id);

    await client.query('BEGIN');

    const result = await client.query(
      `UPDATE compliance_items 
       SET ${updates.join(', ')}
       WHERE id = $${paramCount} AND deleted_at IS NULL
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json(
        { success: false, error: 'Compliance item not found' },
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
        'compliance_item',
        id,
        JSON.stringify(body)
      ]
    );

    await client.query('COMMIT');

    return NextResponse.json({
      success: true,
      data: result.rows[0],
      message: 'Compliance item updated successfully'
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating compliance item:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update compliance item' },
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
      `UPDATE compliance_items 
       SET deleted_at = NOW()
       WHERE id = $1 AND deleted_at IS NULL
       RETURNING id, title`,
      [id]
    );

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json(
        { success: false, error: 'Compliance item not found' },
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
        'compliance_item',
        id,
        JSON.stringify({ title: result.rows[0].title, soft_delete: true })
      ]
    );

    await client.query('COMMIT');

    return NextResponse.json({
      success: true,
      message: 'Compliance item deleted successfully'
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting compliance item:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete compliance item' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}