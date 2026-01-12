# Legal City Backend API Documentation

## Overview
Node.js/Express backend API for the Legal City application providing lawyer directory and messaging functionality.

## Server Configuration
- **Port**: 5001
- **Base URL**: `/api`
- **CORS**: Enabled for `http://localhost:3000`
- **Database**: MySQL with Knex.js ORM

## API Endpoints

### 1. GET /api/lawyers
**Purpose**: Fetch all lawyers for directory listing

**Response Format**:
```json
[
  {
    "id": 1,
    "name": "Darlene Robertson",
    "location": "1 Station Road, London E17 8AA",
    "rating": 5,
    "reviewCount": 15,
    "reviewScore": 10.0,
    "yearsLicensed": 12,
    "practiceAreas": ["Business", "Libel & Slander"],
    "description": "Amet minim mollit non deserunt ullamco est sit aliqua dolor...",
    "imageUrl": "https://example.com/image.jpg",
    "category": "Business",
    "profile_picture": "https://example.com/profile.jpg",
    "address": "1 Station Road, London E17 8AA",
    "practice_areas": "Business, Libel & Slander",
    "reviews_count": 15,
    "bio": "Experienced attorney..."
  }
]
```

### 2. GET /api/lawyers/:id
**Purpose**: Fetch single lawyer profile for detail page

**URL Parameters**:
- `id` (required): Lawyer ID

**Success Response (200)**:
```json
{
  "id": 1,
  "name": "Darlene Robertson",
  "profile_picture": "https://example.com/profile.jpg",
  "address": "1 Station Road, London E17 8AA",
  "practice_areas": "Business, Libel & Slander",
  "reviews_count": 15,
  "years_licensed": 12,
  "bio": "Experienced attorney specializing in business law..."
}
```

**Error Response (404)**:
```json
{
  "message": "Lawyer not found"
}
```

### 3. POST /api/lawyers/:id/message
**Purpose**: Send message to lawyer

**URL Parameters**:
- `id` (required): Lawyer ID

**Request Body**:
```json
{
  "maritalStatus": "single",
  "hasChildren": "no",
  "message": "I need help with...",
  "phoneCall": true,
  "phoneNumber": "+1234567890",
  "timePreference": ["Morning", "Afternoon"]
}
```

**Validation Rules**:
- `message` is required and cannot be empty
- `phoneNumber` is required when `phoneCall` is true

**Success Response (200)**:
```json
{
  "message": "Message sent successfully"
}
```

**Error Responses**:
- **400**: `{ "message": "Message is required" }`
- **400**: `{ "message": "Phone number is required when requesting a phone call" }`
- **404**: `{ "message": "Lawyer not found" }`
- **500**: `{ "message": "Failed to send message" }`

## Database Schema

### Lawyers Table
```sql
CREATE TABLE lawyers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255),
  username VARCHAR(255),
  email VARCHAR(255),
  password VARCHAR(255),
  registration_id VARCHAR(255),
  law_firm VARCHAR(255),
  speciality VARCHAR(255),
  address TEXT,
  zip_code VARCHAR(20),
  city VARCHAR(100),
  state VARCHAR(100),
  country VARCHAR(100),
  mobile_number VARCHAR(20),
  phone VARCHAR(20),
  experience VARCHAR(50),
  description TEXT,
  profile_image VARCHAR(500),
  languages JSON,
  hourly_rate INT,
  lawyer_verified INT DEFAULT 0,
  is_verified INT DEFAULT 0,
  rating DECIMAL(3,1) DEFAULT 0.0,
  email_verified INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Messages Table
```sql
CREATE TABLE messages (
  id INT PRIMARY KEY AUTO_INCREMENT,
  lawyer_id INT,
  maritalStatus VARCHAR(50),
  hasChildren VARCHAR(10),
  message TEXT,
  phoneCall BOOLEAN DEFAULT FALSE,
  phoneNumber VARCHAR(20),
  timePreference JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (lawyer_id) REFERENCES lawyers(id)
);
```

## Sample Data
The database includes 4 sample lawyers:

1. **Darlene Robertson** - Business Law (ID: 1)
2. **Jerome Bell** - Criminal Defense (ID: 2)
3. **Kathryn Murphy** - Family Law (ID: 3)
4. **Jacob Jones** - Personal Injury (ID: 4)

## Error Handling
- All endpoints return consistent JSON error responses
- HTTP status codes are used appropriately (200, 400, 404, 500)
- Server errors are logged to console

## Security Features
- CORS protection
- Input validation
- SQL injection prevention via Knex.js parameterized queries
- Password hashing (for lawyer accounts)

## Development Commands
```bash
# Start server
npm start

# Update sample data
node update_lawyers_data.js

# Test endpoints
node test_endpoints.js
```

## Environment Variables Required
```
DB_HOST=localhost
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=your_db_name
FRONTEND_URL=http://localhost:3000
JWT_SECRET=your_jwt_secret
```