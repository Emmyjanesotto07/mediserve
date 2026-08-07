
  /*
    MIT License
    
    Copyright (c) 2025 Christian I. Cabrera || XianFire Framework
    Mindoro State University - Philippines

    Permission is hereby granted, free of charge, to any person obtaining a copy
    of this software and associated documentation files (the "Software"), to deal
    in the Software without restriction, including without limitation the rights
    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:

    The above copyright notice and this permission notice shall be included in all
    copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
    SOFTWARE.
    */
    
import express from "express";
import { Op } from "sequelize";
import { homePage} from "../controllers/homeController.js";
import upload from "../config/multer.js";

// Import all models
import { User } from "../models/userModel.js";
import { Patient } from "../models/patientModel.js";
import { Doctor } from "../models/doctorModel.js";
import { Appointment } from "../models/appointmentModel.js";
import { MedicalRecord } from "../models/medicalRecordModel.js";
import { Prescription } from "../models/prescriptionModel.js";
import { Notification } from "../models/notificationModel.js";
import { Nurse } from "../models/nurseModel.js";
import { DoctorAvailability } from "../models/doctorAvailabilityModel.js";
import { Consultation } from "../models/consultationModel.js";
import { PatientBooking } from "../models/patientBookingModel.js";
import { PatientDocument } from "../models/patientDocumentModel.js";
import { PatientMedicalHistory } from "../models/patientMedicalHistoryModel.js";
import { PatientMessage } from "../models/patientMessageModel.js";
import { PaymentTransaction } from "../models/paymentTransactionModel.js";
import { ActivityLog } from "../models/activityLogModel.js";
import { DoctorMessage } from "../models/doctorMessageModel.js";
import { DoctorBilling } from "../models/doctorBillingModel.js";
import { DoctorDocument } from "../models/doctorDocumentModel.js";
import { Role } from "../models/roleModel.js";
import setupAssociations from "../models/associations.js";

// Setup all model associations
setupAssociations({
  User,
  Patient,
  Doctor,
  Appointment,
  MedicalRecord,
  Prescription,
  Notification,
  Nurse,
  DoctorAvailability,
  Consultation,
  PatientBooking,
  PatientDocument,
  PatientMedicalHistory,
  PatientMessage,
  PaymentTransaction,
  ActivityLog,
  DoctorMessage,
  DoctorBilling,
  DoctorDocument,
  Role
});

const router = express.Router();
router.get("/", homePage);



import { loginPage, registerPage, forgotPasswordPage, loginUser, registerUser, verifyEmail, logoutUser } from "../controllers/authController.js";
import { healthCheck, dashboardSummary } from "../controllers/healthController.js";
import {
  doctorDashboardPage,
  getDoctorOverview,
  getTodaySchedule,
  getDoctorNotifications,
  updateAppointmentStatus,
  clearDoctorNotifications,
  updateDoctorProfile,
  createDoctorAvailability,
  deleteDoctorAvailability,
  uploadDoctorDocument,
  deleteDoctorDocument,
  sendDoctorMessage,
  getDoctorMessages,
  getDoctorBilling,
  getDoctorAnalytics
} from "../controllers/doctorDashboardController.js";
import {
  patientDashboardPage,
  updatePatientProfile,
  searchDoctors,
  getDoctorDetails,
  bookAppointment,
  getAppointmentHistory,
  joinConsultation,
  getPrescriptionHistory,
  getMedicalRecords,
  addMedicalHistory,
  uploadPatientDocument,
  getPatientDocuments,
  sendPatientMessage,
  getPatientMessages,
  getPaymentHistory,
  makePayment,
  getPatientNotifications,
  markNotificationRead,
  getPatientAnalytics,
  requestConsultation,
  downloadMedicalRecord,
  printMedicalRecord,
  downloadPrescription,
  printPrescription,
  rateDoctorOrService,
  getEditProfilePage,
  editPatientProfile,
  getAppointmentsPage,
  createAppointmentFromPage,
  getMedicalRecordsPage,
  getMessagesPage
} from "../controllers/patientDashboardController.js";
import {
  nurseDashboardPage,
  getAssignedPatients,
  updatePatientRecord,
  getPatientHistory,
  markNotificationAsRead as nurseMarkNotification,
  approveAppointment,
  rescheduleAppointment,
  recordVitals,
  createFollowUp
} from "../controllers/nurseDashboardController.js";
import {
  adminDashboardPage,
  approveDoctorRegistration,
  rejectDoctorRegistration,
  approveNurseRegistration,
  rejectNurseRegistration,
  getAllUsers,
  blockUser,
  unblockUser,
  getSystemReports,
  getActivityLog
} from "../controllers/adminDashboardController.js";
import { verifyToken, isAdmin, isDoctor, isPatient, isNurse } from "../middleware/authMiddleware.js";

