/**
 * @swagger
 * /api/cases/{id}:
 *   get:
 *     summary: Get case by ID
 *     tags: [Cases]
 *     responses:
 *       200:
 *         description: Case details
 *   put:
 *     summary: Update case
 *     tags: [Cases]
 *     responses:
 *       200:
 *         description: Case updated
 *   delete:
 *     summary: Delete case
 *     tags: [Cases]
 *     responses:
 *       200:
 *         description: Case deleted
 */

import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { query } from '@/lib/db';
import { createAuditLog } from '@/lib/audit';

export async function GET(request, { params }) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const result = await query(
      `SELECT c.*, cu.customer_name as client_name, u.name as attorney_name
       FROM cases c
       LEFT JOIN customers cu ON c.client_id = cu.id
       LEFT JOIN users u ON c.assigned_attorney = u.id
       WHERE c.id = $1`,
      [params.id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Case not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Get case error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch case' },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
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

    const result = await query(
      `UPDATE cases SET
        case_title = $1,
        client_id = $2,
        case_type = $3,
        case_status = $4,
        assigned_attorney = $5,
        filing_date = $6,
        court_name = $7,
        hearing_date = $8,
        description = $9,
        priority = $10,
        estimated_value = $11,
        updated_at = NOW()
      WHERE id = $12
      RETURNING *`,
      [
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
        params.id,
      ]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Case not found' },
        { status: 404 }
      );
    }

    await createAuditLog({
      userId: user.userId,
      action: 'CASE_UPDATED',
      entityType: 'case',
      entityId: params.id,
      changes: body,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
    });

    return NextResponse.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Update case error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update case' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const result = await query(
      `UPDATE cases SET case_status = 'Archived', updated_at = NOW() 
       WHERE id = $1 RETURNING *`,
      [params.id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Case not found' },
        { status: 404 }
      );
    }

    await createAuditLog({
      userId: user.userId,
      action: 'CASE_DELETED',
      entityType: 'case',
      entityId: params.id,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
    });

    return NextResponse.json({
      success: true,
      message: 'Case archived successfully',
    });
  } catch (error) {
    console.error('Delete case error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete case' },
      { status: 500 }
    );
  }
}