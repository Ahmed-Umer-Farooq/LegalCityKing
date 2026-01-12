# Quick Actions API Documentation

## Overview
All 12 Quick Actions from the Lawyer Dashboard are fully implemented with complete CRUD operations.

## Authentication
All endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## Quick Actions Endpoints

### 1. New Client
- **POST** `/api/clients` - Create new client
- **GET** `/api/clients` - Get all clients
- **GET** `/api/clients/:id` - Get client by ID
- **PUT** `/api/clients/:id` - Update client
- **DELETE** `/api/clients/:id` - Delete client
- **GET** `/api/clients/:id/cases` - Get client cases
- **GET** `/api/clients/:id/invoices` - Get client invoices

**Create Client Body:**
```json
{
  "name": "Client Name",
  "email": "client@example.com",
  "username": "clientuser",
  "mobile_number": "+1234567890",
  "address": "123 Main St",
  "city": "City",
  "state": "State",
  "zip_code": "12345",
  "country": "USA"
}
```

### 2. New Contact
- **POST** `/api/contacts` - Create new contact
- **GET** `/api/contacts` - Get all contacts
- **PUT** `/api/contacts/:id` - Update contact
- **DELETE** `/api/contacts/:id` - Delete contact

**Create Contact Body:**
```json
{
  "name": "Contact Name",
  "email": "contact@example.com",
  "phone": "+1234567890",
  "company": "Company Name",
  "title": "Job Title",
  "address": "Contact Address",
  "type": "client|opposing_counsel|witness|expert|vendor|other",
  "case_id": 1,
  "tags": "tag1,tag2"
}
```

### 3. New Matter (Case)
- **POST** `/api/cases` - Create new case
- **GET** `/api/cases` - Get all cases
- **GET** `/api/cases/:id` - Get case by ID
- **PUT** `/api/cases/:id` - Update case
- **DELETE** `/api/cases/:id` - Delete case

**Create Case Body:**
```json
{
  "title": "Case Title",
  "type": "civil|criminal|family|corporate|immigration|personal_injury|real_estate|other",
  "description": "Case description",
  "client_id": 1,
  "filing_date": "2024-01-15",
  "status": "active|pending|closed|on_hold"
}
```

### 4. New Event
- **POST** `/api/events` - Create new event
- **GET** `/api/events` - Get all events
- **PUT** `/api/events/:id` - Update event
- **DELETE** `/api/events/:id` - Delete event

**Create Event Body:**
```json
{
  "title": "Event Title",
  "description": "Event description",
  "start_date": "2024-01-20",
  "start_time": "10:00",
  "end_date": "2024-01-20",
  "end_time": "11:00",
  "location": "Office",
  "event_type": "meeting|hearing|deadline|appointment|other",
  "case_id": 1,
  "client_id": 1
}
```

### 5. New Task
- **POST** `/api/tasks` - Create new task
- **GET** `/api/tasks` - Get all tasks
- **PUT** `/api/tasks/:id` - Update task
- **DELETE** `/api/tasks/:id` - Delete task

**Create Task Body:**
```json
{
  "title": "Task Title",
  "description": "Task description",
  "due_date": "2024-01-25",
  "priority": "low|medium|high|urgent",
  "status": "pending|in_progress|completed|cancelled",
  "case_id": 1,
  "assigned_to": 1
}
```

### 6. New Note
- **POST** `/api/notes` - Create new note
- **GET** `/api/notes` - Get all notes
- **PUT** `/api/notes/:id` - Update note
- **DELETE** `/api/notes/:id` - Delete note

**Create Note Body:**
```json
{
  "title": "Note Title",
  "content": "Note content",
  "case_id": 1,
  "client_id": 1,
  "is_private": false,
  "tags": "tag1,tag2"
}
```

### 7. Log Call
- **POST** `/api/calls` - Log new call
- **GET** `/api/calls` - Get all calls
- **PUT** `/api/calls/:id` - Update call
- **DELETE** `/api/calls/:id` - Delete call

