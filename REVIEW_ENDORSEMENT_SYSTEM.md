# Review and Endorsement System Documentation

## Overview
A fully functional review and endorsement system where:
- **Users** can review lawyers (requires user authentication)
- **Lawyers** can endorse other lawyers (requires lawyer authentication)
- No anonymous reviews or endorsements allowed

## Features Implemented

### 1. Database Structure
- **lawyer_reviews** table: Stores user reviews for lawyers
  - Fields: id, lawyer_id, user_id, rating (1-5), review text, timestamps
  - Unique constraint: One review per user per lawyer
  
- **lawyer_endorsements** table: Stores lawyer-to-lawyer endorsements
  - Fields: id, endorser_lawyer_id, endorsed_lawyer_id, endorsement_text, relationship, timestamps
  - Unique constraint: One endorsement per lawyer pair

### 2. Backend API Endpoints

#### Reviews
- `POST /api/reviews` - Create a review (requires user authentication)
  - Body: `{ lawyer_secure_id, rating, review }`
  - Validates: User is logged in, rating is 1-5, no duplicate reviews
  
- `GET /api/reviews/:lawyer_secure_id` - Get all reviews for a lawyer
  - Returns: Array of reviews with user names, average rating, total count

#### Endorsements
- `POST /api/endorsements` - Create an endorsement (requires lawyer authentication)
  - Body: `{ endorsed_lawyer_secure_id, endorsement_text, relationship }`
  - Validates: Lawyer is logged in, cannot self-endorse, no duplicate endorsements
  
- `GET /api/endorsements/:lawyer_secure_id` - Get all endorsements for a lawyer
  - Returns: Array of endorsements with endorser details, total count

### 3. Frontend Components

#### LawyerProfile Page Updates
- Added phone number: **+44-20-8520-1234** (as requested)
- Two new action buttons:
  - **"Write Review"** button (for users)
  - **"Endorse Lawyer"** button (for lawyers)
- Real-time display of reviews and endorsements
- Authentication checks before allowing actions

#### ReviewModal Component
- Star rating selector (1-5 stars)
- Optional review text area
- Form validation
- Success/error notifications

#### EndorsementModal Component
- Relationship dropdown selector
- Required endorsement text area
- Form validation
- Success/error notifications

### 4. Authentication & Authorization

#### User Reviews
- Must be logged in as a **user** (not lawyer)
- Cannot review the same lawyer twice
- Redirects to login if not authenticated

#### Lawyer Endorsements
- Must be logged in as a **lawyer**
- Cannot endorse themselves
- Cannot endorse the same lawyer twice
- Redirects to login if not authenticated

## Button Locations

The review and endorsement buttons are placed in **two locations** on the lawyer profile page:

1. **Hero Section** (top right, next to phone and chat buttons)
   - "Write Review" button (blue border)
   - "Endorse Lawyer" button (green border)

2. **Sections Headers**
   - "Write Review" button in Client Reviews section header
   - "Endorse Lawyer" button in Attorney Endorsements section header

## Usage Flow

### For Users (Writing Reviews)
1. Navigate to lawyer profile page
2. Click "Write Review" button
3. If not logged in → redirected to login page
4. If logged in as lawyer → error message
5. If logged in as user → modal opens
6. Select star rating (required)
7. Write review text (optional)
8. Submit → review appears on profile

### For Lawyers (Endorsing Lawyers)
1. Navigate to another lawyer's profile page
2. Click "Endorse Lawyer" button
3. If not logged in → redirected to login page
4. If logged in as user → error message
5. If logged in as lawyer → modal opens
6. Select relationship type (required)
7. Write endorsement text (required)
8. Submit → endorsement appears on profile

## Security Features
- JWT token authentication required
- Role-based access control (users vs lawyers)
- SQL injection prevention via parameterized queries
- XSS prevention via input sanitization
- Duplicate prevention via unique constraints
- Self-endorsement prevention

## Testing

Run the test script to verify setup:
```bash
cd backend
node test_review_system.js
```

## API Response Examples

### Get Reviews Response
```json
{
  "reviews": [
    {
      "id": 1,
      "rating": 5,
      "review": "Excellent lawyer!",
      "created_at": "2024-01-15T10:30:00Z",
      "user_name": "John Doe"
    }
  ],
  "average_rating": "4.8",
  "total_reviews": 12
}
```

### Get Endorsements Response
```json
{
  "endorsements": [
    {
      "id": 1,
      "endorsement_text": "Highly professional and skilled attorney.",
      "relationship": "Opposing Counsel on matter",
      "created_at": "2024-01-15T10:30:00Z",
      "endorser_name": "Jane Smith",
      "endorser_speciality": "Family Law"
    }
  ],
  "total_endorsements": 8
}
```

## Files Created/Modified

### Backend
- `migrations/20251210000001_create_lawyer_endorsements_table.js` (new)
- `controllers/reviewController.js` (new)
- `routes/reviews.js` (new)
- `server.js` (modified - added review routes)

### Frontend
- `components/lawyer/ReviewModal.jsx` (new)
- `components/lawyer/EndorsementModal.jsx` (new)
- `pages/LawyerProfile.jsx` (modified - integrated review/endorsement system)

## Notes
- Reviews and endorsements are displayed in chronological order (newest first)
- Page refreshes after successful submission to show new content
- Toast notifications provide user feedback
- All forms include loading states during submission
- Empty states shown when no reviews/endorsements exist
