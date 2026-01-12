# Registration APIs Documentation

This document outlines the APIs available for user and lawyer registration in the Legal City backend. These can be used by the frontend to test API calls and ensure they work correctly.

## Base URL
Assuming the server runs on `http://localhost:3000` (adjust as needed).

## Endpoints

### 1. Register User
- **Method**: POST
- **URL**: `/auth/register-user`
- **Description**: Registers a new user account.
- **Request Body** (JSON):
  ```json
  {
    "name": "John Doe",
    "username": "johndoe",
    "email": "john@example.com",
    "password": "securepassword123",
    "address": "123 Main St",
    "zip_code": "12345",
    "city": "New York",
    "state": "NY",
    "country": "USA",
    "mobile_number": "+1234567890"
  }
  ```
- **Response** (Success):
  ```json
  {
    "message": "Registration successful. Please check your email for verification code."
  }
  ```
- **Response** (Error):
  ```json
  {
    "message": "Validation failed",
    "errors": ["Email is required", "Password must be at least 6 characters"]
  }
  ```

### 2. Register Lawyer
- **Method**: POST
- **URL**: `/auth/register-lawyer`
- **Description**: Registers a new lawyer account.
- **Request Body** (JSON):
  ```json
  {
    "name": "Jane Smith",
    "username": "janesmith",
    "email": "jane@example.com",
    "password": "securepassword123",
    "registration_id": "LAW123456",
    "law_firm": "Smith & Associates",
    "speciality": "Criminal Law",
    "address": "456 Legal Ave",
    "zip_code": "67890",
    "city": "Los Angeles",
    "state": "CA",
    "country": "USA",
    "mobile_number": "+1987654321"
  }
  ```
- **Response** (Success):
  ```json
  {
    "message": "Registration successful. Please check your email for verification code."
  }
  ```
- **Response** (Error):
  ```json
  {
    "message": "Validation failed",
    "errors": ["Registration ID is required for lawyers"]
  }
  ```

### 3. Unified Register (Auto-detects User or Lawyer)
- **Method**: POST
- **URL**: `/auth/register`
- **Description**: Automatically routes to user or lawyer registration based on presence of lawyer-specific fields (registration_id, law_firm, speciality).
- **Request Body for User** (JSON):
  ```json
  {
    "name": "John Doe",
    "username": "johndoe",
    "email": "john@example.com",
    "password": "securepassword123",
    "address": "123 Main St",
    "zip_code": "12345",
    "city": "New York",
    "state": "NY",
    "country": "USA",
    "mobile_number": "+1234567890"
  }
  ```
- **Request Body for Lawyer** (JSON):
  ```json
  {
    "name": "Jane Smith",
    "username": "janesmith",
    "email": "jane@example.com",
    "password": "securepassword123",
    "registration_id": "LAW123456",
    "law_firm": "Smith & Associates",
    "speciality": "Criminal Law",
    "address": "456 Legal Ave",
    "zip_code": "67890",
    "city": "Los Angeles",
    "state": "CA",
    "country": "USA",
    "mobile_number": "+1987654321"
  }
  ```
- **Response** (Success): Same as individual endpoints.
- **Response** (Error): Same as individual endpoints.

## Notes
- All endpoints require JSON content type.
- Passwords are hashed server-side.
- Email verification is sent after registration.
- Validation is performed on required fields.
- Rate limiting is applied to prevent abuse.
- Fields support both snake_case and camelCase (e.g., zip_code or zipCode).

## Testing
Use tools like Postman, curl, or frontend fetch to test these endpoints. Ensure the server is running and database is set up.
