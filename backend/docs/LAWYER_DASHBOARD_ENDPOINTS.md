# Lawyer Dashboard API Endpoints

## Authentication
All endpoints require JWT authentication via `Authorization: Bearer <token>` header.

## Dashboard Overview
### GET /api/dashboard/overview
Returns dashboard statistics for the authenticated lawyer.

**Response:**
```json
{
  "success": true,
  "data": {
    "activeCases": 5,
    "totalClients": 12,
    "monthlyRevenue": 15000.00,
    "upcomingHearings": 3
  }
}
```

### GET /api/dashboard/recent-activity
Returns recent activity/events for the lawyer.

### GET /api/dashboard/revenue?period=monthly
Returns revenue data grouped by period (daily, monthly, yearly).

### GET /api/dashboard/cases-chart
Returns case distribution data for charts.

## Cases Management
### GET /api/cases
List all cases for the authenticated lawyer.
**Query params:** `page`, `limit`, `status`, `type`

### GET /api/cases/:id
Get specific case details.

### POST /api/cases
Create a new case.
**Body:**
```json
{
  "title": "Contract Dispute",
  "type": "civil",
  "description": "Client contract dispute case",
  "filing_date": "2024-01-15",
  "client_id": 1,
  "estimated_value": 50000.00,
  "next_hearing_date": "2024-02-15T10:00:00Z"
}
```

### PUT /api/cases/:id
Update case details.

### DELETE /api/cases/:id
Delete a case.

### GET /api/cases/:id/timeline
Get case timeline/events.

### GET /api/cases/stats
Get case statistics.

## Client Management
### GET /api/clients
List all clients associated with lawyer's cases.
**Query params:** `page`, `limit`

### GET /api/clients/:id
Get specific client details.

### POST /api/clients
Create a new client.
**Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "username": "johndoe",
  "address": "123 Main St",
  "city": "New York",
  "state": "NY",
  "zip_code": "10001",
  "country": "USA",
  "mobile_number": "+1234567890"
}
```

### PUT /api/clients/:id
Update client information.

### DELETE /api/clients/:id
Delete a client.

### GET /api/clients/:id/cases
Get all cases for a specific client.

### GET /api/clients/:id/invoices
Get all invoices for a specific client.

## Events/Calendar
### GET /api/events
List all events for the lawyer.
**Query params:** `page`, `limit`, `event_type`, `status`

### POST /api/events
Create a new event.
**Body:**
```json
{
  "title": "Court Hearing",
  "description": "Initial hearing for contract dispute",
  "event_type": "hearing",
  "start_date_time": "2024-02-15T10:00:00Z",
  "end_date_time": "2024-02-15T11:00:00Z",
  "location": "Courthouse Room 101",
  "case_id": 1,
  "client_id": 1,
  "attendees": ["client", "opposing_counsel"]
}
```

### PUT /api/events/:id
Update event details.

### DELETE /api/events/:id
Delete an event.

### GET /api/events/upcoming?days=7
Get upcoming events within specified days.

### GET /api/events/calendar?start=2024-01-01&end=2024-01-31
Get calendar events for date range.

## Task Management
### GET /api/tasks
List all tasks for the lawyer.
**Query params:** `page`, `limit`, `status`, `priority`, `case_id`

### POST /api/tasks
Create a new task.
**Body:**
```json
{
  "title": "Review contract",
  "description": "Review client contract for discrepancies",
  "priority": "high",
  "due_date": "2024-01-20T17:00:00Z",
  "case_id": 1,
  "assigned_to": 1
}
```

### PUT /api/tasks/:id
Update task details.

### PUT /api/tasks/:id/status
Update task status.
**Body:**
```json
{
  "status": "completed"
}
```

### DELETE /api/tasks/:id
Delete a task.

### GET /api/tasks/my-tasks?status=pending
Get tasks assigned to the authenticated lawyer.

## Document Management
### GET /api/documents
List all documents uploaded by the lawyer.
**Query params:** `page`, `limit`, `category`, `case_id`

### POST /api/documents
Upload a new document (multipart/form-data).
**Form fields:**
- `document` (file)
- `category` (string)
- `case_id` (number)
- `client_id` (number)
- `tags` (comma-separated string)
- `is_confidential` (boolean)

### GET /api/documents/:id
Get document details.

### GET /api/documents/:id/download
Download document file.

### PUT /api/documents/:id
Update document metadata.

### DELETE /api/documents/:id
Delete document and file.

## Invoice Management
### GET /api/invoices
List all invoices for the lawyer.
**Query params:** `page`, `limit`, `status`

### POST /api/invoices
Create a new invoice.
**Body:**
```json
{
  "client_id": 1,
  "case_id": 1,
  "amount": 5000.00,
  "tax": 500.00,
  "due_date": "2024-02-15",
  "items": [
    {"description": "Legal consultation", "hours": 10, "rate": 500}
  ],
  "notes": "Initial consultation and case review"
}
```

### PUT /api/invoices/:id
Update invoice details.

### PUT /api/invoices/:id/send
Mark invoice as sent.

### PUT /api/invoices/:id/mark-paid
Mark invoice as paid.

### DELETE /api/invoices/:id
Delete an invoice.

### GET /api/invoices/:id/pdf
Generate PDF for invoice (placeholder).

### GET /api/invoices/stats
Get invoice statistics.

## Time Tracking
### GET /api/time-entries
List all time entries for the lawyer.
**Query params:** `page`, `limit`, `case_id`, `is_billable`

### POST /api/time-entries
Create a new time entry.
**Body:**
```json
{
  "case_id": 1,
  "description": "Client consultation",
  "hours": 2.5,
  "billable_rate": 500.00,
  "date": "2024-01-15",
  "is_billable": true
}
```

### POST /api/time-entries/start-timer
Start a new timer.
**Body:**
```json
{
  "case_id": 1,
  "description": "Working on case research",
  "billable_rate": 500.00
}
```

### PUT /api/time-entries/:id/stop-timer
Stop an active timer.

### PUT /api/time-entries/:id
Update time entry.

### DELETE /api/time-entries/:id
Delete time entry.

## Expense Tracking
### GET /api/expenses
List all expenses for the lawyer.
**Query params:** `page`, `limit`, `case_id`, `is_billable`

### POST /api/expenses
Create a new expense.
**Body:**
```json
{
  "case_id": 1,
  "client_id": 1,
  "category": "Travel",
  "description": "Travel to courthouse",
  "amount": 50.00,
  "date": "2024-01-15",
  "is_billable": true
}
```

### PUT /api/expenses/:id
Update expense details.

### PUT /api/expenses/:id/receipt
Upload receipt for expense (multipart/form-data).
**Form fields:**
- `receipt` (file)

### DELETE /api/expenses/:id
Delete expense and receipt.

## Notes Management
### GET /api/notes
List all notes created by the lawyer.
**Query params:** `page`, `limit`, `case_id`, `client_id`, `is_private`

### POST /api/notes
Create a new note.
**Body:**
```json
{
  "title": "Case Strategy",
  "content": "Initial strategy discussion with client...",
  "case_id": 1,
  "client_id": 1,
  "is_private": true,
  "tags": "strategy,consultation"
}
```

### PUT /api/notes/:id
Update note content.

### DELETE /api/notes/:id
Delete a note.

## Error Responses
All endpoints return consistent error format:
```json
{
  "success": false,
  "error": "Error message description"
}
```

## Pagination Format
List endpoints return pagination info:
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25
  }
}
```