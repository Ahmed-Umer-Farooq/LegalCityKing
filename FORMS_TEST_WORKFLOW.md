# Legal Forms System - Complete Test Workflow

## 🚀 Setup & Start

### 1. Start Backend Server
```bash
cd backend
npm start
```
**Expected:** Server running on http://localhost:5001

### 2. Start Frontend
```bash
cd Frontend
npm start
```
**Expected:** Frontend running on http://localhost:3000

---

## 📝 Test Workflow

### STEP 1: Login as Lawyer
1. Go to http://localhost:3000/login
2. Login with lawyer credentials
3. Navigate to **Dashboard > Forms** (in top navigation)

### STEP 2: Create a Form (Lawyer)
1. Click **"Create Form"** button
2. Fill in the form:
   - **Title:** "Sample Employment Contract"
   - **Description:** "Standard employment agreement template"
   - **Category:** Select "Business Law"
   - **Practice Area:** "Employment Law"
   - **Check:** "Free Form" (or set price)
   - **Upload File:** Any PDF/DOC file
3. Click **"Create Form"**
4. **Expected Result:** 
   - Success message
   - Form appears in list with **"Pending"** status (yellow badge)
   - Form shows in your forms list

### STEP 3: Verify in Database (Optional)
```bash
cd backend
node -e "const db = require('./db'); db('legal_forms').select('*').then(r => console.log(r)).finally(() => process.exit())"
```
**Expected:** See your form with status='pending'

### STEP 4: Login as Admin
1. Logout from lawyer account
2. Login with admin credentials
3. Navigate to **Admin Dashboard > Forms** tab

### STEP 5: Review & Approve Form (Admin)
1. You should see the form in the list with **"Pending"** status
2. Click the **green checkmark** (Approve) button
3. **Expected Result:**
   - Success message: "Form approved successfully!"
   - Form status changes to **"Approved"** (green badge)
   - Stats update (Pending count decreases, Approved count increases)

### STEP 6: Verify Approval (Lawyer)
1. Logout from admin
2. Login as lawyer again
3. Go to **Dashboard > Forms**
4. **Expected Result:**
   - Your form now shows **"Approved"** status (green badge)
   - Form is now publicly visible

---

## 🧪 Alternative Test: Rejection Flow

### Reject a Form (Admin)
1. As admin, go to **Admin Dashboard > Forms**
2. Find a pending form
3. Click the **red X** (Reject) button
4. Enter rejection reason: "Missing required information"
5. **Expected Result:**
   - Form status changes to **"Rejected"** (red badge)
   - Rejection reason is saved

### View Rejection (Lawyer)
1. As lawyer, go to **Dashboard > Forms**
2. **Expected Result:**
   - Form shows **"Rejected"** status
   - Red box displays: "Rejection Reason: Missing required information"

---

## 📊 Test Filters & Stats

### Admin Dashboard Tests:
1. Click **"Pending"** filter → See only pending forms
2. Click **"Approved"** filter → See only approved forms
3. Click **"Rejected"** filter → See only rejected forms
4. Click **"All"** filter → See all forms
5. Check stats cards update correctly

### Lawyer Dashboard Tests:
1. Create multiple forms
2. Verify all show in your list
3. Delete a form → Confirm it's removed
4. Check empty state when no forms exist

---

## ✅ Success Criteria

### Backend Working:
- ✅ Forms API endpoints responding
- ✅ File uploads working
- ✅ Status changes persisting to database
- ✅ Role-based access control working

### Lawyer Dashboard Working:
- ✅ Can create forms
- ✅ Can view own forms
- ✅ Can delete forms
- ✅ Status badges display correctly
- ✅ Rejection reasons visible

### Admin Dashboard Working:
- ✅ Can view all forms
- ✅ Can approve forms
- ✅ Can reject forms with reason
- ✅ Can delete any form
- ✅ Stats update in real-time
- ✅ Filters work correctly

---

## 🐛 Troubleshooting

### Form not appearing in admin?
- Check backend console for errors
- Verify form was created (check database)
- Refresh admin page

### Can't upload file?
- Check file size (max 10MB)
- Only PDF/DOC/DOCX allowed
- Check backend uploads/forms directory exists

### Status not updating?
- Check browser console for errors
- Verify API calls in Network tab
- Refresh the page

### 401/403 Errors?
- Token expired - logout and login again
- Check user role in localStorage
- Verify middleware is working

---

## 📝 Quick Test Commands

### Check Forms in Database:
```bash
cd backend
node -e "const db = require('./db'); db('legal_forms').select('*').orderBy('created_at', 'desc').then(r => console.log(JSON.stringify(r, null, 2))).finally(() => process.exit())"
```

### Check Categories:
```bash
node -e "const db = require('./db'); db('form_categories').select('*').then(r => console.log(JSON.stringify(r, null, 2))).finally(() => process.exit())"
```

### Test API Directly:
```bash
# Get all forms (public)
curl http://localhost:5001/api/forms/public

# Get categories
curl http://localhost:5001/api/forms/categories
```

---

## 🎯 Expected Final State

After complete workflow:
- ✅ 1+ forms created by lawyer
- ✅ Forms visible in admin dashboard
- ✅ Forms approved/rejected by admin
- ✅ Status changes reflected in lawyer dashboard
- ✅ Stats accurate in admin dashboard
- ✅ All CRUD operations working

**System is fully functional!** 🎉
