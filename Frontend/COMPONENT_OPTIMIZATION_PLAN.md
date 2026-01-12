# Frontend Component Optimization Plan

## Phase 3C: Frontend Component Audit Results

### Duplicate Components Identified:

#### 1. ProtectedRoute Components:
- `/components/ProtectedRoute.jsx` (Basic version)
- `/components/auth/ProtectedRoute.jsx` (Advanced with role-based access) ✅ **KEEP**

**Action**: Remove basic version, keep advanced auth/ProtectedRoute.jsx

#### 2. Toast Components:
- `/components/Toast.jsx` (Basic toast)
- `/components/ModernToast.jsx` (Enhanced with animations) ✅ **KEEP**
- `/components/ToastTest.jsx` (Test component) ❌ **REMOVE**

**Action**: Keep ModernToast.jsx, remove others

#### 3. Calendar Pages:
- `/pages/lawyer/CalendarPage.js` (Basic calendar)
- `/pages/lawyer/CalendarPage.jsx` (Full calendar with grid view) ✅ **KEEP**

**Action**: Remove .js version, keep .jsx version

#### 4. Contact Pages:
- `/pages/lawyer/ContactsPage.js`
- `/pages/lawyer/ContactsPage.jsx`

**Need to compare**: Check which one is more complete

#### 5. Tasks Pages:
- `/pages/lawyer/TasksPage.js`
- `/pages/lawyer/TasksPage.jsx`

**Need to compare**: Check which one is more complete

### Components Analysis:

#### Modal Components (All seem unique):
- AddExpenseModal.jsx
- CreateCallModal.jsx
- CreateCaseModal.jsx
- CreateClientModal.jsx
- CreateContactModal.jsx
- CreateEventModal.jsx
- CreateIntakeModal.jsx
- CreateInvoiceModal.jsx
- CreateMatterModal.jsx
- CreateNoteModal.jsx
- CreatePaymentModal.jsx
- CreateTaskModal.jsx
- LogCallModal.jsx
- RecordPaymentModal.jsx
- ReportBlogModal.jsx
- ReviewLegalCityModal.jsx
- SendMessageModal.jsx
- TrackTimeModal.jsx
- VerificationModal.jsx
- ViewClientModal.jsx

#### Layout Components (All unique):
- AuthHeader.jsx
- DashboardHeader.jsx
- Footer.jsx
- Header.jsx
- MainLayout.jsx
- SharedLayout.jsx
- Sidebar.jsx

#### Payment Components (All unique):
- PaymentLinkManager.jsx
- PaymentModal.jsx
- SubscriptionPlans.jsx

### Files to Remove:
1. `/components/ProtectedRoute.jsx`
2. `/components/Toast.jsx`
3. `/components/ToastTest.jsx`
4. `/pages/lawyer/CalendarPage.js`

### Files to Compare and Decide:
1. ContactsPage.js vs ContactsPage.jsx
2. TasksPage.js vs TasksPage.jsx

### Unused Components Check:
Need to verify if these components are actually being used:
- CommentCount.jsx
- CommentSection.jsx
- HeroSection.jsx
- LawyersCarousel.jsx
- MessageNotification.jsx
- OtpInput.jsx
- PasswordStrengthIndicator.jsx
- PaymentAcknowledgment.jsx
- QuickActions.jsx
- SEOHead.jsx

## Next Steps:
1. Compare remaining duplicate files
2. Remove confirmed duplicates
3. Update imports in files that reference removed components
4. Test application to ensure no broken imports