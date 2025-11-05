# Postman Setup Guide

This guide will help you configure Postman to test the Grocery API endpoints.

## Prerequisites

- Postman installed on your system
- Backend API running locally or on a server
- Frontend application running (optional, for testing integration)

## Importing Postman Collection

### Step 1: Import Collection

1. Open Postman
2. Click **Import** button in the top-left corner
3. Select the `grocery.postman_collection.json` file from your project
4. Click **Import**

The collection will be imported with all pre-configured endpoints organized by feature:

- Auth
- User
- Store
- Shipping
- Shopping Cart
- CheckOut and Order Tracking
- Order Management
- Product
- Categories
- Stock
- Public

## Environment Setup

### Creating a New Environment

1. Click on the **Environments** tab in the left sidebar
2. Click **Create Environment** or the **+** button
3. Name your environment (e.g., "Grocery Development" or "Grocery Local")

### Environment Variables

Configure the following variables in your Postman environment:

| Variable       | Description              | Example Value                           |
| -------------- | ------------------------ | --------------------------------------- |
| `base_url`     | Backend API base URL     | `http://localhost:4000/api`             |
| `int_base_url` | Frontend application URL | `http://localhost:3000/api`             |
| `token`        | JWT authentication token | (Will be set automatically after login) |

### Variable Configuration

**base_url**

- **Initial Value**: `http://localhost:4000/api`
- **Current Value**: `http://localhost:4000/api`
- **Description**: Backend API base URL with `/api` prefix

**int_base_url**

- **Initial Value**: `http://localhost:3000/api`
- **Current Value**: `http://localhost:3000/api`
- **Description**: Frontend application base URL

**token**

- **Initial Value**: (leave empty)
- **Current Value**: (leave empty)
- **Description**: JWT token for authenticated requests (automatically set after login)

### Usage in Requests

The imported collection already uses these variables in all requests. Once configured, the variables will work automatically:

**Example Requests:**

```
GET {{base_url}}/products
GET {{base_url}}/categories
POST {{base_url}}/auth/login
GET {{base_url}}/orders
```

**With Authentication:**

Most endpoints in the collection are already configured to use Bearer Token authentication with the `{{token}}` variable.

## Getting Started

### Step 1: Start Your Servers

Ensure both frontend and backend servers are running:

**Backend:**

```bash
cd backend
npm run dev
```

Server should be running at `http://localhost:4000`

**Frontend:**

```bash
cd grocery-app
npm run dev
```

Application should be running at `http://localhost:3000/api`

### Step 2: Select Environment

1. In Postman, select your environment from the dropdown in the top-right corner
2. Make sure "Grocery Development" (or your environment name) is selected

### Step 3: Test Connection

Test the connection with a public endpoint that doesn't require authentication:

**Request:** `GET {{base_url}}/products`

If successful, you should receive a response with product data.

### Step 4: Authenticate

To test authenticated endpoints, you need to login first:

**Request:** `POST {{base_url}}/auth/login`

The collection already has this endpoint configured with a test script that automatically saves the token.

**Body (JSON):**

```json
{
  "email": "user@example.com",
  "password": "your_password"
}
```

**Response:**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "email": "user@example.com",
    ...
  }
}
```

The token will be automatically saved to the `{{token}}` variable through the pre-configured test script:

```javascript
let jsonData = JSON.parse(responseBody);
console.log(jsonData.data.token);

