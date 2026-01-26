# WMS Backend API

Work Management System Backend built with Node.js, Express.js, and MongoDB.

## Tech Stack

- Node.js
- Express.js
- MongoDB with Mongoose
- JWT Authentication
- bcryptjs for password hashing
- dotenv for configuration
- CORS enabled

## Project Structure

```
backend/
├── config/
│   ├── database.js       # MongoDB connection
│   └── jwt.js            # JWT token utilities
├── controllers/          # Business logic
├── middlewares/          # Authentication & error handling
├── models/              # MongoDB models
├── routes/              # API routes
├── utils/               # Utility functions
├── server.js            # Entry point
└── package.json
```

## Setup Instructions

1. **Install Dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Environment Variables**
   Create a `.env` file in the backend directory:
   ```
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb+srv://databaseconnection2512_db_user:HzvXeNFFqGns5ksr@wms.xl7sjo4.mongodb.net/?appName=WMS
   JWT_SECRET=your-super-secret-jwt-key-change-in-production-min-32-chars
   JWT_EXPIRE=7d
   FRONTEND_URL=http://localhost:5173
   
   # Brevo (formerly Sendinblue) SMTP Configuration
   BREVO_SMTP_HOST=smtp-relay.brevo.com
   BREVO_SMTP_PORT=587
   BREVO_SMTP_USER=your-brevo-smtp-email@example.com
   BREVO_SMTP_PASS=your-brevo-smtp-password
   ```
   
   **Note:** 
   - Change `JWT_SECRET` to a strong random string in production (minimum 32 characters).
   - Get your Brevo SMTP credentials from your Brevo account dashboard.
   - Update `FRONTEND_URL` to match your frontend URL in production.

3. **Create First Admin User (Optional)**
   ```bash
   npm run seed:admin
   ```
   This creates an admin user with:
   - Email: admin@wms.com
   - Password: admin123
   - **⚠️ Change password after first login!**

4. **Run Server**
   ```bash
   npm start
   # or for development with auto-reload
   npm run dev
   ```

The server will run on `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user (Admin only)
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/forgot-password` - Request password reset (sends email)
- `POST /api/auth/reset-password/:token` - Reset password with token

### Quotations
- `POST /api/quotations` - Create quotation
- `GET /api/quotations` - Get all quotations
- `GET /api/quotations/:id` - Get single quotation
- `PUT /api/quotations/:id` - Update quotation
- `DELETE /api/quotations/:id` - Delete quotation

### Orders
- `POST /api/orders` - Create order
- `GET /api/orders` - Get all orders (query: ?status=Open)
- `GET /api/orders/:id` - Get single order
- `PUT /api/orders/:id` - Update order
- `PUT /api/orders/:id/status` - Update order status

### Work Orders
- `POST /api/workorders` - Create work order
- `GET /api/workorders` - Get all work orders (query: ?orderId=, ?status=)
- `GET /api/workorders/:id` - Get single work order

### Job Cards (Inhouse)
- `POST /api/jobcards` - Create job card
- `GET /api/jobcards` - Get all job cards (query: ?workOrderId=, ?status=)
- `PUT /api/jobcards/:id/status` - Update job card status

### Job Work (Outside)
- `POST /api/jobwork` - Create job work
- `GET /api/jobwork` - Get all job works (query: ?workOrderId=, ?status=)
- `PUT /api/jobwork/:id/receive` - Receive job work

### Inward
- `POST /api/inward` - Create inward (job work return)

### Internal Process
- `POST /api/internal-process` - Create internal process
- `GET /api/internal-process/:orderId` - Get internal process
- `PUT /api/internal-process/:orderId` - Update internal process step

### Inspection
- `POST /api/inspection` - Create inspection
- `GET /api/inspection` - Get all inspections
- `GET /api/inspection/:orderId` - Get inspection by order ID

### Completed Jobs
- `GET /api/completed-jobs` - Get all completed jobs
- `GET /api/completed-jobs/:id` - Get single completed job
- `PUT /api/completed-jobs/:id/ready` - Mark as ready for dispatch

### Dispatch
- `POST /api/dispatch` - Create dispatch
- `GET /api/dispatch/history` - Get dispatch history (query: ?startDate=, ?endDate=)
- `GET /api/dispatch/:orderId` - Get dispatch by order ID

### Masters
- `POST /api/masters/:type` - Create master (type: Customer, Vendor, Process, Transport)
- `GET /api/masters/:type` - Get all masters by type (query: ?isActive=true)
- `PUT /api/masters/:type/:id` - Update master
- `DELETE /api/masters/:type/:id` - Delete master

### Reports
- `GET /api/reports/orders` - Orders report (query: ?startDate=, ?endDate=, ?status=)
- `GET /api/reports/production` - Production report (query: ?startDate=, ?endDate=)
- `GET /api/reports/vendor` - Vendor report (query: ?vendorName=, ?startDate=, ?endDate=)
- `GET /api/reports/dispatch` - Dispatch report (query: ?startDate=, ?endDate=, ?transportName=)

### Settings
- `GET /api/settings` - Get settings
- `PUT /api/settings` - Update settings

## Authentication

Most endpoints require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Features

- ✅ JWT-based authentication
- ✅ Password reset via email (Brevo/Sendinblue)
- ✅ Role-based access control (Admin, Staff)
- ✅ MongoDB database with Mongoose
- ✅ Audit logging for all operations
- ✅ Automatic ID generation
- ✅ Error handling middleware
- ✅ CORS enabled
- ✅ Environment variable configuration
- ✅ Request validation
- ✅ Timestamps and audit fields (createdBy, updatedBy)

## Database Models

- User
- Quotation
- Order
- WorkOrder
- JobCard
- JobWork
- InternalProcess
- Inspection
- CompletedJob
- Dispatch
- Master (Customer, Vendor, Process, Transport)
- Settings
- AuditLog

## Workflow

1. **Quotation** → Create quotation with pricing
2. **Order** → Convert quotation to order
3. **Work Order** → Create work order (Inhouse/Outside)
4. **Job Card/Job Work** → Track production processes
5. **Internal Process** → Track internal steps (Balancing, Cleaning, Assembly, Packaging)
6. **Inspection** → Quality inspection
7. **Completed Jobs** → Jobs ready for dispatch
8. **Dispatch** → Final dispatch to customer

## Notes

- All timestamps are automatically handled by Mongoose
- Audit logging is integrated throughout
- Order status changes are validated (cannot close without work orders)
- Internal processes must be completed in sequence
- Job work status auto-updates based on received quantity