router.get("/login", loginPage);
router.post("/login", loginUser);
router.get("/register", registerPage);
router.post("/register", registerUser);
router.get("/verify-email/:userId/:token", verifyEmail);
router.get("/forgot-password", forgotPasswordPage);
router.get("/dashboard", verifyToken, isDoctor, doctorDashboardPage);
router.get("/doctor-dashboard", verifyToken, isDoctor, doctorDashboardPage);

// Doctor Dashboard Preview (for demo/testing)
router.get("/doctor-dashboard-preview", (req, res) => {
  res.render("doctor-dashboard-ui", {
    title: "Doctor Dashboard - Preview",
    doctor: {
      name: "Dr. Alexandra Johnson",
      specialization: "Cardiology",
      consultationFee: 1500
    },
    stats: {
      todayAppointments: 5,
      totalPatients: 248,
      pendingConsultations: 2,
      earnings: 45250,
      upcomingAppointments: 5,
      unreadMessages: 4
    }
  });
});

// Patient Dashboard Preview (for demo/testing)
router.get("/patient-dashboard-preview", (req, res) => {
  const mockData = {
    title: "Patient Dashboard - Preview",
    patientName: "John David Martinez",
    patientInitials: "JD",
    doctors: [
      { id: 1, name: "Dr. Alexandra Johnson", specialization: "Cardiology", consultationFee: 1500, rating: 4.8 },
      { id: 2, name: "Dr. Michael Chen", specialization: "Neurology", consultationFee: 1200, rating: 4.7 },
      { id: 3, name: "Dr. Sarah Williams", specialization: "Dermatology", consultationFee: 1000, rating: 4.9 },
      { id: 4, name: "Dr. James Rodriguez", specialization: "Orthopedics", consultationFee: 1300, rating: 4.6 }
    ],
    nextAppointment: {
      doctorName: "Alexandra Johnson",
      appointmentDate: "2026-05-08",
      time: "14:30",
      type: "Video"
    },
    latestPrescription: {
      medicineName: "Amoxicillin",
      dosage: "500mg",
      doctorName: "Alexandra Johnson"
    },
    appointments: [
      { 
        id: 1, 
        doctorName: "Alexandra Johnson", 
        specialization: "Cardiology",
        appointmentDate: "2026-05-08",
        time: "14:30",
        type: "Video",
        status: "scheduled"
      },
      {
        id: 2,
        doctorName: "Michael Chen",
        specialization: "Neurology",
        appointmentDate: "2026-05-05",
        time: "10:00",
        type: "Chat",
        status: "scheduled"
      },
      {
        id: 3,
        doctorName: "Sarah Williams",
        specialization: "Dermatology",
        appointmentDate: "2026-04-28",
        time: "16:00",
        type: "Video",
        status: "completed"
      }
    ],
    prescriptions: [
      {
        id: 1,
        medicineName: "Amoxicillin",
        dosage: "500mg",
        frequency: "Twice daily",
        duration: "7 days",
        instructions: "Take after meals with water",
        doctorName: "Alexandra Johnson",
        createdAt: "2026-05-02"
      },
      {
        id: 2,
        medicineName: "Vitamin D3",
        dosage: "2000 IU",
        frequency: "Once daily",
        duration: "30 days",
        instructions: "Take in the morning with breakfast",
        doctorName: "Michael Chen",
        createdAt: "2026-04-28"
      }
    ],
    medicalRecords: [
      {
        id: 1,
        type: "Lab Report",
        fileName: "Blood Test Report - May 2026.pdf",
        date: "2026-05-02",
        doctorName: "Alexandra Johnson"
      },
      {
        id: 2,
        type: "X-Ray",
        fileName: "Chest X-Ray.pdf",
        date: "2026-04-25",
        doctorName: "Sarah Williams"
      }
    ],
    paymentHistory: [
      {
        date: "2026-05-02",
        description: "Video Consultation - Cardiology",
        amount: 1500,
        method: "Card",
        status: "completed"
      },
      {
        date: "2026-04-28",
        description: "Chat Consultation - Neurology",
        amount: 1200,
        method: "GCash",
        status: "completed"
      }
    ],
    notifications: [
      { id: 1, title: "Appointment Confirmed", message: "Your appointment with Dr. Johnson is confirmed", createdAt: "10:30 AM" },
      { id: 2, title: "New Prescription", message: "Dr. Chen sent you a new prescription", createdAt: "9:15 AM" }
    ],
    activeConsultation: null,
    accountBalance: 5000,
    dueAmount: 0,
    upcomingCount: 2,
    activeConsultations: 0,
    unreadMessages: 3,
    totalRecords: 5,
    labReports: 2,
    xrayReports: 1,
    otherRecords: 2,
    conversations: [
      {
        id: 1,
        doctorName: "Alexandra Johnson",
        doctorInitial: "A",
        lastMessage: "Please take the medication as prescribed",
        time: "2:30 PM",
        unread: true,
        messages: [
          { sender: 'doctor', text: 'Hello! How are you feeling today?', time: '2:00 PM' },
          { sender: 'patient', text: 'I feel much better, thank you', time: '2:15 PM' },
          { sender: 'doctor', text: 'Please take the medication as prescribed', time: '2:30 PM' }
        ]
      },
      {
        id: 2,
        doctorName: "Michael Chen",
        doctorInitial: "M",
        lastMessage: 'See you on your next appointment',
        time: '1:45 PM',
        unread: false,
        messages: [
          { sender: 'doctor', text: 'Your test results look good', time: '1:30 PM' },
          { sender: 'doctor', text: 'See you on your next appointment', time: '1:45 PM' }
        ]
      }
    ],
    selectedConversation: null
  };
  
  res.render("patient-dashboard-ui", mockData);
});

