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
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const dueDate = searchParams.get('dueDate');

    let sql = `
      SELECT 
        comp.*,
        c.case_number,
        c.title as case_title,
        cl.name as client_name,
        u.name as assigned_to_name,
        u.email as assigned_to_email,
        creator.name as created_by_name
      FROM compliance_items comp
      LEFT JOIN cases c ON comp.case_id = c.id
      LEFT JOIN clients cl ON c.client_id = cl.id
      LEFT JOIN users u ON comp.assigned_to = u.id
      LEFT JOIN users creator ON comp.created_by = creator.id
      WHERE comp.deleted_at IS NULL
    `;

    const params = [];
    let paramCount = 1;

    if (caseId) {
      sql += ` AND comp.case_id = $${paramCount}`;
      params.push(caseId);
      paramCount++;
    }

    if (status) {
      sql += ` AND comp.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (priority) {
      sql += ` AND comp.priority = $${paramCount}`;
      params.push(priority);
      paramCount++;
    }

    if (dueDate === 'overdue') {
      sql += ` AND comp.due_date < NOW() AND comp.status != 'completed'`;
    } else if (dueDate === 'upcoming') {
      sql += ` AND comp.due_date BETWEEN NOW() AND NOW() + INTERVAL '7 days' AND comp.status != 'completed'`;
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

    const result = await query(sql, params);

    const statsResult = await query(
      `SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'pending') as pending,
        COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress,
        COUNT(*) FILTER (WHERE status = 'completed') as completed,
        COUNT(*) FILTER (WHERE due_date < NOW() AND status != 'completed') as overdue,
        COUNT(*) FILTER (WHERE priority = 'critical') as critical,
        COUNT(*) FILTER (WHERE priority = 'high') as high
      FROM compliance_items
      WHERE deleted_at IS NULL`
    );

    return NextResponse.json({
      success: true,
      data: result.rows,
      stats: statsResult.rows[0],
      count: result.rows.length
    });

  } catch (error) {
    console.error('Error fetching compliance items:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch compliance items' },
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
      title,
      description,
      compliance_type,
      status = 'pending',
      priority = 'medium',
      due_date,
      assigned_to,
      requirements,
      jurisdiction,
      regulation_reference
    } = body;

    if (!case_id || !title || !compliance_type) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: case_id, title, compliance_type' },
        { status: 400 }
      );
    }

    await client.query('BEGIN');

    const insertResult = await client.query(
      `INSERT INTO compliance_items (
        case_id, title, description, compliance_type, status, priority,
        due_date, assigned_to, requirements, jurisdiction, regulation_reference,
        created_by, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
      RETURNING *`,
      [
        case_id, title, description, compliance_type, status, priority,
        due_date, assigned_to, 
        requirements ? JSON.stringify(requirements) : null,
        jurisdiction, regulation_reference, authResult.user.id
      ]
    );

    const complianceItem = insertResult.rows[0];

    await client.query(
      `INSERT INTO audit_logs (
        user_id, action, entity_type, entity_id, details, created_at
      ) VALUES ($1, $2, $3, $4, $5, NOW())`,
      [
        authResult.user.id,
        'CREATE',
        'compliance_item',
        complianceItem.id,
        JSON.stringify({ title, compliance_type, priority })
      ]
    );

    await client.query('COMMIT');

    return NextResponse.json({
      success: true,
      data: complianceItem,
      message: 'Compliance item created successfully'
    }, { status: 201 });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating compliance item:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create compliance item' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}