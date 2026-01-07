# Sprint 5 & 6 - Pre-Flight Checklist

## 🔴 CRITICAL: Database Migrations

### Step 1: Generate Migration
```bash
cd hr-platform/packages/db
npm run db:generate
```

This will create a new migration file in `drizzle/` folder with:
- New columns in `applications` table:
  - `interview_scheduled_at`
  - `interview_link`
  - `offer_sent_at`
  - `offer_details`
  - `compliance_checked_at`
  - `hired_at`
- New table: `application_logs`

### Step 2: Review Migration File
Check the generated SQL file in `drizzle/` to ensure it's correct.

### Step 3: Apply Migration
```bash
# Option 1: Push directly (for development)
npm run db:push

# Option 2: Run migration (for production)
npm run db:migrate
```

### Step 4: Verify in Database
Run in Supabase SQL Editor:
```sql
-- Check new columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'applications' 
AND column_name IN (
  'interview_scheduled_at', 
  'interview_link', 
  'offer_sent_at', 
  'offer_details', 
  'compliance_checked_at', 
  'hired_at'
);

-- Check application_logs table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'application_logs';

-- Check application_logs columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'application_logs';
```

---

## ✅ Environment Variables

Verify these are set in `.env` (root or `apps/api/.env`):

```env
# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
DATABASE_URL=your_database_connection_string

# AI Backend
AI_BACKEND_URL=https://agentic-hr-backend.onrender.com

# API
PORT=4000

# Frontend (apps/web/.env.local or .env)
NEXT_PUBLIC_API_URL=http://localhost:4000
```

---

## 🧪 Testing Checklist

### Backend API Endpoints

#### 1. Schedule Interview
```bash
POST http://localhost:4000/api/applications/{applicationId}/schedule
Headers: Authorization: Bearer {recruiter_token}
Body: {
  "scheduledAt": "2024-12-20T10:00:00Z",
  "timezone": "UTC"
}
```

**Expected:**
- Status: 200
- Application status updated to `interview_scheduled`
- `interviewScheduledAt` and `interviewLink` populated
- Notification created for candidate
- Log entry created

#### 2. Send Offer
```bash
POST http://localhost:4000/api/applications/{applicationId}/offer
Headers: Authorization: Bearer {recruiter_token}
Body: {
  "salary": 100000,
  "startDate": "2025-01-15",
  "position": "Software Engineer",
  "notes": "Welcome to the team!"
}
```

**Expected:**
- Status: 200
- Application status updated to `offer_sent`
- `offerSentAt` and `offerDetails` populated
- Notification created for candidate
- Log entry created

#### 3. Mark Hired (Compliance)
```bash
POST http://localhost:4000/api/applications/{applicationId}/compliance
Headers: Authorization: Bearer {recruiter_token}
Body: {
  "notes": "Compliance check passed"
}
```

**Expected:**
- Status: 200
- Application status updated to `hired`
- `complianceCheckedAt` and `hiredAt` populated
- Notification created for candidate
- Log entry created

#### 4. Get Application Logs
```bash
GET http://localhost:4000/api/applications/{applicationId}/logs
Headers: Authorization: Bearer {recruiter_token}
```

**Expected:**
- Status: 200
- Array of log entries with:
  - `action` (screening, shortlist, schedule, offer, compliance)
  - `performedBy` (user email)
  - `details` (JSON object)
  - `createdAt`

#### 5. Admin Statistics
```bash
GET http://localhost:4000/api/admin/stats
Headers: Authorization: Bearer {admin_token}
```

**Expected:**
- Status: 200
- JSON with:
  - `totalJobs`
  - `totalApplications`
  - `hiredCount`
  - `rejectedCount`
  - `shortlistedCount`
  - `interviewScheduledCount`
  - `offerSentCount`
  - `statusBreakdown`

---

### Frontend Testing

#### HR Dashboard (`/dashboard/hr/jobs/{jobId}/applications`)

1. **Shortlisted Application**
   - [ ] "Schedule Interview" button appears
   - [ ] Clicking opens modal with date/time picker
   - [ ] Submitting schedules interview
   - [ ] Status updates to "Interview Scheduled"
   - [ ] Interview date and link displayed

2. **Interview Scheduled Application**
   - [ ] "Send Offer" button appears
   - [ ] Clicking opens modal with offer form
   - [ ] Submitting sends offer
   - [ ] Status updates to "Offer Sent"
   - [ ] Offer details displayed

3. **Offer Sent Application**
   - [ ] "Mark Hired" button appears
   - [ ] Clicking opens confirmation dialog
   - [ ] Confirming marks as hired
   - [ ] Status updates to "Hired"

