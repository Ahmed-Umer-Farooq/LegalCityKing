# Quick Start Guide - Review & Endorsement System

## 🚀 Getting Started

### 1. Run Database Migration
```bash
cd backend
npx knex migrate:latest
```

### 2. Start Backend Server
```bash
cd backend
npm start
```
Server runs on: http://localhost:5001

### 3. Start Frontend
```bash
cd Frontend
npm start
```
Frontend runs on: http://localhost:3000

### 4. Test the System
```bash
cd backend
node test_review_system.js
```

## 📱 Using the System

### As a User (Writing Reviews)
1. **Login** as a user (not lawyer)
2. **Navigate** to any lawyer profile
3. **Click** "Write Review" button (blue border)
4. **Rate** the lawyer (1-5 stars)
5. **Write** optional review text
6. **Submit** - Your review appears immediately

### As a Lawyer (Endorsing Lawyers)
1. **Login** as a lawyer
2. **Navigate** to another lawyer's profile
3. **Click** "Endorse Lawyer" button (green border)
4. **Select** your relationship
5. **Write** endorsement text
6. **Submit** - Your endorsement appears immediately

## 🔑 Important Notes

### Authentication Rules
- ❌ Anonymous users → Must login first
- ❌ Lawyers cannot write reviews → Only users can
- ❌ Users cannot endorse → Only lawyers can
- ❌ Cannot review/endorse same lawyer twice
- ❌ Lawyers cannot endorse themselves

### Button Locations
**Hero Section (Top):**
- Phone: +44-20-8520-1234
- Write Review button
- Endorse Lawyer button

**Section Headers:**
- Client Reviews section → Write Review button
- Attorney Endorsements section → Endorse Lawyer button

## 🎯 API Endpoints

### Reviews
```
POST /api/reviews
Body: { lawyer_secure_id, rating, review }
Auth: Required (User only)

GET /api/reviews/:lawyer_secure_id
Auth: Not required
```

### Endorsements
```
POST /api/endorsements
Body: { endorsed_lawyer_secure_id, endorsement_text, relationship }
Auth: Required (Lawyer only)

GET /api/endorsements/:lawyer_secure_id
Auth: Not required
```

## 🐛 Troubleshooting

### "Please login to write a review"
→ You need to login as a user first

### "Only users can write reviews"
→ You're logged in as a lawyer, not a user

### "Only lawyers can endorse other lawyers"
→ You're logged in as a user, not a lawyer

### "You have already reviewed this lawyer"
→ You can only review each lawyer once

### "You have already endorsed this lawyer"
→ You can only endorse each lawyer once

### "You cannot endorse yourself"
→ Lawyers cannot endorse their own profile

## ✅ Verification Checklist

- [ ] Database migration completed
- [ ] Backend server running
- [ ] Frontend server running
- [ ] Can see phone number: +44-20-8520-1234
- [ ] Can see "Write Review" button
- [ ] Can see "Endorse Lawyer" button
- [ ] Login redirects work
- [ ] Review submission works
- [ ] Endorsement submission works
- [ ] Reviews display on profile
- [ ] Endorsements display on profile

## 📞 Contact Information

Phone number displayed on all lawyer profiles:
**+44-20-8520-1234**

## 🎉 You're All Set!

The system is fully functional and ready to use. Users can review lawyers, and lawyers can endorse each other - all with proper authentication and authorization!