// Nurse Dashboard Preview (demo)
router.get("/nurse-dashboard-preview", async (req, res) => {
  try {
    const mockData = {
      title: "Nurse Dashboard - Preview",
      nurse: {
        name: "Nurse Joy"
      },
      assignedDoctor: {
        name: "Dr. Alexandra Johnson",
        specialization: "Internal Medicine"
      },
      todayAppointments: [
        { appointmentDate: "2026-05-03 09:30 AM", status: "Pending" },
        { appointmentDate: "2026-05-03 10:00 AM", status: "Confirmed" },
        { appointmentDate: "2026-05-03 11:00 AM", status: "Pending" }
      ],
      patientCount: 12,
      recentRecords: [
        { title: "Blood Test - Maria Cruz", createdAt: "2026-05-02", patient: "Maria Cruz" },
        { title: "X-Ray - Juan dela Vega", createdAt: "2026-04-25", patient: "Juan dela Vega" }
      ],
      notifications: [
        { title: "Consultation reminder", message: "Patient queue is ready for Dr. Alexandra Johnson." },
        { title: "Lab result uploaded", message: "A new laboratory report is available for review." }
      ],
      stats: {
        todayAppointments: 12,
        totalPatients: 48,
        pendingRecords: 7
      }
    };

    res.render("nurse-dashboard", mockData);
  } catch (err) {
    console.error("Error in nurse-dashboard-preview:", err);
    res.status(500).render("error", { message: "Error loading nurse dashboard: " + err.message });
  }
});

