# Complete Testing Checklist - Sprints 0-4

## ✅ Implementation Status

### Sprint 0: Project Foundation ✅

- [x] Turborepo monorepo structure
- [x] Next.js (App Router, TypeScript)
- [x] Express.js (TypeScript)
- [x] Drizzle ORM schema
- [x] Zod validators
- [x] Supabase integration
- [x] Database schema: users, jobs, applications, resumes, schedules, notifications

### Sprint 1: Authentication ✅

- [x] Three role-specific login pages
- [x] JWT validation middleware
- [x] GET /api/auth/me endpoint
- [x] Role validation on login
- [x] Dashboards for all roles

### Sprint 2: Job Management ✅

- [x] POST /api/jobs (recruiter only)
- [x] GET /api/jobs (public, filterable)
- [x] GET /api/jobs/:id
- [x] POST /api/applications (candidate only)
- [x] HR job creation form
- [x] Candidate job browsing and application

### Sprint 3: Resume Upload & AI Screening ✅

- [x] POST /api/applications/:id/resume
- [x] POST /api/applications/:id/screen
- [x] AI backend integration
- [x] Resume upload to Supabase Storage
- [x] Screening results stored in database

### Sprint 4: HR Review & Decision ✅

- [x] GET /api/applications/jobs/:jobId/applications
- [x] GET /api/applications/:id
- [x] PUT /api/applications/:id/shortlist
- [x] HR applications page
- [x] Screening score display
- [x] Shortlist/Reject functionality

---

## 🧪 Complete Testing Guide

### Prerequisites

- [ ] API server running on `http://localhost:4000`
- [ ] Web server running on `http://localhost:3000`
- [ ] Supabase Storage bucket "resumes" created
- [ ] Environment variables configured
- [ ] Database migrations applied

---

## SPRINT 0: Foundation Testing

### Database Schema Verification

```sql
-- Run in Supabase SQL Editor
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('users', 'jobs', 'applications', 'resumes', 'schedules', 'notifications');

-- Verify columns exist
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'applications';
```

**Expected Results:**

- [ ] All 6 tables exist
- [ ] `applications` table has: `ai_application_id`, `screening_score`, `screening_report`, `resume_text`, `resume_file_url`

### API Health Check

```bash
curl http://localhost:4000/health
```

**Expected:** `{"status":"ok"}`

---

## SPRINT 1: Authentication Testing

### Test 1.1: Candidate Login

1. Navigate to `http://localhost:3000/candidate/login`
2. Enter candidate credentials
3. **Expected:** Redirects to `/dashboard/candidate`

**Verify:**

- [ ] Login form validates email/password
- [ ] Error shown for wrong credentials
- [ ] Error shown if role doesn't match
- [ ] User record auto-created if missing
- [ ] Successfully redirects to dashboard

### Test 1.2: HR/Recruiter Login

1. Navigate to `http://localhost:3000/hr/login`
2. Enter recruiter credentials
3. **Expected:** Redirects to `/dashboard/hr`

**Verify:**

- [ ] Only users with `recruiter` role can login
- [ ] Other roles are rejected

### Test 1.3: Admin Login

1. Navigate to `http://localhost:3000/admin/login`
2. Enter admin credentials
3. **Expected:** Redirects to `/dashboard/admin`

### Test 1.4: API Auth Endpoint

