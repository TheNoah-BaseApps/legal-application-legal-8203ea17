/**
 * @swagger
 * /api/cases/attorney/{userId}:
 *   get:
 *     summary: Get cases assigned to attorney
 *     tags: [Cases]
 *     responses:
 *       200:
 *         description: List of attorney cases
 */

import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(request, { params }) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const result = await query(
      `SELECT c.*, cu.customer_name as client_name
       FROM cases c
       LEFT JOIN customers cu ON c.client_id = cu.id
       WHERE c.assigned_attorney = $1
       ORDER BY c.created_at DESC`,
      [params.userId]
    );

    return NextResponse.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error('Get attorney cases error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch cases' },
      { status: 500 }
    );
  }
}