import { query } from '@/lib/database/aurora';

export async function logAudit({
  userId,
  action,
  resourceType,
  resourceId,
  details = {},
  ipAddress = null,
  userAgent = null
}) {
  try {
    const auditQuery = `
      INSERT INTO audit_logs 
      (user_id, action, resource_type, resource_id, details, ip_address, user_agent, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      RETURNING id
    `;
    
    const result = await query(auditQuery, [
      userId,
      action,
      resourceType,
      resourceId,
      JSON.stringify(details),
      ipAddress,
      userAgent
    ]);
    
    return result.rows[0];
  } catch (error) {
    console.error('Audit logging error:', error);
    // Don't throw - audit logging should not break main functionality
    return null;
  }
}

export async function getAuditLogs({
  userId = null,
  resourceType = null,
  resourceId = null,
  action = null,
  startDate = null,
  endDate = null,
  limit = 100,
  offset = 0
}) {
  try {
    let conditions = [];
    let params = [];
    let paramIndex = 1;
    
    if (userId) {
      conditions.push(`user_id = $${paramIndex++}`);
      params.push(userId);
    }
    
    if (resourceType) {
      conditions.push(`resource_type = $${paramIndex++}`);
      params.push(resourceType);
    }
    
    if (resourceId) {
      conditions.push(`resource_id = $${paramIndex++}`);
      params.push(resourceId);
    }
    
    if (action) {
      conditions.push(`action = $${paramIndex++}`);
      params.push(action);
    }
    
    if (startDate) {
      conditions.push(`created_at >= $${paramIndex++}`);
      params.push(startDate);
    }
    
    if (endDate) {
      conditions.push(`created_at <= $${paramIndex++}`);
      params.push(endDate);
    }
    
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    
    const auditQuery = `
      SELECT * FROM audit_logs
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex}
    `;
    
    params.push(limit, offset);
    
    const result = await query(auditQuery, params);
    return result.rows;
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    throw error;
  }
}