```bash
# Get auth token from browser (after login)
curl http://localhost:4000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected:** Returns user object with `id`, `email`, `role`

**Verify:**

- [ ] Returns 401 without token
- [ ] Returns user data with valid token
- [ ] Role matches database

---

## SPRINT 2: Job Management Testing

### Test 2.1: HR Creates Job

1. Login as HR/Recruiter
2. Go to HR Dashboard
3. Fill job creation form:
   - Title: "Software Engineer"
   - Description: "Full-stack developer needed"
   - Location: "Remote"
   - Requirements: `{"experience": "3+ years", "skills": ["React", "Node.js"]}`
4. Click "Create Job"

**Verify:**

- [ ] Job appears in "Your Jobs" list
- [ ] Job has correct `posted_by` (recruiter's user ID)
- [ ] Form validation works (title required)

**Database Check:**

```sql
SELECT id, title, posted_by, created_at FROM jobs ORDER BY created_at DESC LIMIT 1;
```

### Test 2.2: Public Job Listing

1. Logout (or use incognito)
2. Navigate to candidate dashboard (or use API directly)
3. **Expected:** See all jobs

**API Test:**

```bash
curl http://localhost:4000/api/jobs
```

**Verify:**

- [ ] Returns all jobs (no auth required)
- [ ] Jobs include: title, description, location, requirements

### Test 2.3: Job Filtering

```bash
# Filter by location
curl "http://localhost:4000/api/jobs?location=Remote"

# Search by title/description
curl "http://localhost:4000/api/jobs?search=Engineer"
```

**Verify:**

- [ ] Location filter works
- [ ] Search filter works

### Test 2.4: Get Single Job

```bash
curl http://localhost:4000/api/jobs/{job_id}
```

**Verify:**

- [ ] Returns single job details
- [ ] Returns 404 for invalid ID

### Test 2.5: Candidate Applies to Job

1. Login as candidate
2. Browse available jobs
3. Click "Apply Now" on a job
4. **Expected:** Success message, application created

**Verify:**

- [ ] Application status is "submitted"
- [ ] Application linked to correct job and user
- [ ] "Already Applied" shown if applied again
- [ ] Application appears in "My Applications"

**Database Check:**

```sql
SELECT id, job_id, user_id, status FROM applications WHERE status = 'submitted';
```

**API Test:**

```bash
curl -X POST http://localhost:4000/api/applications \
  -H "Authorization: Bearer CANDIDATE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"jobId": "job-uuid-here"}'
```

---

## SPRINT 3: Resume Upload & AI Screening Testing

### Test 3.1: Resume Upload

1. Login as candidate
2. Go to "My Applications"
3. Find application with status "submitted"
4. Upload a PDF resume (max 10MB)
5. Click "Upload Resume"

**Verify:**

- [ ] File validation (PDF only, size limit)
- [ ] Success message shown
- [ ] Status changes to "resume_uploaded"
- [ ] Resume file URL stored in database
- [ ] File exists in Supabase Storage bucket "resumes"

**Database Check:**

```sql
SELECT id, status, resume_file_url, resume_text
FROM applications
WHERE status = 'resume_uploaded';
```

**API Test:**

```bash
curl -X POST http://localhost:4000/api/applications/{application_id}/resume \
  -H "Authorization: Bearer CANDIDATE_TOKEN" \
  -F "resume=@/path/to/resume.pdf"
```

### Test 3.2: AI Backend Integration - Application Creation

**Verify in database:**

```sql
SELECT id, ai_application_id, status
FROM applications
WHERE ai_application_id IS NOT NULL;
```

**Expected:**

- [ ] `ai_application_id` is populated after application creation
- [ ] Application exists in AI backend

### Test 3.3: Trigger AI Screening

1. After resume upload, click "Trigger Screening"
2. Wait for processing (may take 10-30 seconds)
3. **Expected:** Screening results appear

**Verify:**

- [ ] Status changes to "screening_passed" or "rejected"
- [ ] Screening score appears (0-100)
- [ ] Screening report shows:
  - [ ] Key strengths
  - [ ] Potential gaps
  - [ ] Suggested interview questions
  - [ ] Summary

**Database Check:**

```sql
SELECT
  id,
  status,
  screening_score,
  screening_report->>'score' as ai_score,
  screening_report->>'key_strengths' as strengths
FROM applications
WHERE screening_score IS NOT NULL;
```

**API Test:**

```bash
curl -X POST http://localhost:4000/api/applications/{application_id}/screen \
  -H "Authorization: Bearer CANDIDATE_TOKEN"
