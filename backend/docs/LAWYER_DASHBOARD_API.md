# Lawyer Dashboard API Documentation

## Overview
Complete Node.js/Express backend API for the Lawyer Dashboard with JWT authentication and role-based access control.

## Authentication
All endpoints require JWT authentication with lawyer role verification.

**Header Required:**
```
Authorization: Bearer <jwt_token>
```

## API Endpoints

### 1. GET /api/lawyer/dashboard/stats
**Purpose**: Get dashboard statistics for logged-in lawyer

**Authentication**: Required (JWT - Lawyer only)

**Response**:
```json
{
  "activeCases": 24,
  "totalClients": 156,
  "monthlyRevenue": 45230,
  "upcomingHearings": 8
}
```

### 2. GET /api/lawyer/cases
**Purpose**: Get all cases for logged-in lawyer

**Authentication**: Required (JWT - Lawyer only)

**Response**:
```json
[
  {
    "id": 1,
    "title": "Smith vs. Johnson",
    "type": "Personal Injury",
    "status": "active",
    "date": "2024-01-15",
    "client": "John Smith",
    "description": "Case description"
  }
]
```

### 3. POST /api/lawyer/cases
**Purpose**: Create new case

**Authentication**: Required (JWT - Lawyer only)

**Request Body**:
```json
{
  "title": "Case Title",
  "client": "Client Name",
  "type": "Personal Injury",
  "description": "Case description"
}
```

**Validation**:
- `title`, `client`, and `type` are required
- `description` is optional

**Success Response (200)**:
```json
{
  "message": "Case created successfully",
  "case": {
    "id": 4,
    "title": "Case Title",
    "client_name": "Client Name",
    "type": "Personal Injury",
    "status": "active",
    "description": "Case description",
    "created_date": "2024-01-25"
  }
}
```

**Error Response (400)**:
```json
{
  "message": "Title, client, and type are required"
}
```

### 4. GET /api/lawyer/clients
**Purpose**: Get all clients for logged-in lawyer

**Authentication**: Required (JWT - Lawyer only)

**Query Parameters**:
- `search` (optional): Filter clients by name

**Response**:
```json
[
  {
    "id": 1,
    "name": "John Smith",
    "email": "john@email.com",
    "phone": "(555) 123-4567",
    "casesCount": 2
  }
]
```

### 5. GET /api/lawyer/appointments
**Purpose**: Get calendar appointments

**Authentication**: Required (JWT - Lawyer only)

**Response**:
```json
[
  {
    "id": 1,
    "date": "2024-01-15",
    "title": "Court Hearing",
    "type": "hearing",
    "clientName": "John Smith"
  }
]
```

### 6. GET /api/lawyer/documents
**Purpose**: Get all documents

**Authentication**: Required (JWT - Lawyer only)

**Response**:
```json
[
  {
    "id": 1,
    "filename": "Contract_Smith.pdf",
    "uploadDate": "2024-01-15",
    "caseId": 1,
    "url": "/uploads/documents/..."
  }
]
```

### 7. GET /api/lawyer/invoices
**Purpose**: Get all invoices

**Authentication**: Required (JWT - Lawyer only)

**Response**:
```json
[
  {
    "id": 1,
    "invoiceNumber": "INV-001",
    "clientName": "John Smith",
    "amount": 2500,
    "status": "paid",
    "date": "2024-01-15"
  }
]
```

### 8. GET /api/lawyer/profile
**Purpose**: Get lawyer profile data

**Authentication**: Required (JWT - Lawyer only)

**Response**:
```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john@law.com",
  "role": "lawyer",
  "registration_id": "LAW12345"
}
```

## Database Schema

### Cases Table
```sql
CREATE TABLE cases (
  id INT PRIMARY KEY AUTO_INCREMENT,
  lawyer_id INT,
  title VARCHAR(255),
  client_name VARCHAR(255),
  type VARCHAR(100),
  status ENUM('active', 'pending', 'closed') DEFAULT 'active',
  description TEXT,
  created_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (lawyer_id) REFERENCES lawyers(id)
);
```

### Appointments Table
```sql
CREATE TABLE appointments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  lawyer_id INT,
  title VARCHAR(255),
  date DATE,
  type VARCHAR(50),
  client_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (lawyer_id) REFERENCES lawyers(id)
);
```

### Documents Table
```sql
CREATE TABLE documents (
  id INT PRIMARY KEY AUTO_INCREMENT,
  lawyer_id INT,
  case_id INT NULL,
  filename VARCHAR(255),
  file_path VARCHAR(500),
  upload_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (lawyer_id) REFERENCES lawyers(id),
  FOREIGN KEY (case_id) REFERENCES cases(id)
);
```

### Invoices Table
```sql
CREATE TABLE invoices (
  id INT PRIMARY KEY AUTO_INCREMENT,
  lawyer_id INT,
  invoice_number VARCHAR(50),
  client_name VARCHAR(255),
  amount DECIMAL(10,2),
  status ENUM('paid', 'pending', 'overdue') DEFAULT 'pending',
  created_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (lawyer_id) REFERENCES lawyers(id)
);
```

## Authentication & Authorization

### Login Redirect Logic
Updated login endpoint now includes role-based redirects:

```javascript
// In authController.js login function
if (isAdmin) {
  userResponse.redirect = '/admin-dashboard';
} else if (role === 'lawyer' || user.registration_id) {
  userResponse.redirect = '/lawyer-dashboard';
} else {
  userResponse.redirect = '/lawyer-directory';
}
```

### JWT Middleware
- `authenticateLawyer`: Verifies JWT token and ensures user is a lawyer
- Extracts lawyer ID from token for database queries
- Returns 401/403 for invalid tokens or non-lawyer users

## Error Handling
All endpoints return consistent error responses:

- **401 Unauthorized**: Missing or invalid JWT token
- **403 Forbidden**: Valid token but not a lawyer
- **404 Not Found**: Lawyer profile not found
- **400 Bad Request**: Validation errors
- **500 Internal Server Error**: Database or server errors

## Sample Data
The system includes sample data for testing:
- 3 sample cases (active, pending, closed)
- 3 sample appointments (hearing, meeting, deposition)
- 2 sample documents
- 3 sample invoices (paid, pending, overdue)

## Setup Commands
```bash
# Create dashboard tables and sample data
node setup_dashboard_tables.js

# Test all endpoints
node test_dashboard_endpoints.js

# Start server
npm start
```

## Security Features
- JWT-based authentication
- Role-based access control (lawyer-only endpoints)
- SQL injection prevention via Knex.js
- CORS protection
- Input validation and sanitization

## Frontend Integration
The backend is configured to work with:
- Frontend URL: `http://localhost:3000`
- Server Port: `5001`
- Base API URL: `/api/lawyer/*`

All endpoints return data in the exact format expected by the frontend dashboard components.