4. **Timeline View**
   - [ ] "View Timeline" button in application detail modal
   - [ ] Clicking fetches and displays logs
   - [ ] Timeline shows all actions chronologically
   - [ ] Each entry shows action, user, timestamp, and details

#### Candidate Dashboard (`/dashboard/candidate`)

1. **Interview Scheduled Status**
   - [ ] Status badge shows "Interview Scheduled"
   - [ ] Interview date displayed
   - [ ] Interview link displayed (if available)
   - [ ] Link is clickable

2. **Offer Sent Status**
   - [ ] Status badge shows "Offer Received"
   - [ ] Offer details displayed:
     - Position
     - Salary
     - Start date
     - Notes (if any)
   - [ ] Offer sent date shown

3. **Hired Status**
   - [ ] Status badge shows "Hired!"
   - [ ] Congratulations message displayed
   - [ ] Hired date shown

#### Admin Dashboard (`/dashboard/admin`)

1. **Statistics Display**
   - [ ] All stat cards load correctly
   - [ ] Total Jobs shows correct count
   - [ ] Total Applications shows correct count
   - [ ] Hired count shows correct number
   - [ ] Rejected count shows correct number
   - [ ] Shortlisted count shows correct number
   - [ ] Interview Scheduled count shows correct number
   - [ ] Offer Sent count shows correct number

2. **Status Breakdown**
   - [ ] Status breakdown section displays
   - [ ] All statuses from `statusBreakdown` shown
   - [ ] Counts match actual data

3. **Refresh Button**
   - [ ] Refresh button works
   - [ ] Statistics update on refresh

---

## 🔍 Code Verification

### Backend Exports
Verify these are exported from `packages/db/src/index.ts`:
- [ ] `applicationLogs` table
- [ ] All new fields in `applications` table

### API Routes
Verify routes are mounted in `apps/api/src/index.ts`:
- [ ] `/api/admin` route mounted

### Type Safety
- [ ] No TypeScript errors
- [ ] All types match between frontend and backend

---

## 🚨 Common Issues & Fixes

### Issue: Migration fails
**Fix:** Ensure `DATABASE_URL` is set correctly in `.env`

### Issue: "Column does not exist" error
**Fix:** Run database migration (see Step 1-3 above)

### Issue: AI backend returns 404
**Fix:** Verify `AI_BACKEND_URL` is correct and backend is accessible

### Issue: Role permission errors
**Fix:** Verify user role in database matches expected role

### Issue: Frontend can't connect to API
**Fix:** 
- Check `NEXT_PUBLIC_API_URL` is set
- Verify API server is running on correct port
- Check CORS settings

---

## 📋 End-to-End Flow Test

Test the complete hiring pipeline:

1. **Candidate Flow:**
   - [ ] Candidate applies to job
   - [ ] Candidate uploads resume
   - [ ] Candidate triggers screening
   - [ ] Screening score displayed
   - [ ] Status shows "Screening Passed"

2. **HR Flow:**
   - [ ] HR views applications
   - [ ] HR sees screening results
   - [ ] HR shortlists candidate
   - [ ] HR schedules interview
   - [ ] HR sends offer
   - [ ] HR marks as hired

3. **Candidate Notifications:**
   - [ ] Candidate sees interview scheduled notification
   - [ ] Candidate sees offer received notification
   - [ ] Candidate sees hired notification

4. **Admin View:**
   - [ ] Admin sees all statistics
   - [ ] Admin can view application timeline
   - [ ] Statistics reflect all actions

---

## ✅ Final Verification

Before considering complete:

- [ ] All database migrations applied
- [ ] All API endpoints tested
- [ ] All UI components working
- [ ] Error handling works (test with invalid data)
- [ ] Loading states display correctly
- [ ] Role enforcement prevents unauthorized access
- [ ] Logs are created for all actions
- [ ] Notifications are created for candidates
- [ ] No console errors in browser
- [ ] No TypeScript compilation errors

---

## 🎯 Quick Start Commands

```bash
# 1. Generate migration
cd hr-platform/packages/db
npm run db:generate

# 2. Apply migration
npm run db:push

# 3. Start API server
cd hr-platform/apps/api
npm run dev

# 4. Start web server (in new terminal)
cd hr-platform/apps/web
npm run dev

# 5. Verify servers running
# API: http://localhost:4000/health
# Web: http://localhost:3000
```

---

## 📝 Notes

- The AI backend endpoints are assumed to exist and return expected formats
- Email notifications are simulated via database notifications (no actual email service)
- Document UI (DocuSign) is not implemented per requirements
- Calendly integration is handled by AI backend

