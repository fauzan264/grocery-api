# Grocery Backend API

Backend API for an grocery application built with Express.js, TypeScript, Prisma ORM, and PostgreSQL.

## Table of Contents

- [Key Features](#key-features)
- [Technologies](#technologies)
- [Folder Structure](#folder-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Configuration](#environment-configuration)
- [Running the Application](#running-the-application)
- [Database Schema](#database-schema)
- [Cron Jobs](#cron-jobs)
- [Middleware](#middleware)

## Key Features

**Authentication & Authorization**

- JWT-based authentication
- Google OAuth integration
- Role-based access control (Admin, Customer)
- Email verification
- Password reset functionality

**Grocery Core**

- Product management with categories
- Shopping cart functionality
- Order processing
- Payment integration with Midtrans
- Stock management
- Shipping management
- Discount system

**Admin Features**

- Order management
- Store management
- Report generation
- Product & category management

**File Management**

- Cloudinary integration for image upload
- Multer for handling file uploads

**Email Services**

- Nodemailer with Google App Password
- Email templates with Handlebars
- Verification & reset password emails

**Automated Tasks**

- Cron jobs for transaction confirmation
- Auto-expire for pending transactions

## Technologies

### Core

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **TypeScript** - Programming language
- **Prisma ORM** - Database ORM
- **PostgreSQL** - Database (via Supabase)

### Authentication & Security

- **jsonwebtoken** - JWT implementation
- **bcrypt** - Password hashing
- **googleapis** - Google OAuth
- **helmet** - Security headers
- **express-rate-limit** - Rate limiting

### File & Media

- **cloudinary** - Cloud storage for images
- **multer** - File upload handling
- **streamifier** - Stream utility

### Utilities

- **nodemailer** - Email sending
- **handlebars** - Email templates
- **node-cron** - Scheduled tasks
- **yup** - Validation schema
- **luxon** - Date/time manipulation
- **uuid** - Unique ID generation
- **slugify** - URL-friendly strings

### Payment

- **midtrans-client** - Payment gateway integration

## Folder Structure

```
backend/
├── src/
│   ├── controllers/          # Route controllers
│   ├── db/                   # Database connection
│   │   └── connection.ts
│   ├── jobs/                 # Cron jobs
│   │   └── cron/
│   │       ├── confirm.transaction.job.ts
│   │       ├── confirm.transaction.schedule.ts
│   │       ├── expiry.transaction.job.ts
│   │       └── expiry.transaction.schedule.ts
│   ├── lib/                  # Utility libraries
│   │   ├── auth.google.ts
│   │   ├── cloudinary.upload.ts
│   │   ├── jwt.sign.ts
│   │   └── transporter.ts
│   ├── middlewares/          # Express middlewares
│   │   ├── auth.middleware.ts
│   │   ├── authorizeRoles.middleware.ts
│   │   ├── authorizeStore.middleware.ts
│   │   ├── error.handler.ts
│   │   ├── jwt.verify.ts
│   │   ├── multer.middleware.ts
│   │   ├── orderId.middleware.ts
│   │   ├── rate.limiter.ts
│   │   ├── role.verify.ts
│   │   ├── uploader.multer.ts
│   │   └── validateYup.ts
│   ├── public/               # Static files
│   │   ├── reset-password.html
│   │   └── verify-email.html
│   ├── routes/               # API routes
│   │   ├── auth.router.ts
│   │   ├── cart.router.ts
│   │   ├── categories.router.ts
│   │   ├── index.router.ts
│   │   ├── order.router.ts
│   │   ├── orderAdmin.router.ts
│   │   ├── payment.router.ts
│   │   ├── product.router.ts
│   │   ├── public.router.ts
│   │   ├── reportRoutes.ts
│   │   ├── shipping.router.ts
│   │   ├── stock.router.ts
│   │   ├── store.router.ts
│   │   ├── upload.router.ts
│   │   └── user.router.ts
│   ├── scripts/              # Utility scripts
│   │   └── generateToken.ts
│   ├── seed/                 # Database seeding
│   │   └── seed.ts
│   ├── services/             # Business logic
│   │   ├── adminOrder.service.ts
│   │   ├── auth.service.ts
│   │   ├── cart.service.ts
│   │   ├── category.service.ts
│   │   ├── discount.service.ts
│   │   ├── orders.service.ts
│   │   ├── payment.service.ts
│   │   ├── product.service.ts
│   │   ├── public.service.ts
│   │   ├── report.service.ts
│   │   ├── shipping.service.ts
│   │   ├── stock.service.ts
│   │   ├── store.service.ts
│   │   └── user.service.ts
│   ├── types/                # TypeScript type definitions
│   │   ├── auth.ts
│   │   ├── cart.ts
│   │   ├── order.ts
│   │   ├── shipment.ts
│   │   ├── store.ts
│   │   └── user.ts
│   ├── utils/                # Utility functions
│   │   ├── cloudinary.ts
│   │   ├── date.ts
│   │   ├── pagination.ts
│   │   └── roles.util.ts
│   ├── validations/          # Validation schemas
│   │   ├── auth.validation.ts
│   │   ├── cart.validation.ts
│   │   ├── order.validation.ts
│   │   ├── store.validation.ts
│   │   ├── user.admin.validation.ts
│   │   └── user.validation.ts
│   └── index.ts              # Application entry point
├── prisma/
│   └── schema.prisma         # Prisma schema
├── .env                      # Environment variables
├── .env.example              # Environment variables example
├── .gitignore
├── nodemon.json
├── package.json
├── package-lock.json
└── tsconfig.json
```

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database (recommended using Supabase)
- Cloudinary account for image storage
- Google Cloud Console project (for OAuth)
- Midtrans account (for payment gateway)
- Gmail with App Password (for email service)

## Installation

**Clone repository**

```bash
git clone <repository-url>
cd backend
```

**Install dependencies**

```bash
npm install
```

**Setup database**

```bash
# Generate Prisma Client
npm run prisma:generate

# Run migrations
npx prisma migrate dev

# Seed database (optional)
npx prisma db seed
```

## Environment Configuration

Create a `.env` file in the root folder with the following configuration:

```env
# Database Connection
# Connection pooling for production
DATABASE_URL="postgresql://user:password@host:5432/database?pgbouncer=true"

# Direct connection for migrations
DIRECT_URL="postgresql://user:password@host:5432/database?schema=public"

# JWT Configuration
JWT_SECRET_KEY="your_secure_jwt_secret_key_min_32_characters"

# Google Gmail Configuration
GOOGLE_APP_PASSWORD="your_16_character_app_password"

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME="your_cloudinary_cloud_name"
CLOUDINARY_API_KEY="your_cloudinary_api_key"
CLOUDINARY_API_SECRET="your_cloudinary_api_secret"

# Google OAuth Configuration
GOOGLE_CLIENT_ID="your_client_id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your_google_client_secret"
GOOGLE_AUTH_CALLBACK="http://localhost:4000/api/auth/google/callback"

# Frontend URLs
LINK_RESET_PASSWORD="http://localhost:3000/reset-password"
LINK_VERIFICATION_EMAIL="http://localhost:3000/verify-email"
LINK_AUTH_SUCCESS="http://localhost:3000/auth-success"
LINK_AUTH_LOGIN="http://localhost:3000/login"

# Security
BCRYPT_SALT_ROUNDS=10
```

### Setup Guide for External Services

**PostgreSQL Database (Supabase)**

1. Create an account at [Supabase](https://supabase.com)
2. Create a new project
3. Get connection string from Settings > Database
4. Copy `DATABASE_URL` and `DIRECT_URL`

**Cloudinary**

1. Register at [Cloudinary](https://cloudinary.com)
2. From Dashboard, copy:
   - Cloud Name
   - API Key
   - API Secret

**Google OAuth & Gmail**

Google OAuth:

1. Open [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing project
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:4000/api/auth/google/callback`
6. Copy Client ID and Client Secret

Gmail App Password:

1. Enable 2FA on Google Account
2. Open Security Settings
3. Generate App Password
4. Copy 16-character password

**Midtrans Payment Gateway**

1. Register at [Midtrans](https://midtrans.com)
2. Get Server Key and Client Key
3. Configure in code as needed

## Running the Application

**Development Mode**

```bash
npm run dev
```

Server will run at `http://localhost:4000` with hot-reload using nodemon.

**Production Build**

```bash
# Build TypeScript to JavaScript
npm run build

# Run production server
npm start
```

**Database Commands**

```bash
# Generate Prisma Client
npm run prisma:generate

# Run migrations
npx prisma migrate dev

# Reset database
npx prisma migrate reset

# Seed database
npx prisma db seed

# Open Prisma Studio
npx prisma studio
```

## Database Schema

Database uses Prisma ORM with PostgreSQL. Main schemas include:

- **User** - User accounts (customer & admin)
- **Store** - Store information
- **Category** - Product categories
- **Product** - Products with inventory
- **Cart** - Shopping cart items
- **Order** - Customer orders
- **OrderItem** - Order line items
- **Payment** - Payment transactions
- **Shipment** - Shipping information
- **Stock** - Stock mutations

See `prisma/schema.prisma` file for complete schema details.

## Cron Jobs

The application runs automated tasks using node-cron:

**Confirm Transaction Job**

- Schedule: Every 1 hour
- Function: Auto-confirm orders that have been paid
- File: `src/jobs/cron/confirm.transaction.job.ts`

**Expire Transaction Job**

- Schedule: Every 30 minutes
- Function: Auto-cancel orders that exceed payment deadline
- File: `src/jobs/cron/expiry.transaction.job.ts`

## Middleware

**Security**

- helmet - Security headers
- cors - CORS configuration
- rate-limiter - Rate limiting to prevent abuse

**Authentication**

- auth.middleware - JWT verification
- jwt.verify - Token validation
- authorizeRoles - Role-based access control
- authorizeStore - Store authorization

**Validation**

- validateYup - Request validation with Yup schema
- multer.middleware - File upload validation

**Error Handling**

- error.handler - Global error handler

## Scripts

```bash
# Development
npm run dev              # Run with nodemon

# Production
npm run build           # Compile TypeScript
npm start              # Run compiled code

# Database
npm run prisma:generate # Generate Prisma Client
npx prisma migrate dev # Run migrations
npx prisma db seed     # Seed database
npx prisma studio      # Open Prisma Studio

# Utilities
npm run postinstall    # Auto-run after npm install
```

## Security Features

- JWT-based authentication with refresh token strategy
- Password hashing using bcrypt
- Rate limiting to prevent brute force
- Helmet for security headers
- Input validation with Yup
- Role-based access control (RBAC)
- SQL injection protection via Prisma ORM
- CORS configuration

## Email Templates

Email templates use Handlebars and are located in `src/public/`:

- `verify-email.html` - Email verification template
- `reset-password.html` - Password reset template