```

**Expected Response:**

```json
{
  "status": "screening_passed",
  "score": 85,
  "screeningReport": {
    "score": 85,
    "key_strengths": [...],
    "potential_gaps": [...],
    "suggested_interview_questions": [...],
    "summary": "..."
  }
}
```

### Test 3.4: Error Handling

**Test scenarios:**

- [ ] Upload non-PDF file → Error shown
- [ ] Upload file > 10MB → Error shown
- [ ] Trigger screening without resume → Error shown
- [ ] AI backend unavailable → Graceful error handling

---

## SPRINT 4: HR Review & Decision Testing

### Test 4.1: View Applications for Job

1. Login as HR/Recruiter
2. Go to HR Dashboard
3. Click "View Applications" on a job
4. **Expected:** Applications page loads

**Verify:**

- [ ] Only shows applications for jobs posted by this recruiter
- [ ] Application cards show:
  - [ ] Candidate email
  - [ ] Status badge
  - [ ] Screening score (if available)
  - [ ] Key strengths preview
  - [ ] Summary preview

**API Test:**

```bash
curl http://localhost:4000/api/applications/jobs/{job_id}/applications \
  -H "Authorization: Bearer RECRUITER_TOKEN"
```

**Expected:** Array of applications with candidate info

### Test 4.2: View Application Details

1. Click on an application card
2. **Expected:** Modal opens with full details

**Verify:**

- [ ] Full screening report displayed
- [ ] All key strengths listed
- [ ] All potential gaps listed
- [ ] Suggested interview questions shown
- [ ] Resume download link works

**API Test:**

```bash
curl http://localhost:4000/api/applications/{application_id} \
  -H "Authorization: Bearer RECRUITER_TOKEN"
```

### Test 4.3: Shortlist Application

1. Find application with status "screening_passed"
2. Click "Shortlist" button
3. **Expected:** Status changes to "shortlisted"

**Verify:**

- [ ] Success message shown
- [ ] Status updated in database
- [ ] Status synced to AI backend
- [ ] Application card updates

**Database Check:**

```sql
SELECT id, status FROM applications WHERE status = 'shortlisted';
```

**API Test:**

```bash
curl -X PUT http://localhost:4000/api/applications/{application_id}/shortlist \
  -H "Authorization: Bearer RECRUITER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"decision": "hire"}'
```

### Test 4.4: Reject Application

1. Find application with status "screening_passed"
2. Click "Reject" button
3. **Expected:** Status changes to "rejected"

**Verify:**

- [ ] Success message shown
- [ ] Status updated in database
- [ ] Status synced to AI backend

**API Test:**

```bash
curl -X PUT http://localhost:4000/api/applications/{application_id}/shortlist \
  -H "Authorization: Bearer RECRUITER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"decision": "reject"}'
```

### Test 4.5: Access Control

**Verify:**

- [ ] Recruiter can only see applications for their own jobs
- [ ] Recruiter cannot see applications for other recruiters' jobs
- [ ] Candidate cannot access HR endpoints
- [ ] Unauthenticated requests return 401

---

## End-to-End Flow Testing

### Complete Candidate Journey

1. [ ] Candidate registers/logs in
2. [ ] Candidate browses jobs
3. [ ] Candidate applies to job → Status: "submitted"
4. [ ] Candidate uploads resume → Status: "resume_uploaded"
5. [ ] Candidate triggers screening → Status: "screening_passed" or "rejected"
6. [ ] Candidate views screening results

### Complete HR Journey

1. [ ] HR logs in
2. [ ] HR creates a job
3. [ ] HR views applications for the job
4. [ ] HR reviews screening reports
5. [ ] HR shortlists candidate → Status: "shortlisted"
6. [ ] HR rejects another candidate → Status: "rejected"

### Status Flow Verification

```sql
-- Check status transitions
SELECT
  status,
  COUNT(*) as count
FROM applications
GROUP BY status
ORDER BY count DESC;
```

**Expected Statuses:**

- `submitted`
- `resume_uploaded`
- `screening_passed`
- `screening_failed`
- `rejected`
- `shortlisted`

---

## Database Integrity Checks

### Foreign Key Relationships

```sql
-- Verify all applications have valid job_id
SELECT COUNT(*) FROM applications a
LEFT JOIN jobs j ON a.job_id = j.id
WHERE j.id IS NULL;
-- Expected: 0

