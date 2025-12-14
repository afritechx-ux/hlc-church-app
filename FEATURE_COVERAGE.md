# HLAG-ChMS Feature Coverage Log

## A. Core Modules (Backend)
- [x] **1. Users & Roles**
  - [x] Roles Enum (SUPER_ADMIN...MEMBER)
  - [x] JWT Auth (Access + Refresh)
  - [x] RBAC Guards
- [x] **2. Members & Households**
  - [x] Member Profile CRUD
  - [x] Household Relations
- [x] **3. Departments**
  - [x] Department CRUD
  - [x] Leader Assignment
- [x] **4. Services**
  - [x] Service Templates
  - [x] Service Occurrences
- [x] **5. Attendance**
  - [x] Admin Check-in
  - [x] Member QR Check-in
  - [x] Anti-cheat (HMAC, Nonce)
- [x] **6. QR Token System**
  - [x] Rotating Token Logic (60s)
  - [x] Token Validation API
- [x] **7. Giving**
  - [x] Funds Management
  - [x] Donation Recording
  - [x] Reporting
- [x] **8. Follow-Ups**
  - [x] Task Entity
  - [x] Assignment Logic
- [x] **9. Engagement Scoring**
  - [x] Score Calculation Algorithm
  - [x] Nightly Job
- [x] **10. Automations**
  - [x] New Visitor Pipeline
  - [x] Inactive Member Detection
  - [x] Service Reminders
  - [x] Engagement Score Recalculation (Nightly)

## B. Admin Web
- [x] Auth & Dashboard
- [x] Member Management UI
- [x] Department Management UI
- [x] Service & Live QR UI
- [x] Giving & Reports UI
- [x] Follow-up Kanban

## C. Mobile App
- [x] **1. Setup & Auth**
  - [x] Project Init (Expo + TS)
  - [x] Login Integration
  - [x] Secure Token Storage
  - [x] Auto-login / Logout
- [x] **2. Home Dashboard**
  - [x] Welcome & Stats Skeleton
  - [x] Next Service Display
- [x] **3. QR System**
  - [x] Camera Permission
  - [x] QR Scanner Implementation
  - [x] Check-in API Integration
- [x] **4. Attendance History**
  - [x] History List UI
  - [x] Streak Display
  - [x] Monthly Grouping
- [x] **5. Giving Summary**
  - [x] Giving Totals per Fund
  - [x] Recent Donations List
- [x] **6. Profile & Departments**
  - [x] Profile Details View
  - [x] Engagement Score Display
  - [x] My Departments List
- [x] **7. Notifications**
  - [x] Expo Notifications Setup
  - [x] Push Notification Handling

## D. DevOps
- [x] Environment Config (.env.sample)
- [x] API Documentation (Swagger)
- [x] Docker Setup

## E. Web Admin Coverage
- [x] **1. Setup & Auth**
  - [x] Project Init (Next.js + Tailwind)
  - [x] Login Integration
  - [x] Protected Routes
- [x] **2. Dashboard**
  - [x] Stats Cards (Placeholder/Real)
  - [x] Recent Activity
- [x] **3. Members Module**
  - [x] Members List (Table, Search)
  - [x] Member Detail View (Skeleton)
- [x] **4. Services & QR**
  - [x] Services List
  - [x] Service Detail & Live QR
- [x] **5. Operations**
  - [x] Follow-Up Kanban
  - [x] Giving Module (Funds, Donations)
  - [x] Settings (Templates, Departments)
- [x] **6. Analytics**
  - [x] Real Dashboard Data
  - [x] Charts
