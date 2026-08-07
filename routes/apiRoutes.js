/*
MIT License

Copyright (c) 2025 Christian I. Cabrera || XianFire Framework
Mindoro State University - Philippines
*/

import express from "express";
import {
  loginPage,
  registerPage,
  loginUser,
  registerUser,
  registerDoctor,
  registerNurse,
  logoutUser,
  forgotPasswordPage
} from "../controllers/authController.js";

import {
  patientDashboardPage,
  updatePatientProfile,
  getPatientAppointments,
  bookAppointment,
  cancelAppointment,
  getMedicalRecords,
  getNotifications,
  markNotificationAsRead,
  searchDoctors
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
  getAllUsers,
  rejectNurseRegistration,
  blockUser,
  unblockUser,
  getSystemReports,
  getActivityLog
} from "../controllers/adminDashboardController.js";

import {
  startConsultation,
  endConsultation,
  getConsultationHistory,
  getChatHistory,
  scheduleConsultation,
  rescheduleConsultation,
  cancelConsultation
} from "../controllers/consultationController.js";

import {
  createMedicalRecord,
  getPatientMedicalRecords,
  getMedicalRecord,
  updateMedicalRecord,
  addPrescription,
  getPrescriptions,
  downloadMedicalRecord,
  getPatientMedicalHistory,
  shareRecord
} from "../controllers/medicalRecordsController.js";

import {
  getNotifications as getNotificationsList,
  getUnreadNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications
} from "../controllers/notificationController.js";

import {
  verifyToken,
  isPatient,
  isDoctor,
  isNurse,
  isAdmin,
  isSuperAdmin
} from "../middleware/authMiddleware.js";

import { homePage } from "../controllers/homeController.js";
import {
  doctorDashboardPage,
  getDoctorOverview,
  getTodaySchedule,
  getDoctorNotifications,
  updateAppointmentStatus,
  clearDoctorNotifications
} from "../controllers/doctorDashboardController.js";
import { healthCheck, dashboardSummary } from "../controllers/healthController.js";

const router = express.Router();

// ==================== PUBLIC ROUTES ====================
router.get("/", homePage);
router.get("/login", loginPage);
router.post("/login", loginUser);
router.get("/register", registerPage);
router.post("/register", registerUser);
router.post("/register/doctor", registerDoctor);
router.post("/register/nurse", registerNurse);
router.get("/forgot-password", forgotPasswordPage);

// ==================== AUTHENTICATED ROUTES ====================
router.post("/logout", verifyToken, logoutUser);

// ==================== PATIENT ROUTES ====================
router.get("/patient-dashboard", verifyToken, isPatient, patientDashboardPage);
router.put("/patient/profile", verifyToken, isPatient, updatePatientProfile);
router.get("/patient/appointments", verifyToken, isPatient, getPatientAppointments);
router.post("/patient/book-appointment", verifyToken, isPatient, bookAppointment);
router.put("/patient/cancel-appointment", verifyToken, isPatient, cancelAppointment);
router.get("/patient/medical-records", verifyToken, isPatient, getMedicalRecords);
router.get("/patient/notifications", verifyToken, isPatient, getNotifications);
router.put("/patient/notifications/:notificationId/read", verifyToken, isPatient, markNotificationAsRead);
router.get("/patient/search-doctors", verifyToken, isPatient, searchDoctors);

// ==================== DOCTOR ROUTES ====================
router.get("/doctor-dashboard", verifyToken, isDoctor, doctorDashboardPage);
router.get("/doctor/overview", verifyToken, isDoctor, getDoctorOverview);
router.get("/doctor/today-schedule", verifyToken, isDoctor, getTodaySchedule);
router.get("/doctor/notifications", verifyToken, isDoctor, getDoctorNotifications);
router.put("/doctor/update-appointment/:appointmentId", verifyToken, isDoctor, updateAppointmentStatus);
router.delete("/doctor/clear-notifications", verifyToken, isDoctor, clearDoctorNotifications);