-- Verify all applications have valid user_id
SELECT COUNT(*) FROM applications a
LEFT JOIN users u ON a.user_id = u.id
WHERE u.id IS NULL;
-- Expected: 0

-- Verify all jobs have valid posted_by
SELECT COUNT(*) FROM jobs j
LEFT JOIN users u ON j.posted_by = u.id
WHERE j.posted_by IS NOT NULL AND u.id IS NULL;
-- Expected: 0
```

### Data Consistency

```sql
-- Applications with screening should have scores
SELECT COUNT(*) FROM applications
WHERE screening_score IS NULL
AND screening_report IS NOT NULL;
-- Should be minimal or 0

-- Applications with resumes should have file URLs
SELECT COUNT(*) FROM applications
WHERE resume_file_url IS NULL
AND status IN ('resume_uploaded', 'screening_passed', 'screening_failed');
-- Should be 0
```

---

## Performance & Error Handling

### Test Error Scenarios

- [ ] Invalid job ID → 404
- [ ] Invalid application ID → 404
- [ ] Unauthorized access → 401/403
- [ ] Missing required fields → 400
- [ ] AI backend timeout → Graceful error
- [ ] File upload failure → Clear error message

### Test Edge Cases

- [ ] Apply to same job twice → Error message
- [ ] Upload resume twice → Should update
- [ ] Trigger screening multiple times → Should work
- [ ] Very large screening report → Should store correctly
- [ ] Special characters in job description → Should handle

---

## API Endpoint Summary

### Auth Endpoints

- [x] `GET /api/auth/me` - Get current user

### Job Endpoints

- [x] `POST /api/jobs` - Create job (recruiter)
- [x] `GET /api/jobs` - List jobs (public, filterable)
- [x] `GET /api/jobs/:id` - Get job details (public)

### Application Endpoints

- [x] `GET /api/applications` - Get candidate's applications
- [x] `POST /api/applications` - Create application (candidate)
- [x] `POST /api/applications/:id/resume` - Upload resume (candidate)
- [x] `POST /api/applications/:id/screen` - Trigger screening (candidate)
- [x] `GET /api/applications/jobs/:jobId/applications` - Get job applications (recruiter)
- [x] `GET /api/applications/:id` - Get application details (recruiter)
- [x] `PUT /api/applications/:id/shortlist` - Shortlist/Reject (recruiter)

---

## Final Verification Checklist

### All Sprints Complete ✅

- [ ] Sprint 0: Foundation - Database schema, monorepo structure
- [ ] Sprint 1: Authentication - Role-based login, JWT validation
- [ ] Sprint 2: Job Management - Create, browse, apply
- [ ] Sprint 3: Resume & Screening - Upload, AI integration, results
- [ ] Sprint 4: HR Review - View applications, make decisions

### Critical Paths Working

- [ ] Candidate can apply to job
- [ ] Candidate can upload resume
- [ ] Candidate can trigger screening
- [ ] HR can view applications
- [ ] HR can see screening results
- [ ] HR can shortlist/reject

### Data Persistence

- [ ] All data saved to Supabase
- [ ] AI backend integration working
- [ ] File uploads to Supabase Storage
- [ ] Status transitions correct

---

## Quick Test Script

Run this to verify all endpoints are accessible:

```bash
# Health check
curl http://localhost:4000/health

# Get jobs (public)
curl http://localhost:4000/api/jobs

# Get single job (replace with actual ID)
curl http://localhost:4000/api/jobs/{job_id}

# Auth check (requires token)
curl http://localhost:4000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Notes

- All tests should be run in order (Sprint 0 → 1 → 2 → 3 → 4)
- Some tests require previous steps to be completed
- Database checks can be run at any time to verify data integrity
- API tests can be run independently using curl/Postman