**Log Call Body:**
```json
{
  "title": "Call Title",
  "description": "Call description",
  "call_date": "2024-01-15",
  "duration_minutes": 30,
  "call_type": "consultation|follow_up|emergency|other",
  "contact_id": 1,
  "case_id": 1,
  "notes": "Call notes",
  "is_billable": true,
  "billable_rate": 150.00
}
```

### 8. Send Message
- **POST** `/api/messages` - Send new message
- **GET** `/api/messages` - Get all messages
- **PUT** `/api/messages/:id` - Update message
- **DELETE** `/api/messages/:id` - Delete message

**Send Message Body:**
```json
{
  "subject": "Message Subject",
  "content": "Message content",
  "recipient_id": 1,
  "recipient_type": "client|lawyer|contact",
  "case_id": 1,
  "priority": "low|medium|high"
}
```

### 9. Track Time
- **POST** `/api/time-entries` - Create time entry
- **GET** `/api/time-entries` - Get all time entries
- **PUT** `/api/time-entries/:id` - Update time entry
- **DELETE** `/api/time-entries/:id` - Delete time entry
- **POST** `/api/time-entries/start` - Start timer
- **PUT** `/api/time-entries/:id/stop` - Stop timer

**Track Time Body:**
```json
{
  "case_id": 1,
  "description": "Work description",
  "hours": 2.5,
  "billable_rate": 150.00,
  "date": "2024-01-15",
  "is_billable": true
}
```

### 10. Add Expense
- **POST** `/api/expenses` - Add new expense
- **GET** `/api/expenses` - Get all expenses
- **PUT** `/api/expenses/:id` - Update expense
- **DELETE** `/api/expenses/:id` - Delete expense
- **PUT** `/api/expenses/:id/receipt` - Upload receipt

**Add Expense Body:**
```json
{
  "case_id": 1,
  "client_id": 1,
  "category": "Travel|Office|Court|Other",
  "description": "Expense description",
  "amount": 25.50,
  "date": "2024-01-15",
  "is_billable": true
}
```

### 11. New Invoice
- **POST** `/api/invoices` - Create new invoice
- **GET** `/api/invoices` - Get all invoices
- **GET** `/api/invoices/:id` - Get invoice by ID
- **PUT** `/api/invoices/:id` - Update invoice
- **DELETE** `/api/invoices/:id` - Delete invoice

**Create Invoice Body:**
```json
{
  "client_id": 1,
  "case_id": 1,
  "invoice_number": "INV-001",
  "amount": 1500.00,
  "due_date": "2024-02-15",
  "status": "draft|sent|paid|overdue|cancelled",
  "description": "Invoice description",
  "tax_amount": 120.00,
  "discount_amount": 0.00
}
```

### 12. Record Payment
- **POST** `/api/payments` - Record new payment
- **GET** `/api/payments` - Get all payments
- **PUT** `/api/payments/:id` - Update payment
- **DELETE** `/api/payments/:id` - Delete payment

**Record Payment Body:**
```json
{
  "invoice_id": 1,
  "client_id": 1,
  "amount": 500.00,
  "payment_date": "2024-01-15",
  "payment_method": "cash|check|credit_card|bank_transfer|other",
  "reference_number": "CHK-001",
  "notes": "Payment notes"
}
```

## Query Parameters

Most GET endpoints support the following query parameters:
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)
- `case_id` - Filter by case ID
- `client_id` - Filter by client ID
- `status` - Filter by status
- `type` - Filter by type
- `is_billable` - Filter billable items (true/false)

## Response Format

All endpoints return responses in the following format:

**Success Response:**
```json
{
  "success": true,
  "data": {
    // Response data
  },
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Error message"
}
```

## Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `404` - Not Found
- `500` - Internal Server Error

## Testing

Use the provided test script `test_quick_actions.js` to test all endpoints:

1. Start the backend server: `npm start`
2. Get a JWT token by logging in as a lawyer
3. Update the token in the test script
4. Run: `node test_quick_actions.js`

## Notes

- All endpoints require authentication with a valid lawyer JWT token
- Foreign key relationships are validated before creation
- Soft deletes are used where appropriate
- File uploads are supported for receipts and documents
- Time tracking includes timer functionality for real-time tracking