// Patient Dashboard Demo Route
router.get("/patient-dashboard-demo", async (req, res) => {
  try {
    // Create or find a demo patient
    let user = await User.findOne({ where: { email: "demo@patient.com" } });
    
    if (!user) {
      // Create demo user
      user = await User.create({
        email: "demo@patient.com",
        password: "demo123456",
        name: "Demo Patient",
        role: "patient",
        isEmailVerified: true
      });
    }

    // Check if patient profile exists
    let patient = await Patient.findOne({
      where: { userId: user.id },
      include: [{ model: User, attributes: ["firstName", "lastName", "email"] }]
    });

    if (!patient) {
      patient = await Patient.create({
        userId: user.id,
        bloodType: "O+",
        allergies: "None",
        medicalConditions: "None"
      });
      patient.User = user;
    }

    // Get data using actual queries (with fallbacks for empty data)
    let upcomingAppointments = [];
    try {
      upcomingAppointments = await Appointment.findAll({
        where: {
          patientId: patient.id,
          appointmentDate: { [Op.gte]: new Date() },
          status: { [Op.ne]: "cancelled" }
        },
        include: [{ model: Doctor, attributes: ["id", "name", "specialization", "consultationFee"] }],
        order: [["appointmentDate", "ASC"]],
        limit: 5
      });
    } catch (err) {
      console.error("Error fetching appointments:", err.message);
    }

    let doctors = [];
    try {
      doctors = await Doctor.findAll({
        where: { status: "active" },
        attributes: ["id", "name", "specialization", "consultationFee", "rating"],
        order: [["name", "ASC"]],
        limit: 10
      });
    } catch (err) {
      console.error("Error fetching doctors:", err.message);
    }

    const viewData = {
      title: "Patient Dashboard - Demo",
      patientName: patient.User ? patient.User.name : 'Demo Patient',
      patientInitials: patient.User ? (patient.User.name?.split(' ')[0]?.charAt(0) + (patient.User.name?.split(' ')[1]?.charAt(0) || '')).toUpperCase() : 'DP',
      doctors: doctors.length > 0 ? doctors : [
        { id: 1, name: "Dr. Alexandra Johnson", specialization: "Cardiology", consultationFee: 1500, rating: 4.8 },
        { id: 2, name: "Dr. Michael Chen", specialization: "Neurology", consultationFee: 1200, rating: 4.7 }
      ],
      nextAppointment: upcomingAppointments.length > 0 ? {
        doctorName: upcomingAppointments[0].Doctor?.name || 'Doctor',
        appointmentDate: upcomingAppointments[0].appointmentDate?.toISOString().split('T')[0],
        time: upcomingAppointments[0].appointmentDate?.toISOString().split('T')[1]?.substring(0, 5),
        type: upcomingAppointments[0].consultationType || 'Video'
      } : null,
      latestPrescription: {
        medicineName: "Sample Medication",
        dosage: "500mg",
        doctorName: "Sample Doctor"
      },
      appointments: [],
      prescriptions: [],
      medicalRecords: [],
      paymentHistory: [],
      notifications: [],
      activeConsultation: null,
      accountBalance: 0,
      dueAmount: 0,
      upcomingCount: upcomingAppointments.length,
      activeConsultations: 0,
      unreadMessages: 0,
      totalRecords: 0,
      labReports: 0,
      xrayReports: 0,
      otherRecords: 0,
      conversations: doctors.map(d => ({
        id: d.id,
        doctorName: d.name,
        doctorInitial: d.name?.charAt(0) || 'D',
        lastMessage: 'Click to start chatting',
        time: new Date().toLocaleTimeString(),
        unread: false,
        messages: [
          { sender: 'doctor', text: 'Hello! How can I help you?', time: '10:30 AM' }
        ]
      })),
      selectedConversation: null,
      stats: {
        upcomingAppointments: upcomingAppointments.length,
        totalAppointments: 0,
        completedAppointments: 0,
        totalPrescriptions: 0,
        totalConsultations: 0,
        unreadMessages: 0,
        pendingPayments: 0
      }
    };

    res.render("patient-dashboard-ui", viewData);
  } catch (error) {
    console.error("Error in patient-dashboard-demo:", error);
    res.status(500).render("error", { message: "Error loading demo dashboard: " + error.message });
  }
});

// Patient Routes
router.get("/patient-dashboard", verifyToken, isPatient, patientDashboardPage);
router.put("/patient/profile", verifyToken, isPatient, updatePatientProfile);
router.get("/patient/search-doctors", verifyToken, isPatient, searchDoctors);
router.get("/patient/doctor/:doctorId", verifyToken, isPatient, getDoctorDetails);
router.post("/patient/book-appointment", verifyToken, isPatient, bookAppointment);
router.get("/patient/appointments", verifyToken, isPatient, getAppointmentHistory);
router.post("/patient/consultation/join/:appointmentId", verifyToken, isPatient, joinConsultation);
router.get("/patient/prescriptions", verifyToken, isPatient, getPrescriptionHistory);
router.get("/patient/medical-records", verifyToken, isPatient, getMedicalRecords);
router.post("/patient/medical-history", verifyToken, isPatient, addMedicalHistory);
router.post("/patient/documents", verifyToken, isPatient, upload.single("medicalDocument"), uploadPatientDocument);
router.get("/patient/documents", verifyToken, isPatient, getPatientDocuments);
router.post("/patient/message", verifyToken, isPatient, sendPatientMessage);
router.get("/patient/messages/:doctorId", verifyToken, isPatient, getPatientMessages);
router.get("/patient/payments", verifyToken, isPatient, getPaymentHistory);
router.post("/patient/payment", verifyToken, isPatient, makePayment);
router.get("/patient/notifications", verifyToken, isPatient, getPatientNotifications);
router.put("/patient/notification/:notificationId/read", verifyToken, isPatient, markNotificationRead);
router.get("/patient/analytics", verifyToken, isPatient, getPatientAnalytics);