pm.collectionVariables.set("token", jsonData.data.token);
```

### Step 5: Test Authenticated Endpoints

Now you can test any authenticated endpoint. The token will be automatically included in the Authorization header.

Example: `GET {{base_url}}/users/me`

## Available Endpoints

### Authentication

```
POST {{base_url}}/auth/register
POST {{base_url}}/auth/login
POST {{base_url}}/auth/verify-email
POST {{base_url}}/auth/request-reset-password
POST {{base_url}}/auth/reset-password
POST {{base_url}}/auth/change-password
POST {{base_url}}/auth/email/change
GET  {{base_url}}/auth/session
POST {{base_url}}/auth/validate
```

### User Management

```
GET    {{base_url}}/users/me
PUT    {{base_url}}/users/me
GET    {{base_url}}/users/:id
GET    {{base_url}}/users
POST   {{base_url}}/users/:user_id/addresses
GET    {{base_url}}/users/:user_id/addresses
PUT    {{base_url}}/users/:user_id/addresses/:address_id
DELETE {{base_url}}/users/:user_id/addresses/:address_id
```

### Store Management

```
GET    {{base_url}}/stores
GET    {{base_url}}/stores/:id
POST   {{base_url}}/stores
PUT    {{base_url}}/stores/:id
DELETE {{base_url}}/stores/:id
GET    {{base_url}}/stores/nearby
POST   {{base_url}}/stores/:id/assign-user
GET    {{base_url}}/stores/:id/assign-user
DELETE {{base_url}}/stores/:id/assign-user/:user_id
```

### Products

```
GET    {{base_url}}/products
GET    {{base_url}}/products/:id
POST   {{base_url}}/products (Admin)
PATCH  {{base_url}}/products/:id (Admin)
DELETE {{base_url}}/products/:id (Admin)
```

### Categories

```
GET    {{base_url}}/categories
GET    {{base_url}}/categories/:id
POST   {{base_url}}/categories (Admin)
PATCH  {{base_url}}/categories/:id (Admin)
DELETE {{base_url}}/categories/:id (Admin)
PATCH  {{base_url}}/categories/:id/restore (Admin)
GET    {{base_url}}/categories/:id/logs (Admin)
GET    {{base_url}}/categories/tree
```

### Shopping Cart

```
GET    {{base_url}}/cart/items
POST   {{base_url}}/cart/items
PATCH  {{base_url}}/cart/items
DELETE {{base_url}}/cart/items/:itemId
```

### Orders

```
POST   {{base_url}}/orders/checkout
GET    {{base_url}}/orders/me
GET    {{base_url}}/orders/:orderId/detail
PATCH  {{base_url}}/orders/:orderId/cancel
PATCH  {{base_url}}/orders/:orderId/confirm
```

### Payment

```
PATCH  {{base_url}}/payment/upload/:orderId
POST   {{base_url}}/payment/:orderId
POST   {{base_url}}/payment/midtrans/callback
```

### Admin - Order Management

```
GET    {{base_url}}/admin/orders
GET    {{base_url}}/admin/orders/:orderId
PATCH  {{base_url}}/admin/orders/confirmPayment/:orderId
PATCH  {{base_url}}/admin/orders/cancelOrder/:orderId
PATCH  {{base_url}}/admin/orders/sent/:orderId
```

### Stock Management

```
POST   {{base_url}}/stocks
POST   {{base_url}}/stocks/stores/:storeId
GET    {{base_url}}/stocks/stores/:storeId
GET    {{base_url}}/stocks/:id
GET    {{base_url}}/stocks/products/:productId
PATCH  {{base_url}}/stocks/:id
POST   {{base_url}}/stocks/transfer
```

### Shipping

```
GET    {{base_url}}/shipping/provinces
GET    {{base_url}}/shipping/provinces/:id
GET    {{base_url}}/shipping/cities/:province_id
GET    {{base_url}}/shipping/districts/:city_id
POST   {{int_base_url}}/api/shipping-cost
```

### Public Endpoints (No Auth Required)

```
GET    {{base_url}}/public/stores/nearby
GET    {{base_url}}/public/stores/:id
GET    {{base_url}}/public/products
GET    {{base_url}}/public/products/:id
```

## Testing Different User Roles

The application has three user roles with different permissions:

### SUPER_ADMIN

- Full access to all endpoints
- Can manage stores, users, products, categories, and orders
- Can view all data across all stores

### ADMIN_STORE

- Can manage assigned store(s)
- Can manage products and stock for their store
- Can view and process orders for their store
- Cannot access super admin functions

### CUSTOMER

- Can browse products
- Can manage their profile and addresses
- Can create orders and track their status
- Can manage their shopping cart

To test different roles:

1. Create users with different roles through registration or user creation endpoints
2. Login with each user to get their respective token
3. Test role-specific endpoints

## Tips

- **Select the correct environment** before making requests
- **The token is automatically saved** after login through the Login endpoint's test script
- **Check the Console tab** in Postman for detailed request/response information
- **Organize requests** using the pre-configured folders
- **Use the search function** (Ctrl/Cmd + K) to quickly find endpoints
- **Save responses** as examples for documentation purposes

## Troubleshooting

**Connection Refused Error:**

- Verify that the backend server is running on port 4000
- Check if the `base_url` variable is correctly set to `http://localhost:4000/api`

**401 Unauthorized Error:**

- Ensure you have a valid token by logging in first
- Check that the token is correctly set in the environment variables
- Verify that your user has the required role for the endpoint

**404 Not Found:**

- Double-check the endpoint URL
- Verify the `/api` prefix is included in `base_url`
- Make sure you're using the correct HTTP method
- Check if the resource ID in the URL is valid

**CORS Error:**

- This should not occur in Postman
- If it does, verify your backend CORS configuration

**Token Expired:**

- Login again to get a new token
- The token will be automatically refreshed in the environment

**Environment Variables Not Working:**

- Make sure you've selected the correct environment
- Check that variable names match exactly (case-sensitive)
- Verify there are no extra spaces in variable values

**File Upload Issues:**

- Ensure you're using `form-data` body type
- Select the correct file from your system
- Check file size limits in your backend configuration

## Collection Variables

The imported collection includes these pre-configured variables:

- `base_url`: `http://localhost:4000/api`
- `token`: (empty, will be set after login)

These are different from environment variables and are stored at the collection level. The `token` variable in the collection is automatically updated by the login endpoint's test script.
