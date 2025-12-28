const swaggerJsdoc = require('swagger-jsdoc');
const fs = require('fs');
const path = require('path');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Application API Documentation',
      version: '1.0.0',
      description: 'API documentation for the generated application',
      contact: {
        name: 'API Support',
      },
    },
    servers: [
      {
        url: process.env.NEXT_PUBLIC_APP_URL || 'https://your-production-url.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
        apiKey: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key',
        },
      },
    },
    security: [],
  },
  apis: ['./app/api/**/*.js', './app/api/**/*.ts'],
};

const swaggerSpec = swaggerJsdoc(options);

// Write to public directory
const outputPath = path.join(process.cwd(), 'public', 'swagger.json');
const publicDir = path.dirname(outputPath);

// Create public directory if it doesn't exist
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

fs.writeFileSync(outputPath, JSON.stringify(swaggerSpec, null, 2));

console.log('Swagger spec generated at public/swagger.json');