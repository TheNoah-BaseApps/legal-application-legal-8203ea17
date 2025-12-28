# API Documentation Guide

This application includes built-in Swagger/OpenAPI documentation for all API endpoints.

## Viewing API Documentation

Access the interactive API documentation at: `http://your-app-url/api-docs`

## Adding Documentation to Your API Routes

Use JSDoc comments with Swagger annotations to document your API endpoints.

### Basic Example

```javascript
/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users
 *     description: Returns a list of all users
 *     tags:
 *       - Users
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   name:
 *                     type: string
 *                   email:
 *                     type: string
 */
export async function GET() {
  // Your API logic here
}
```

### POST Request with Body

```javascript
/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Create a new user
 *     tags:
 *       - Users
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Invalid input
 */
export async function POST(request) {
  // Your API logic here
}
```

### Authentication

If your API requires authentication, add security requirements:

```javascript
/**
 * @swagger
 * /api/protected:
 *   get:
 *     summary: Protected endpoint
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *       401:
 *         description: Unauthorized
 */
export async function GET() {
  // Your protected API logic here
}
```

### Path Parameters

```javascript
/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User found
 *       404:
 *         description: User not found
 */
export async function GET(request, { params }) {
  const { id } = params;
  // Your API logic here
}
```

### Query Parameters

```javascript
/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get users with filters
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Paginated users
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const page = searchParams.get("page") || 1;
  const limit = searchParams.get("limit") || 10;
  // Your API logic here
}
```

## Tags

Organize your endpoints using tags:

- **Users** - User management endpoints
- **Auth** - Authentication endpoints
- **Products** - Product-related endpoints
- **Orders** - Order management endpoints

## Testing APIs

1. Navigate to `/api-docs` in your browser
2. Expand any endpoint to see details
3. Click "Try it out" button
4. Fill in required parameters
5. Click "Execute" to test the API
6. View the response directly in the browser

## Configuration

The Swagger configuration is located in `lib/swagger.js`. You can modify:

- API title and description
- Server URLs
- Security schemes
- Global settings

## Best Practices

1. **Always document** - Add Swagger comments to all API routes
2. **Use examples** - Provide example values in schemas
3. **Tag consistently** - Use consistent tag names across related endpoints
4. **Describe errors** - Document all possible error responses
5. **Keep it updated** - Update documentation when changing APIs
6. **Test your docs** - Verify that the documentation matches actual behavior

## Additional Resources

- [Swagger/OpenAPI Specification](https://swagger.io/specification/)
- [swagger-jsdoc Documentation](https://github.com/Surnet/swagger-jsdoc)
- [Swagger UI Documentation](https://swagger.io/tools/swagger-ui/)