router.post("/consultation/start", verifyToken, isDoctor, startConsultation);
router.post("/consultation/end", verifyToken, isDoctor, endConsultation);
router.get("/consultation/history", verifyToken, isDoctor, getConsultationHistory);
router.get("/consultation/:consultationId", verifyToken, isDoctor, getChatHistory);

router.post("/medical-record", verifyToken, isDoctor, createMedicalRecord);
router.get("/medical-record/patient/:patientId", verifyToken, isDoctor, getPatientMedicalRecords);
router.get("/medical-record/:recordId", verifyToken, isDoctor, getMedicalRecord);
router.put("/medical-record/:recordId", verifyToken, isDoctor, updateMedicalRecord);
router.post("/prescription", verifyToken, isDoctor, addPrescription);

// ==================== NURSE ROUTES ====================
router.get("/nurse-dashboard", verifyToken, isNurse, nurseDashboardPage);
router.get("/nurse/assigned-patients", verifyToken, isNurse, getAssignedPatients);
router.put("/nurse/patient-record/:patientId", verifyToken, isNurse, updatePatientRecord);
router.get("/nurse/patient-history/:patientId", verifyToken, isNurse, getPatientHistory);
router.put("/nurse/notifications/:notificationId/read", verifyToken, isNurse, nurseMarkNotification);
router.post("/nurse/appointments/:appointmentId/approve", verifyToken, isNurse, approveAppointment);
router.post("/nurse/appointments/:appointmentId/reschedule", verifyToken, isNurse, rescheduleAppointment);
router.post("/nurse/patient-vitals/:patientId", verifyToken, isNurse, recordVitals);
router.post("/nurse/follow-ups/:patientId", verifyToken, isNurse, createFollowUp);

// ==================== ADMIN ROUTES ====================
router.get("/admin-dashboard", verifyToken, isAdmin, adminDashboardPage);
router.put("/admin/doctor/:userId/approve", verifyToken, isAdmin, approveDoctorRegistration);
router.put("/admin/doctor/:userId/reject", verifyToken, isAdmin, rejectDoctorRegistration);
router.put("/admin/nurse/:userId/approve", verifyToken, isAdmin, approveNurseRegistration);
router.put("/admin/nurse/:userId/reject", verifyToken, isAdmin, rejectNurseRegistration);
router.get("/admin/users", verifyToken, isAdmin, getAllUsers);
router.put("/admin/user/:userId/block", verifyToken, isAdmin, blockUser);
router.put("/admin/user/:userId/unblock", verifyToken, isAdmin, unblockUser);
router.get("/admin/reports", verifyToken, isAdmin, getSystemReports);
router.get("/admin/activity-logs", verifyToken, isAdmin, getActivityLog);

// ==================== CONSULTATION ROUTES ====================
router.post("/consultation/schedule", verifyToken, scheduleConsultation);
router.put("/consultation/:appointmentId/reschedule", verifyToken, rescheduleConsultation);
router.put("/consultation/:appointmentId/cancel", verifyToken, cancelConsultation);

// ==================== MEDICAL RECORDS ROUTES ====================
router.get("/medical-record/patient/:patientId/history", verifyToken, getPatientMedicalHistory);
router.get("/medical-record/:recordId/download", verifyToken, downloadMedicalRecord);
router.post("/medical-record/:recordId/share", verifyToken, shareRecord);
router.get("/prescription/patient/:patientId", verifyToken, getPrescriptions);

// ==================== NOTIFICATION ROUTES ====================
router.get("/notifications", verifyToken, getNotificationsList);
router.get("/notifications/unread", verifyToken, getUnreadNotifications);
router.put("/notifications/:notificationId/read", verifyToken, markAsRead);
router.put("/notifications/read-all", verifyToken, markAllAsRead);
router.delete("/notifications/:notificationId", verifyToken, deleteNotification);
router.delete("/notifications/delete-all", verifyToken, deleteAllNotifications);

// ==================== HEALTH CHECK ====================
router.get("/health", healthCheck);
router.get("/dashboard/summary", verifyToken, dashboardSummary);

export default router;
