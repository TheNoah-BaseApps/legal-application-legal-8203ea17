import { NextResponse } from 'next/server';

/**
 * @swagger
 * /api/example:
 *   get:
 *     summary: Example GET endpoint
 *     description: Returns a sample response to demonstrate API structure
 *     tags:
 *       - Examples
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Hello from the API
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 data:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       example: success
 */
export async function GET() {
  return NextResponse.json({
    message: 'Hello from the API',
    timestamp: new Date().toISOString(),
    data: {
      status: 'success'
    }
  });
}

/**
 * @swagger
 * /api/example:
 *   post:
 *     summary: Example POST endpoint
 *     description: Accepts data and returns a confirmation
 *     tags:
 *       - Examples
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *     responses:
 *       200:
 *         description: Data received successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 receivedData:
 *                   type: object
 *       400:
 *         description: Invalid request data
 */
export async function POST(request) {
  try {
    const body = await request.json();
    
    if (!body.name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Data received successfully',
      receivedData: body
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid JSON' },
      { status: 400 }
    );
  }
}

