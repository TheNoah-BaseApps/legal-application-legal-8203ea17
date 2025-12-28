/**
 * @swagger
 * /api/cases:
 *   get:
 *     summary: Get all cases
 *     tags: [Cases]
 *     responses:
 *       200:
 *         description: List of cases
 *   post:
 *     summary: Create a new case
 *     tags: [Cases]
 *     responses:
 *       201:
 *         description: Case created
 */

import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { query } from '@/lib/db';
import { generateCaseId } from '@/lib/utils';
import { createAuditLog } from '@/lib/audit';

export async function GET(request) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');

    let sql = `
      SELECT c.*, cu.customer_name as client_name, u.name as attorney_name
      FROM cases c
      LEFT JOIN customers cu ON c.client_id = cu.id
      LEFT JOIN users u ON c.assigned_attorney = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (search) {
      sql += ` AND (c.case_title ILIKE $${paramCount} OR c.case_id ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }

    if (status) {
      sql += ` AND c.case_status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (priority) {
      sql += ` AND c.priority = $${paramCount}`;
      params.push(priority);
      paramCount++;
    }

    sql += ' ORDER BY c.created_at DESC';

    const result = await query(sql, params);

    return NextResponse.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error('Get cases error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch cases' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      case_title,
      client_id,
      case_type,
      case_status,
      assigned_attorney,
      filing_date,
      court_name,
      hearing_date,
      description,
      priority,
      estimated_value,
    } = body;

    if (!case_title || !client_id || !case_type) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const caseId = generateCaseId();

    const result = await query(
      `INSERT INTO cases (
        case_id, case_title, client_id, case_type, case_status,
        assigned_attorney, filing_date, court_name, hearing_date,
        description, priority, estimated_value, created_by, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())
      RETURNING *`,
      [
        caseId,
        case_title,
        client_id,
        case_type,
        case_status || 'New',
        assigned_attorney || null,
        filing_date || new Date().toISOString().split('T')[0],
        court_name || null,
        hearing_date || null,
        description || null,
        priority || 'Medium',
        estimated_value || null,
        user.userId,
      ]
    );

    await createAuditLog({
      userId: user.userId,
      action: 'CASE_CREATED',
      entityType: 'case',
      entityId: result.rows[0].id,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
    });

    return NextResponse.json(
      { success: true, data: result.rows[0] },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create case error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create case' },
      { status: 500 }
    );
  }
}