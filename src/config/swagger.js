const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Healthcare Platform API',
      version: '1.0.0',
      description:
        'REST API for a healthcare platform — patient appointments, prescriptions, pharmacy orders, and delivery.',
      contact: {
        name: 'Healthcare Platform',
        email: 'support@healthcareplatform.com',
      },
    },
    servers: [
      { url: 'http://localhost:8000/api/v1', description: 'Development' },
      { url: 'https://api.healthcareplatform.com/api/v1', description: 'Production' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: [
    './src/modules/**/*.routes.js',
    './src/modules/**/*.swagger.js'
  ],
};

const swaggerSpec = swaggerJsdoc(options);
module.exports = swaggerSpec;