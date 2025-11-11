import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Multi-Shop Branch Management API',
      version: '1.0.0',
      description: 'RESTful API for managing multi-branch customer operations with role-based access control',
      contact: {
        name: 'API Support',
        email: 'support@multishop.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server'
      },
      {
        url: 'http://localhost:5000',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token in the format: Bearer <token>'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              example: 'Error message'
            },
            error: {
              type: 'string',
              example: 'Detailed error information'
            }
          }
        },
        Branch: {
          type: 'object',
          required: ['branch_name'],
          properties: {
            branch_id: {
              type: 'integer',
              description: 'Unique branch identifier',
              example: 1
            },
            branch_name: {
              type: 'string',
              description: 'Branch name',
              example: 'Jakarta Pusat Branch'
            },
            address: {
              type: 'string',
              description: 'Branch address',
              example: 'Jl. Sudirman No. 123, Jakarta Pusat'
            },
            phone_number: {
              type: 'string',
              description: 'Branch phone number',
              example: '+62 21 1234567'
            },
            manager_name: {
              type: 'string',
              description: 'Branch manager name',
              example: 'John Doe'
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Branch creation timestamp'
            }
          }
        },
        Customer: {
          type: 'object',
          required: ['branch_id', 'full_name', 'email', 'registration_date'],
          properties: {
            customer_id: {
              type: 'integer',
              description: 'Unique customer identifier',
              example: 1
            },
            branch_id: {
              type: 'integer',
              description: 'Associated branch ID',
              example: 1
            },
            full_name: {
              type: 'string',
              description: 'Customer full name',
              example: 'Jane Smith'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Customer email (unique globally)',
              example: 'jane.smith@example.com'
            },
            phone_number: {
              type: 'string',
              description: 'Customer phone number',
              example: '+62 812 3456789'
            },
            address: {
              type: 'string',
              description: 'Customer address',
              example: 'Jl. Thamrin No. 45, Jakarta'
            },
            registration_date: {
              type: 'string',
              format: 'date',
              description: 'Customer registration date',
              example: '2024-01-15'
            },
            status: {
              type: 'string',
              enum: ['Active', 'Inactive'],
              description: 'Customer status',
              example: 'Active'
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Record creation timestamp'
            }
          }
        },
        Staff: {
          type: 'object',
          required: ['branch_id', 'username', 'password', 'full_name'],
          properties: {
            staff_id: {
              type: 'integer',
              description: 'Unique staff identifier',
              example: 1
            },
            branch_id: {
              type: 'integer',
              description: 'Associated branch ID',
              example: 1
            },
            username: {
              type: 'string',
              description: 'Staff username (unique)',
              example: 'staff_jakarta'
            },
            password: {
              type: 'string',
              format: 'password',
              description: 'Staff password',
              example: 'SecurePass123!'
            },
            full_name: {
              type: 'string',
              description: 'Staff full name',
              example: 'Alice Johnson'
            },
            role: {
              type: 'string',
              enum: ['staff'],
              description: 'User role (always staff)',
              example: 'staff'
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Record creation timestamp'
            }
          }
        },
        User: {
          type: 'object',
          required: ['username', 'password', 'full_name'],
          properties: {
            user_id: {
              type: 'integer',
              description: 'Unique user identifier',
              example: 1
            },
            username: {
              type: 'string',
              description: 'Admin username (unique)',
              example: 'admin'
            },
            password: {
              type: 'string',
              format: 'password',
              description: 'Admin password (min 8 chars, 1 uppercase, 1 number, 1 special)',
              example: 'Admin@123'
            },
            full_name: {
              type: 'string',
              description: 'Admin full name',
              example: 'Super Admin'
            },
            role: {
              type: 'string',
              enum: ['admin'],
              description: 'User role (always admin)',
              example: 'admin'
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Record creation timestamp'
            }
          }
        },
        LoginRequest: {
          type: 'object',
          required: ['username', 'password'],
          properties: {
            username: {
              type: 'string',
              description: 'Username',
              example: 'admin'
            },
            password: {
              type: 'string',
              format: 'password',
              description: 'Password',
              example: 'Admin@123'
            }
          }
        },
        LoginResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              example: 'Login successful'
            },
            data: {
              type: 'object',
              properties: {
                accessToken: {
                  type: 'string',
                  description: 'JWT access token (expires in 15 minutes)'
                },
                refreshToken: {
                  type: 'string',
                  description: 'JWT refresh token (expires in 7 days)'
                },
                user: {
                  type: 'object',
                  properties: {
                    id: {
                      type: 'integer'
                    },
                    username: {
                      type: 'string'
                    },
                    full_name: {
                      type: 'string'
                    },
                    role: {
                      type: 'string',
                      enum: ['admin', 'staff']
                    },
                    branch_id: {
                      type: 'integer',
                      description: 'Only for staff users'
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ],
    tags: [
      {
        name: 'Authentication',
        description: 'Authentication and authorization endpoints'
      },
      {
        name: 'Branches',
        description: 'Branch management operations (Admin only)'
      },
      {
        name: 'Customers',
        description: 'Customer management operations (Branch-scoped)'
      },
      {
        name: 'Staff',
        description: 'Staff management operations (Admin only)'
      },
      {
        name: 'Users',
        description: 'Admin user management operations (Admin only)'
      },
      {
        name: 'Dashboard',
        description: 'Dashboard and analytics endpoints'
      }
    ]
  },
  apis: ['./routes/*.js', './server.js']
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
