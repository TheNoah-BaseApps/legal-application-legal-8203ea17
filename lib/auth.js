import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export async function verifyAuth(request) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { authorized: false, error: 'No token provided' };
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET);
    
    return { authorized: true, user: decoded };
  } catch (error) {
    return { authorized: false, error: 'Invalid token' };
  }
}

export function requireAuth(handler) {
  return async (request, context) => {
    const auth = await verifyAuth(request);
    
    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.error || 'Unauthorized' },
        { status: 401 }
      );
    }
    
    request.user = auth.user;
    return handler(request, context);
  };
}

export function requireRole(roles) {
  return (handler) => {
    return async (request, context) => {
      const auth = await verifyAuth(request);
      
      if (!auth.authorized) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
      
      if (!roles.includes(auth.user.role)) {
        return NextResponse.json(
          { error: 'Forbidden - Insufficient permissions' },
          { status: 403 }
        );
      }
      
      request.user = auth.user;
      return handler(request, context);
    };
  };
}