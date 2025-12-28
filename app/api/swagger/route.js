import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    // Always load from pre-generated file (production mode by default)
    const filePath = path.join(process.cwd(), 'public', 'swagger.json');
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const spec = JSON.parse(fileContents);
    
    return NextResponse.json(spec);
  } catch (error) {
    console.error('Error loading Swagger spec:', error);
    return NextResponse.json(
      { error: 'Failed to load API documentation' },
      { status: 500 }
    );
  }
}