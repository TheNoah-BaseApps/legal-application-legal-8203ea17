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
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let sql = `
      SELECT 
        i.*,
        cl.name as client_name,
        cl.email as client_email,
        cl.company as client_company,
        e.title as engagement_title,
        COUNT(DISTINCT te.id) as time_entry_count,
        SUM(te.hours) as total_hours,
        creator.name as created_by_name
      FROM invoices i
      LEFT JOIN clients cl ON i.client_id = cl.id
      LEFT JOIN engagements e ON i.engagement_id = e.id
      LEFT JOIN time_entries te ON te.invoice_id = i.id
      LEFT JOIN users creator ON i.created_by = creator.id
      WHERE i.deleted_at IS NULL
    `;

    const params = [];
    let paramCount = 1;

    if (clientId) {
      sql += ` AND i.client_id = $${paramCount}`;
      params.push(clientId);
      paramCount++;
    }

    if (status) {
      sql += ` AND i.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (startDate) {
      sql += ` AND i.invoice_date >= $${paramCount}`;
      params.push(startDate);
      paramCount++;
    }

    if (endDate) {
      sql += ` AND i.invoice_date <= $${paramCount}`;
      params.push(endDate);
      paramCount++;
    }

    sql += `
      GROUP BY i.id, cl.name, cl.email, cl.company, e.title, creator.name
      ORDER BY i.invoice_date DESC, i.invoice_number DESC
    `;

    const result = await query(sql, params);

    const statsResult = await query(
      `SELECT 
        COUNT(*) as total_invoices,
        COUNT(*) FILTER (WHERE status = 'draft') as draft,
        COUNT(*) FILTER (WHERE status = 'sent') as sent,
        COUNT(*) FILTER (WHERE status = 'paid') as paid,
        COUNT(*) FILTER (WHERE status = 'overdue') as overdue,
        SUM(total_amount) as total_amount,
        SUM(CASE WHEN status = 'paid' THEN total_amount ELSE 0 END) as paid_amount,
        SUM(CASE WHEN status IN ('sent', 'overdue') THEN total_amount ELSE 0 END) as outstanding_amount
      FROM invoices
      WHERE deleted_at IS NULL
        ${clientId ? `AND client_id = '${clientId}'` : ''}
        ${startDate ? `AND invoice_date >= '${startDate}'` : ''}
        ${endDate ? `AND invoice_date <= '${endDate}'` : ''}
    `);

    return NextResponse.json({
      success: true,
      data: result.rows,
      stats: statsResult.rows[0],
      count: result.rows.length
    });

  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch invoices' },
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
      engagement_id,
      invoice_number,
      invoice_date,
      due_date,
      line_items,
      time_entry_ids,
      subtotal,
      tax_rate = 0,
      tax_amount = 0,
      discount_amount = 0,
      total_amount,
      notes,
      terms,
      status = 'draft'
    } = body;

    if (!client_id || !invoice_date || !total_amount) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: client_id, invoice_date, total_amount' },
        { status: 400 }
      );
    }

    await client.query('BEGIN');

    let finalInvoiceNumber = invoice_number;
    if (!finalInvoiceNumber) {
      const lastInvoiceResult = await client.query(
        `SELECT invoice_number FROM invoices 
         WHERE invoice_number ~ '^INV-[0-9]+$'
         ORDER BY created_at DESC LIMIT 1`
      );
      
      if (lastInvoiceResult.rows.length > 0) {
        const lastNumber = parseInt(lastInvoiceResult.rows[0].invoice_number.split('-')[1]);
        finalInvoiceNumber = `INV-${String(lastNumber + 1).padStart(5, '0')}`;
      } else {
        finalInvoiceNumber = 'INV-00001';
      }
    }

    const insertResult = await client.query(
      `INSERT INTO invoices (
        client_id, engagement_id, invoice_number, invoice_date, due_date,
        line_items, subtotal, tax_rate, tax_amount, discount_amount,
        total_amount, notes, terms, status, created_by,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW(), NOW())
      RETURNING *`,
      [
        client_id, engagement_id, finalInvoiceNumber, invoice_date, due_date,
        line_items ? JSON.stringify(line_items) : null,
        subtotal, tax_rate, tax_amount, discount_amount,
        total_amount, notes, terms, status, authResult.user.id
      ]
    );

    const invoice = insertResult.rows[0];

    if (time_entry_ids && time_entry_ids.length > 0) {
      await client.query(
        `UPDATE time_entries 
         SET invoice_id = $1, updated_at = NOW()
         WHERE id = ANY($2::uuid[])`,
        [invoice.id, time_entry_ids]
      );
    }

    await client.query(
      `INSERT INTO audit_logs (
        user_id, action, entity_type, entity_id, details, created_at
      ) VALUES ($1, $2, $3, $4, $5, NOW())`,
      [
        authResult.user.id,
        'CREATE',
        'invoice',
        invoice.id,
        JSON.stringify({ invoice_number: finalInvoiceNumber, total_amount })
      ]
    );

    await client.query('COMMIT');

    return NextResponse.json({
      success: true,
      data: invoice,
      message: 'Invoice created successfully'
    }, { status: 201 });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating invoice:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create invoice' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}