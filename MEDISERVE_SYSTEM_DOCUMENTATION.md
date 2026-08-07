# MEDISERVE System - Complete Healthcare Management Platform

## 📋 Table of Contents
1. [System Overview](#system-overview)
2. [Features](#features)
3. [User Roles](#user-roles)
4. [Installation & Setup](#installation--setup)
5. [Database Models](#database-models)
6. [API Endpoints](#api-endpoints)
7. [Security](#security)
8. [Testing](#testing)
9. [Deployment](#deployment)

---

## System Overview

MEDISERVE is a comprehensive, role-based healthcare management system designed for hospitals and clinics. It handles patient management, doctor scheduling, consultations, medical records, and administrative functions.

**Tech Stack:**
- Backend: Node.js + Express.js
- Database: MySQL + Sequelize ORM
- Template Engine: XianFire Framework
- Authentication: JWT + Bcrypt
- Security: Role-Based Access Control (RBAC), Data Encryption

---

## Features

### ✅ **1. User Registration & Management**

#### Patient Registration
- Self-registration with personal details (name, age, contact, email)
- Secure password protection with bcrypt hashing
- Profile update anytime
- Medical history tracking (allergies, blood type)

#### Doctor Registration
- Registration with professional details (specialization, license, experience)
- Account pending approval by Super Admin
- Availability schedule management
- Consultation fee configuration

#### Nurse Registration
- Dedicated account creation
- Role-based permissions
- Assigned to doctors for patient support
- Access control by the system admin

#### Super Admin Account
- Full system control
- Approve/reject doctor and nurse registrations
- User management (block, unblock, delete)
- System settings and security management

---

### ✅ **2. Dashboard System**

#### **Patient Dashboard**
```
/patient-dashboard
- View medical records and consultation history
- Book online consultations with doctors
- Receive prescriptions and medical advice
- View upcoming and past appointments
- Manage personal health information
- Receive notifications
```

#### **Doctor Dashboard**
```
/doctor-dashboard
- View assigned patients
- Access patient medical records
- Conduct online consultations (chat/video)
- Upload and manage prescriptions
- Manage availability schedule
- View today's schedule
```

#### **Nurse Dashboard**
```
/nurse-dashboard
- Update patient records
- Monitor patient status
- Schedule consultations
- Support doctors in patient care
- Track appointed patients
```

#### **Admin Dashboard**
```
/admin-dashboard
- Monitor all system activities
- Manage users (approve, reject, block)
- View system reports and analytics
- Ensure security and data privacy
- Activity logs and monitoring
```

---

### ✅ **3. Online Consultation Feature**

- **Real-time Consultation**: Chat or video call
- **Appointment Scheduling**: Book, reschedule, cancel
- **Queue Management**: Patient waiting list for consultations
- **Meeting Links**: Auto-generated for video calls
- **Secure Communication**: End-to-end communication
- **Status Tracking**: Scheduled, ongoing, completed, cancelled

---

### ✅ **4. Medical Records Management**

- **Digital Storage**: Cloud-based patient records
- **History Tracking**: Complete medical history
- **Doctor Updates**: Diagnoses, prescriptions, notes
- **Easy Retrieval**: Search and filter records
- **Privacy**: HIPAA-compliant data handling
- **Record Sharing**: Share records with authorized personnel
- **Download**: Export records as PDF/text

---

### ✅ **5. Security Features**

- **Authentication**: Username & password with JWT tokens
- **Role-Based Access Control**: Patient, Doctor, Nurse, Admin, Super Admin
- **Data Encryption**: Bcrypt password hashing
- **Session Management**: Secure cookie-based sessions
- **IP Logging**: Track login attempts and activities
- **Backup System**: Regular data backups
- **Access Logs**: Audit trail for all activities

---

### ✅ **6. Notification System**

- **Appointment Reminders**: Automatic email/in-app alerts
- **System Alerts**: Updates and announcements
- **Prescription Notifications**: Medication reminders
- **Status Updates**: Real-time notifications
- **Unread Tracking**: Mark as read/unread
- **Notification Types**: Appointment, Prescription, Medical Record, System Alert, Status Update

---

### ✅ **7. Reporting & Monitoring**

- **Consultation Reports**: Track consultations by date/doctor
- **User Analytics**: Monitor user activities
- **System Performance**: Check system health
- **Activity Logs**: Complete audit trail
- **Monthly Reports**: Generate usage statistics
- **Performance Metrics**: System uptime and response times

---

## User Roles

| Role | Permissions | Dashboard | Key Functions |
|------|-------------|-----------|----------------|
| **Patient** | Limited | `/patient-dashboard` | Book appointments, view records, manage profile |
| **Doctor** | Full consultation access | `/doctor-dashboard` | Manage patients, conduct consultations, write prescriptions |
| **Nurse** | Record management | `/nurse-dashboard` | Update records, assist doctors, schedule appointments |
| **Admin** | System management | `/admin-dashboard` | Approve registrations, manage users, view reports |
| **Super Admin** | Full system control | `/admin-dashboard` | All admin + additional system settings |

---

## Installation & Setup

### Prerequisites
```bash
- Node.js >= 14.0
- MySQL >= 5.7
- npm or yarn
```

### Step 1: Clone Repository
```bash
cd GmcMediserve
npm install
```

### Step 2: Setup Environment Variables
Create `.env` file:
```env
DATABASE_NAME=Mediserve
DATABASE_USER=root
DATABASE_PASSWORD=your_password
DATABASE_HOST=localhost
JWT_SECRET=mediserve_secret_key_2025
NODE_ENV=development
```

### Step 3: Run Database Migration
```bash
npm run migrate
```

This will:
- Create the `Mediserve` database
- Create all required tables
- Initialize with default values

### Step 4: Start Development Server
```bash
npm start
```

Server runs on `http://localhost:3000`

---

## Database Models

### 1. User Model
```javascript
{
  id, name, email, password, 
  role: enum['patient', 'doctor', 'nurse', 'admin', 'super_admin'],
  status: enum['active', 'inactive', 'pending_approval', 'blocked'],
  lastLogin, createdAt, updatedAt
}
```

### 2. Patient Model
```javascript
{
  id, userId, name, age, gender,
  bloodType, phone, address,
  medicalHistory, allergies,
  createdAt, updatedAt
}
```

### 3. Doctor Model
```javascript
{
  id, userId, name, specialization,
  license, experience, phone,
  consultationFee,
  status: enum['active', 'inactive', 'on_leave'],
  createdAt, updatedAt
}
```

### 4. Appointment Model
```javascript
{
  id, patientId, doctorId, appointmentDate,
  startTime, endTime,
  status: enum['scheduled', 'completed', 'cancelled', 'no-show'],
  notes, consultationType: enum['in-person', 'video'],
  createdAt, updatedAt
}
```

### 5. Nurse Model
```javascript
{
  id, userId, name, licenseNumber,
  specialization, phone, assignedDoctorId,
  status: enum['active', 'inactive', 'on_leave'],
  createdAt, updatedAt
}
```

### 6. MedicalRecord Model
```javascript
{
  id, patientId, doctorId, appointmentId,
  diagnosis, treatment, notes,
  consultationType, recordDate,
  createdAt, updatedAt
}
```

### 7. Prescription Model
```javascript
{
  id, medicalRecordId, medicationName,
  dosage, frequency, duration, instructions,
  prescribedDate, createdAt, updatedAt
}
```

### 8. Notification Model
```javascript
{
  id, userId, type, title, message,
  relatedId, isRead,
  createdAt, updatedAt
}
```

### 9. Consultation Model
```javascript
{
  id, appointmentId, patientId, doctorId,
  consultationType, status, startTime, endTime,
  meetingLink, notes,
  createdAt, updatedAt
}
```

### 10. ActivityLog Model
```javascript
{
  id, userId, action, entityType, entityId,
  description, ipAddress, createdAt
}
```

---

## API Endpoints

### **Authentication**
```
POST   /login                  - User login
POST   /register               - Patient registration
POST   /register/doctor        - Doctor registration
POST   /register/nurse         - Nurse registration
POST   /logout                 - Logout
GET    /forgot-password        - Forgot password page
```

### **Patient Endpoints**
```
GET    /patient-dashboard                    - Patient dashboard view
PUT    /patient/profile                      - Update profile
GET    /patient/appointments                 - Get appointments
POST   /patient/book-appointment             - Book appointment
PUT    /patient/cancel-appointment           - Cancel appointment
GET    /patient/medical-records              - Get medical records
GET    /patient/notifications                - Get notifications
PUT    /patient/notifications/:id/read       - Mark notification as read
GET    /patient/search-doctors               - Search doctors
```

### **Doctor Endpoints**
```
GET    /doctor-dashboard                     - Doctor dashboard view
GET    /doctor/overview                      - Doctor overview stats
GET    /doctor/today-schedule                - Today's schedule
GET    /doctor/notifications                 - Get notifications
PUT    /doctor/update-appointment/:id        - Update appointment
DELETE /doctor/clear-notifications           - Clear notifications

POST   /consultation/start                   - Start consultation
POST   /consultation/end                     - End consultation
GET    /consultation/history                 - Consultation history
GET    /consultation/:id                     - Get consultation details

POST   /medical-record                       - Create medical record
GET    /medical-record/patient/:id           - Get patient records
GET    /medical-record/:id                   - Get specific record
PUT    /medical-record/:id                   - Update record
POST   /prescription                         - Add prescription
```

### **Nurse Endpoints**
```
GET    /nurse-dashboard                      - Nurse dashboard
GET    /nurse/assigned-patients              - Get assigned patients
PUT    /nurse/patient-record/:id             - Update patient record
GET    /nurse/patient-history/:id            - Get patient history
PUT    /nurse/notifications/:id/read         - Mark notification as read
```

### **Admin Endpoints**
```
GET    /admin-dashboard                      - Admin dashboard
PUT    /admin/doctor/:userId/approve         - Approve doctor
PUT    /admin/doctor/:userId/reject          - Reject doctor
PUT    /admin/nurse/:userId/approve          - Approve nurse
GET    /admin/users                          - Get all users
PUT    /admin/user/:userId/block             - Block user
PUT    /admin/user/:userId/unblock           - Unblock user
GET    /admin/reports                        - Get system reports
GET    /admin/activity-logs                  - Get activity logs
```

### **Consultation Endpoints**
```
POST   /consultation/schedule                - Schedule consultation
PUT    /consultation/:id/reschedule          - Reschedule
PUT    /consultation/:id/cancel              - Cancel consultation
```

### **Medical Records**
```
GET    /medical-record/patient/:id/history   - Patient history
GET    /medical-record/:id/download          - Download record
POST   /medical-record/:id/share             - Share record
GET    /prescription/patient/:id             - Get prescriptions
```

### **Notifications**
```
GET    /notifications                        - Get all notifications
GET    /notifications/unread                 - Get unread notifications
PUT    /notifications/:id/read                - Mark as read
PUT    /notifications/read-all               - Mark all as read
DELETE /notifications/:id                    - Delete notification
DELETE /notifications/delete-all             - Delete all
```

---

## Security

### Password Hashing
All passwords are hashed using bcrypt with salt rounds = 10

### JWT Authentication
- Token expires in 7 days
- Stored in secure cookies
- Verified on every protected route

### RBAC (Role-Based Access Control)
- Middleware checks user role before allowing access
- Each route restricted to specific roles
- Custom permission middleware for granular control

### Data Protection
- All sensitive data stored encrypted
- SQL injection prevention via Sequelize ORM
- CORS enabled for frontend
- Rate limiting recommended for production

### Audit Trail
- All user actions logged in ActivityLog
- IP addresses recorded
- Timestamps for all activities

---

## Testing

### Manual API Testing
Use Postman or cURL:

```bash
# Login
curl -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{"email":"doctor@example.com","password":"password123"}'

# Get patient appointments
curl -X GET http://localhost:3000/patient/appointments \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Book appointment
curl -X POST http://localhost:3000/patient/book-appointment \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"doctorId":1,"appointmentDate":"2026-04-20T10:00:00Z"}'
```

### Unit Testing (Recommended)
Add Jest or Mocha for API testing:
```bash
npm install --save-dev jest supertest
npm run test
```

---

## Deployment

### Production Checklist
- [ ] Set `NODE_ENV=production`
- [ ] Update JWT_SECRET with strong key
- [ ] Setup HTTPS/SSL certificates
- [ ] Configure database backups
- [ ] Setup email notifications
- [ ] Enable rate limiting
- [ ] Setup logging service (Winston/Morgan)
- [ ] Configure CDN for static files
- [ ] Setup monitoring (PM2, New Relic)
- [ ] Create admin super user account

### Deployment Commands
```bash
npm install --production
npm run migrate
npm start
```

---

## File Structure
```
GmcMediserve/
├── models/                    # Database models
│   ├── userModel.js
│   ├── patientModel.js
│   ├── doctorModel.js
│   ├── appointmentModel.js
│   ├── nurseModel.js
│   ├── medicalRecordModel.js
│   ├── prescriptionModel.js
│   ├── notificationModel.js
│   ├── consultationModel.js
│   ├── activityLogModel.js
│   └── db.js
├── controllers/               # Business logic
│   ├── authController.js
│   ├── patientDashboardController.js
│   ├── doctorDashboardController.js
│   ├── nurseDashboardController.js
│   ├── adminDashboardController.js
│   ├── consultationController.js
│   ├── medicalRecordsController.js
│   ├── notificationController.js
│   └── homeController.js
├── routes/                    # API routes
│   ├── apiRoutes.js
│   └── index.js
├── middleware/                # Custom middleware
│   └── authMiddleware.js
├── views/                     # XianFire templates
├── public/                    # Static files
├── data/                      # Seed data
└── migrate.js                 # Database migration

```

---

## Support & Documentation

For issues or feature requests, please contact the development team.

**Version:** 1.0.0  
**Last Updated:** April 2025  
**License:** MIT
