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
        i.*,
        cl.name as client_name,
        cl.email as client_email,
        cl.phone as client_phone,
        cl.company as client_company,
        cl.address as client_address,
        e.title as engagement_title,
        e.engagement_type,
        creator.name as created_by_name,
        creator.email as created_by_email
      FROM invoices i
      LEFT JOIN clients cl ON i.client_id = cl.id
      LEFT JOIN engagements e ON i.engagement_id = e.id
      LEFT JOIN users creator ON i.created_by = creator.id
      WHERE i.id = $1 AND i.deleted_at IS NULL`,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Invoice not found' },
        { status: 404 }
      );
    }

    const timeEntriesResult = await query(
      `SELECT 
        te.*,
        u.name as user_name,
        c.case_number,
        c.title as case_title
      FROM time_entries te
      LEFT JOIN users u ON te.user_id = u.id
      LEFT JOIN cases c ON te.case_id = c.id
      WHERE te.invoice_id = $1 AND te.deleted_at IS NULL
      ORDER BY te.date, te.created_at`,
      [id]
    );

    const paymentsResult = await query(
      `SELECT *
       FROM payments
       WHERE invoice_id = $1 AND deleted_at IS NULL
       ORDER BY payment_date DESC`,
      [id]
    );

    const invoice = {
      ...result.rows[0],
      time_entries: timeEntriesResult.rows,
      payments: paymentsResult.rows,
      total_paid: paymentsResult.rows.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0)
    };

    return NextResponse.json({
      success: true,
      data: invoice
    });

  } catch (error) {
    console.error('Error fetching invoice:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch invoice' },
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
      'invoice_date', 'due_date', 'line_items', 'subtotal',
      'tax_rate', 'tax_amount', 'discount_amount', 'total_amount',
      'notes', 'terms', 'status', 'sent_at', 'paid_at'
    ];

    const updates = [];
    const values = [];
    let paramCount = 1;

    for (const [key, value] of Object.entries(body)) {
      if (allowedFields.includes(key)) {
        if (key === 'line_items' && value) {
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

    if (body.status === 'sent' && !body.sent_at) {
      updates.push(`sent_at = NOW()`);
    }

    if (body.status === 'paid' && !body.paid_at) {
      updates.push(`paid_at = NOW()`);
    }

    updates.push(`updated_at = NOW()`);
    values.push(id);

    await client.query('BEGIN');

    const result = await client.query(
      `UPDATE invoices 
       SET ${updates.join(', ')}
       WHERE id = $${paramCount} AND deleted_at IS NULL
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json(
        { success: false, error: 'Invoice not found' },
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
        'invoice',
        id,
        JSON.stringify(body)
      ]
    );

    await client.query('COMMIT');

    return NextResponse.json({
      success: true,
      data: result.rows[0],
      message: 'Invoice updated successfully'
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating invoice:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update invoice' },
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

    const checkResult = await client.query(
      `SELECT status FROM invoices WHERE id = $1 AND deleted_at IS NULL`,
      [id]
    );

    if (checkResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json(
        { success: false, error: 'Invoice not found' },
        { status: 404 }
      );
    }

    if (checkResult.rows[0].status === 'paid') {
      await client.query('ROLLBACK');
      return NextResponse.json(
        { success: false, error: 'Cannot delete a paid invoice' },
        { status: 400 }
      );
    }

    await client.query(
      `UPDATE time_entries 
       SET invoice_id = NULL, updated_at = NOW()
       WHERE invoice_id = $1`,
      [id]
    );

    await client.query(
      `UPDATE invoices 
       SET deleted_at = NOW()
       WHERE id = $1`,
      [id]
    );

    await client.query(
      `INSERT INTO audit_logs (
        user_id, action, entity_type, entity_id, details, created_at
      ) VALUES ($1, $2, $3, $4, $5, NOW())`,
      [
        authResult.user.id,
        'DELETE',
        'invoice',
        id,
        JSON.stringify({ soft_delete: true })
      ]
    );

    await client.query('COMMIT');

    return NextResponse.json({
      success: true,
      message: 'Invoice deleted successfully'
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting invoice:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete invoice' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}