// Legacy patient routes (backward compatibility)
router.get("/appointments", getAppointmentsPage);
router.post("/appointments", createAppointmentFromPage);
router.get("/medical-records", getMedicalRecordsPage);
router.get("/messages", getMessagesPage);
router.post("/messages", sendPatientMessage);
router.get("/profile", getEditProfilePage);
router.post("/profile", upload.single('profilePicture'), editPatientProfile);
router.post("/patient/consultation-request", requestConsultation);
router.get("/patient/download-record/:recordId", downloadMedicalRecord);
router.get("/patient/print-record/:recordId", printMedicalRecord);
router.get("/patient/download-prescription/:prescriptionId", downloadPrescription);
router.get("/patient/print-prescription/:prescriptionId", printPrescription);
router.post("/patient/rate-doctor", rateDoctorOrService);
router.get("/nurse-dashboard", verifyToken, isNurse, nurseDashboardPage);
router.get("/nurse/assigned-patients", verifyToken, isNurse, getAssignedPatients);
router.put("/nurse/patient-record/:patientId", verifyToken, isNurse, updatePatientRecord);
router.get("/nurse/patient-history/:patientId", verifyToken, isNurse, getPatientHistory);
router.put("/nurse/notifications/:notificationId/read", verifyToken, isNurse, nurseMarkNotification);
router.post("/nurse/appointments/:appointmentId/approve", verifyToken, isNurse, approveAppointment);
router.post("/nurse/appointments/:appointmentId/reschedule", verifyToken, isNurse, rescheduleAppointment);
router.post("/nurse/patient-vitals/:patientId", verifyToken, isNurse, recordVitals);
router.post("/nurse/follow-ups/:patientId", verifyToken, isNurse, createFollowUp);
router.get("/admin-dashboard", verifyToken, isAdmin, adminDashboardPage);
router.put("/doctor/profile", verifyToken, isDoctor, updateDoctorProfile);
router.post("/doctor/availability", verifyToken, isDoctor, createDoctorAvailability);
router.delete("/doctor/availability/:availabilityId", verifyToken, isDoctor, deleteDoctorAvailability);
router.post("/doctor/documents", verifyToken, isDoctor, upload.single("documentFile"), uploadDoctorDocument);
router.delete("/doctor/documents/:documentId", verifyToken, isDoctor, deleteDoctorDocument);
router.get("/doctor/messages", verifyToken, isDoctor, getDoctorMessages);
router.post("/doctor/messages", verifyToken, isDoctor, sendDoctorMessage);
router.get("/doctor/billing", verifyToken, isDoctor, getDoctorBilling);
router.get("/doctor/analytics", verifyToken, isDoctor, getDoctorAnalytics);
router.put("/admin/doctor/:userId/approve", verifyToken, isAdmin, approveDoctorRegistration);
router.put("/admin/doctor/:userId/reject", verifyToken, isAdmin, rejectDoctorRegistration);
router.put("/admin/nurse/:userId/approve", verifyToken, isAdmin, approveNurseRegistration);
router.put("/admin/nurse/:userId/reject", verifyToken, isAdmin, rejectNurseRegistration);
router.get("/admin/users", verifyToken, isAdmin, getAllUsers);
router.put("/admin/user/:userId/block", verifyToken, isAdmin, blockUser);
router.put("/admin/user/:userId/unblock", verifyToken, isAdmin, unblockUser);
router.get("/admin/reports", verifyToken, isAdmin, getSystemReports);
router.get("/admin/activity-logs", verifyToken, isAdmin, getActivityLog);
router.get("/logout", logoutUser);
router.get("/health", healthCheck);
router.get("/api/dashboard-summary", dashboardSummary);
router.get("/api/doctor/overview", verifyToken, isDoctor, getDoctorOverview);
router.get("/api/doctor/schedule", verifyToken, isDoctor, getTodaySchedule);
router.get("/api/doctor/notifications", verifyToken, isDoctor, getDoctorNotifications);
router.post("/api/doctor/notifications/clear", verifyToken, isDoctor, clearDoctorNotifications);
router.post("/api/doctor/appointments/:id/status", verifyToken, isDoctor, updateAppointmentStatus);

export default router;
