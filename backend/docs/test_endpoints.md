# Test Commands for Lawyer Dashboard API

Replace `YOUR_JWT_TOKEN` with an actual JWT token from login.

## 1. Test Dashboard Overview
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" http://localhost:5001/api/dashboard/overview
```

## 2. Test Cases
```bash
# List cases
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" http://localhost:5001/api/cases

# Create a case
curl -X POST -H "Authorization: Bearer YOUR_JWT_TOKEN" -H "Content-Type: application/json" -d "{\"title\":\"Test Case\",\"type\":\"civil\",\"description\":\"Test case description\",\"client_id\":1}" http://localhost:5001/api/cases
```

## 3. Test Clients
```bash
# List clients
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" http://localhost:5001/api/clients

# Create a client
curl -X POST -H "Authorization: Bearer YOUR_JWT_TOKEN" -H "Content-Type: application/json" -d "{\"name\":\"Test Client\",\"email\":\"test@example.com\"}" http://localhost:5001/api/clients
```

## 4. Test Events
```bash
# List events
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" http://localhost:5001/api/events

# Get upcoming events
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" http://localhost:5001/api/events/upcoming
```

## 5. Test Tasks
```bash
# List tasks
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" http://localhost:5001/api/tasks

# Create a task
curl -X POST -H "Authorization: Bearer YOUR_JWT_TOKEN" -H "Content-Type: application/json" -d "{\"title\":\"Test Task\",\"description\":\"Test task description\",\"priority\":\"medium\"}" http://localhost:5001/api/tasks
```

## 6. Test Documents
```bash
# List documents
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" http://localhost:5001/api/documents

# Upload a document (requires a test file)
curl -X POST -H "Authorization: Bearer YOUR_JWT_TOKEN" -F "document=@test.pdf" -F "category=contract" http://localhost:5001/api/documents
```

## 7. Test Invoices
```bash
# List invoices
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" http://localhost:5001/api/invoices

# Create an invoice
curl -X POST -H "Authorization: Bearer YOUR_JWT_TOKEN" -H "Content-Type: application/json" -d "{\"client_id\":1,\"amount\":1000,\"due_date\":\"2024-02-15\"}" http://localhost:5001/api/invoices
```

## 8. Test Time Entries
```bash
# List time entries
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" http://localhost:5001/api/time-entries

# Create a time entry
curl -X POST -H "Authorization: Bearer YOUR_JWT_TOKEN" -H "Content-Type: application/json" -d "{\"case_id\":1,\"description\":\"Legal research\",\"hours\":2.5,\"billable_rate\":500,\"date\":\"2024-01-15\"}" http://localhost:5001/api/time-entries
```

## 9. Test Expenses
```bash
# List expenses
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" http://localhost:5001/api/expenses

# Create an expense
curl -X POST -H "Authorization: Bearer YOUR_JWT_TOKEN" -H "Content-Type: application/json" -d "{\"case_id\":1,\"category\":\"Travel\",\"description\":\"Court travel\",\"amount\":50,\"date\":\"2024-01-15\"}" http://localhost:5001/api/expenses
```

## 10. Test Notes
```bash
# List notes
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" http://localhost:5001/api/notes

# Create a note
curl -X POST -H "Authorization: Bearer YOUR_JWT_TOKEN" -H "Content-Type: application/json" -d "{\"title\":\"Test Note\",\"content\":\"This is a test note content\"}" http://localhost:5001/api/notes
```

## Getting a JWT Token
First, login to get a token:
```bash
# For lawyer login
curl -X POST -H "Content-Type: application/json" -d "{\"email\":\"lawyer@example.com\",\"password\":\"password\"}" http://localhost:5001/api/auth/login

# Or use registration_id for lawyers
curl -X POST -H "Content-Type: application/json" -d "{\"registration_id\":\"LAW123\",\"password\":\"password\"}" http://localhost:5001/api/auth/login
```

The response will contain a `token` field that you can use in the Authorization header.