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
    const clientId = searchParams.get('clientId');
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    let sql = `
      SELECT 
        d.*,
        c.case_number,
        c.title as case_title,
        cl.name as client_name,
        u.name as uploaded_by_name,
        u.email as uploaded_by_email
      FROM documents d
      LEFT JOIN cases c ON d.case_id = c.id
      LEFT JOIN clients cl ON d.client_id = cl.id
      LEFT JOIN users u ON d.uploaded_by = u.id
      WHERE d.deleted_at IS NULL
    `;

    const params = [];
    let paramCount = 1;

    if (caseId) {
      sql += ` AND d.case_id = $${paramCount}`;
      params.push(caseId);
      paramCount++;
    }

    if (clientId) {
      sql += ` AND d.client_id = $${paramCount}`;
      params.push(clientId);
      paramCount++;
    }

    if (category) {
      sql += ` AND d.category = $${paramCount}`;
      params.push(category);
      paramCount++;
    }

    if (search) {
      sql += ` AND (d.title ILIKE $${paramCount} OR d.description ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }

    sql += `
      ORDER BY d.created_at DESC
    `;

    const result = await query(sql, params);

    return NextResponse.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });

  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch documents' },
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
      client_id,
      title,
      description,
      file_name,
      file_path,
      file_type,
      file_size,
      category,
      tags,
      is_confidential = false
    } = body;

    if (!title || !file_name || !file_path) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: title, file_name, file_path' },
        { status: 400 }
      );
    }

    if (!case_id && !client_id) {
      return NextResponse.json(
        { success: false, error: 'Either case_id or client_id is required' },
        { status: 400 }
      );
    }

    await client.query('BEGIN');

    const insertResult = await client.query(
      `INSERT INTO documents (
        case_id, client_id, title, description, file_name, file_path,
        file_type, file_size, category, tags, is_confidential,
        uploaded_by, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
      RETURNING *`,
      [
        case_id, client_id, title, description, file_name, file_path,
        file_type, file_size, category, tags ? JSON.stringify(tags) : null,
        is_confidential, authResult.user.id
      ]
    );

    const document = insertResult.rows[0];

    await client.query(
      `INSERT INTO audit_logs (
        user_id, action, entity_type, entity_id, details, created_at
      ) VALUES ($1, $2, $3, $4, $5, NOW())`,
      [
        authResult.user.id,
        'CREATE',
        'document',
        document.id,
        JSON.stringify({ title, file_name, category })
      ]
    );

    await client.query('COMMIT');

    return NextResponse.json({
      success: true,
      data: document,
      message: 'Document uploaded successfully'
    }, { status: 201 });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error uploading document:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to upload document' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}