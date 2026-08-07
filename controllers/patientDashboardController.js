/*
MIT License

Copyright (c) 2025 Christian I. Cabrera || XianFire Framework
Mindoro State University - Philippines
*/

import { Patient } from "../models/patientModel.js";
import { Appointment } from "../models/appointmentModel.js";
import { MedicalRecord } from "../models/medicalRecordModel.js";
import { Prescription } from "../models/prescriptionModel.js";
import { Doctor } from "../models/doctorModel.js";
import { DoctorAvailability } from "../models/doctorAvailabilityModel.js";
import { Notification } from "../models/notificationModel.js";
import { Nurse } from "../models/nurseModel.js";
import { User } from "../models/userModel.js";
import { PatientBooking } from "../models/patientBookingModel.js";
import { PatientDocument } from "../models/patientDocumentModel.js";
import { PatientMedicalHistory } from "../models/patientMedicalHistoryModel.js";
import { PatientMessage } from "../models/patientMessageModel.js";
import { PaymentTransaction } from "../models/paymentTransactionModel.js";
import { Consultation } from "../models/consultationModel.js";
import { ActivityLog } from "../models/activityLogModel.js";
import { Op, fn, col } from "sequelize";

// 1. Patient Dashboard Main Page
export const patientDashboardPage = async (req, res) => {
  try {
    const userId = req.user?.id || req.session?.userId;

    if (!userId) {
      return res.redirect("/login");
    }

    const patient = await Patient.findOne({ 
      where: { userId },
      include: [{ model: User, attributes: ["id", "name", "email"] }]
    });
    
    if (!patient) {
      // Auto-create patient profile if it doesn't exist
      console.log(`Creating patient profile for user ${userId}`);
      const user = await User.findOne({ where: { id: userId } });
      if (user) {
        const newPatient = await Patient.create({
          userId: userId,
          bloodType: "O+",
          allergies: "None",
          medicalConditions: "None"
        });
        return res.redirect("/patient-dashboard");
      }
      return res.status(404).render("error", { message: "Patient profile not found" });
    }

    // Get upcoming appointments
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

    // Get active consultations
    let activeConsultations = [];
    try {
      activeConsultations = await Consultation.findAll({
        where: {
          patientId: patient.id,
          status: "active"
        },
        include: [{ model: Doctor, attributes: ["id", "name", "specialization"] }],
        limit: 3
      });
    } catch (err) {
      console.error("Error fetching consultations:", err.message);
    }

    // Get recent prescriptions
    let prescriptions = [];
    try {
      prescriptions = await Prescription.findAll({
        where: { patientId: patient.id },
        include: [{ model: Doctor, attributes: ["id", "name", "specialization"] }],
        order: [["prescribedDate", "DESC"]],
        limit: 5
      });
    } catch (err) {
      console.error("Error fetching prescriptions:", err.message);
    }

    // Get recent medical records
    let recentRecords = [];
    try {
      recentRecords = await MedicalRecord.findAll({
        where: { patientId: patient.id },
        include: [{ model: Doctor, attributes: ["id", "name", "specialization"] }],
        order: [["recordDate", "DESC"]],
        limit: 5
      });
    } catch (err) {
      console.error("Error fetching medical records:", err.message);
    }

    // Get unread messages
    let unreadMessages = [];
    try {
      unreadMessages = await PatientMessage.findAll({
        where: {
          patientId: patient.id,
          isRead: false,
          senderRole: "doctor"
        },
        order: [["createdAt", "DESC"]],
        limit: 5
      });
    } catch (err) {
      console.error("Error fetching messages:", err.message);
    }

    // Get unread notifications
    let notifications = [];
    try {
      notifications = await Notification.findAll({
        where: {
          userId,
          isRead: false
        },
        limit: 5,
        order: [["createdAt", "DESC"]]
      });
    } catch (err) {
      console.error("Error fetching notifications:", err.message);
    }

    // Get patient medical history
    let medicalHistory = [];
    try {
      medicalHistory = await PatientMedicalHistory.findAll({
        where: { patientId: patient.id },
        order: [["createdAt", "DESC"]],
        limit: 5
      });
    } catch (err) {
      console.error("Error fetching medical history:", err.message);
    }

    // Get patient documents
    let patientDocuments = [];
    try {
      patientDocuments = await PatientDocument.findAll({
        where: { patientId: patient.id },
        order: [["uploadedAt", "DESC"]],
        limit: 5
      });
    } catch (err) {
      console.error("Error fetching patient documents:", err.message);
    }

    // Get pending payment transactions
    let pendingPayments = [];
    try {
      pendingPayments = await PaymentTransaction.findAll({
        where: {
          patientId: patient.id,
          status: "pending"
        },
        order: [["createdAt", "DESC"]]
      });
    } catch (err) {
      console.error("Error fetching pending payments:", err.message);
    }

    // Get available doctors for search
    let availableDoctors = [];
    try {
      availableDoctors = await Doctor.findAll({
        where: { status: "active" },
        attributes: ["id", "name", "specialization", "consultationFee", "rating"],
        order: [["name", "ASC"]]
      });
    } catch (err) {
      console.error("Error fetching doctors:", err.message);
    }

    // Get all appointments (for My Appointments table)
    let allAppointments = [];
    try {
      allAppointments = await Appointment.findAll({
        where: { patientId: patient.id },
        include: [{ model: Doctor, attributes: ["id", "name", "specialization"] }],
        order: [["appointmentDate", "DESC"]],
        limit: 20
      });
    } catch (err) {
      console.error("Error fetching all appointments:", err.message);
    }

    // Get payment history
    let paymentHistory = [];
    try {
      paymentHistory = await PaymentTransaction.findAll({
        where: { patientId: patient.id },
        order: [["createdAt", "DESC"]],
        limit: 10
      });
    } catch (err) {
      console.error("Error fetching payment history:", err.message);
    }

    // Get conversations with doctors and nurses
    let conversations = [];
    try {
      conversations = await PatientMessage.findAll({
        where: { patientId: patient.id },
        attributes: ["id", "senderId", "senderRole", "message", "createdAt"],
        order: [["createdAt", "DESC"]],
        limit: 50
      });
    } catch (err) {
      console.error("Error fetching conversations:", err.message);
    }

    // Get medical records with doctor info
    let medicalRecords = [];
    try {
      medicalRecords = await MedicalRecord.findAll({
        where: { patientId: patient.id },
        include: [{ model: Doctor, attributes: ["id", "name"] }],
        order: [["recordDate", "DESC"]],
        limit: 20
      });
    } catch (err) {
      console.error("Error fetching medical records:", err.message);
    }

    // Calculate statistics
    let totalAppointments = 0, completedAppointments = 0, totalPrescriptions = 0, totalConsultations = 0;
    try {
      totalAppointments = await Appointment.count({ where: { patientId: patient.id } });
      completedAppointments = await Appointment.count({
        where: { patientId: patient.id, status: "completed" }
      });
      totalPrescriptions = await Prescription.count({ where: { patientId: patient.id } });
      totalConsultations = await Consultation.count({ where: { patientId: patient.id } });
    } catch (err) {
      console.error("Error calculating statistics:", err.message);
    }

    // Get next appointment details
    const nextAppointment = upcomingAppointments.length > 0 ? upcomingAppointments[0] : null;
    const latestPrescription = prescriptions.length > 0 ? prescriptions[0] : null;
    
    // Get patient initials
    const patientInitials = patient.User ? 
      (patient.User.name?.split(' ')[0]?.charAt(0) + (patient.User.name?.split(' ')[1]?.charAt(0) || '')).toUpperCase() : 
      'P';

    // Get active consultation with doctor details
    const activeConsultation = activeConsultations.length > 0 ? {
      id: activeConsultations[0].id,
      doctorName: activeConsultations[0].Doctor?.name || 'Doctor',
      doctorInitial: activeConsultations[0].Doctor?.name?.charAt(0) || 'D',
      specialization: activeConsultations[0].Doctor?.specialization || 'Specialist',
      experience: '5',
      meetingLink: activeConsultations[0].meetingLink || '#'
    } : null;

    // Format appointments for display
    const appointments = allAppointments.map(apt => ({
      id: apt.id,
      doctorName: apt.Doctor?.name || 'Doctor',
      specialization: apt.Doctor?.specialization || 'Specialist',
      appointmentDate: apt.appointmentDate?.toISOString().split('T')[0] || '',
      time: apt.appointmentDate?.toISOString().split('T')[1]?.substring(0, 5) || '',
      type: apt.consultationType || 'Video',
      status: apt.status
    }));

    // Format prescriptions with doctor names
    const prescriptionsFormatted = prescriptions.map(p => ({
      id: p.id,
      medicineName: p.medicineName || 'Medicine',
      dosage: p.dosage || '1 tablet',
      frequency: p.frequency || 'Once daily',
      duration: p.duration || '7 days',
      instructions: p.instructions || 'Take after meals',
      doctorName: p.Doctor?.name || 'Doctor',
      createdAt: p.prescribedDate?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0]
    }));

    // Format medical records
    const medicalRecordsFormatted = medicalRecords.map(r => ({
      id: r.id,
      type: r.recordType || 'Document',
      fileName: r.fileName || 'Medical Record',
      date: r.recordDate?.toISOString().split('T')[0] || '',
      doctorName: r.Doctor?.name || 'Doctor'
    }));

    // Calculate account balance and due amount
    const totalPayments = paymentHistory.reduce((sum, p) => p.status === 'completed' ? sum + p.amount : sum, 0);
    const accountBalance = Math.max(0, totalPayments - (pendingPayments.reduce((sum, p) => sum + p.amount, 0)));
    const dueAmount = pendingPayments.reduce((sum, p) => sum + p.amount, 0);

    // Format payment history
    const paymentHistoryFormatted = paymentHistory.map(p => ({
      date: p.createdAt?.toISOString().split('T')[0] || '',
      description: p.description || 'Consultation Fee',
      amount: p.amount || 0,
      method: p.paymentMethod || 'Card',
      status: p.status
    }));

    const viewData = {
      title: "Patient Dashboard",
      patientName: patient.User ? patient.User.name : 'Patient',
      patientInitials,
      patient,
      upcomingAppointments,
      activeConsultations,
      prescriptions: prescriptionsFormatted,
      recentRecords,
      unreadMessages,
      notifications,
      medicalHistory,
      patientDocuments,
      pendingPayments,
      doctors: availableDoctors,
      appointments,
      medicalRecords: medicalRecordsFormatted,
      paymentHistory: paymentHistoryFormatted,
      nextAppointment,
      latestPrescription: latestPrescription ? {
        medicineName: latestPrescription.medicineName || 'Medicine',
        dosage: latestPrescription.dosage || '1 tablet',
        doctorName: latestPrescription.Doctor?.name || 'Doctor'
      } : null,
      activeConsultation,
      accountBalance: Math.round(accountBalance * 100) / 100,
      dueAmount: Math.round(dueAmount * 100) / 100,
      upcomingCount: upcomingAppointments.length,
      activeConsultations: activeConsultations.length,
      unreadMessages: unreadMessages.length,
      totalRecords: medicalRecords.length,
      labReports: medicalRecords.filter(r => r.recordType === 'Lab Report').length,
      xrayReports: medicalRecords.filter(r => r.recordType === 'X-Ray').length,
      otherRecords: medicalRecords.filter(r => r.recordType !== 'Lab Report' && r.recordType !== 'X-Ray').length,
      conversations: availableDoctors.map(d => ({
        id: d.id,
        doctorName: d.name,
        doctorInitial: d.name?.charAt(0) || 'D',
        lastMessage: 'Last message from conversation',
        time: new Date().toLocaleTimeString(),
        unread: false,
        messages: [
          { sender: 'doctor', text: 'Hello! How can I help you?', time: '10:30 AM' }
        ]
      })),
      selectedConversation: null,
      stats: {
        upcomingAppointments: upcomingAppointments.length,
        totalAppointments,
        completedAppointments,
        totalPrescriptions,
        totalConsultations,
        unreadMessages: unreadMessages.length,
        pendingPayments: pendingPayments.length
      }
    };

    res.render("patient-dashboard-ui", viewData);
  } catch (error) {
    console.error("Error in patientDashboardPage:", error);
    res.status(500).render("error", { message: "Error loading patient dashboard" });
  }
};

// 2. Update Patient Profile
export const updatePatientProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { age, gender, bloodType, phone, address, allergies } = req.body;

    const patient = await Patient.findOne({ where: { userId } });
    if (!patient) {
      return res.status(404).json({ error: "Patient not found" });
    }

    if (age) patient.age = age;
    if (gender) patient.gender = gender;
    if (bloodType) patient.bloodType = bloodType;
    if (phone) patient.phone = phone;
    if (address) patient.address = address;
    if (allergies) patient.allergies = allergies;

    await patient.save();

    // Log activity
    await ActivityLog.create({
      userId,
      action: "UPDATE_PROFILE",
      details: "Patient updated their profile information"
    });

    res.json({ success: true, message: "Profile updated successfully", patient });
  } catch (error) {
    console.error("Error updating patient profile:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
};

// 3. Get Doctors with Search and Filter
export const searchDoctors = async (req, res) => {
  try {
    const { specialization, name, minRating } = req.query;
    const where = { status: "active" };

    if (specialization) where.specialization = { [Op.like]: `%${specialization}%` };
    if (name) where.name = { [Op.like]: `%${name}%` };

    const doctors = await Doctor.findAll({
      where,
      attributes: ["id", "name", "specialization", "consultationFee", "rating", "experience"],
      order: [["rating", "DESC"]],
      limit: 20
    });

    // Filter by rating if provided
    const filteredDoctors = minRating
      ? doctors.filter(d => d.rating >= parseFloat(minRating))
      : doctors;

    res.json(filteredDoctors);
  } catch (error) {
    console.error("Error searching doctors:", error);
    res.status(500).json({ error: "Failed to search doctors" });
  }
};

// 4. Get Doctor Details with Availability
export const getDoctorDetails = async (req, res) => {
  try {
    const { doctorId } = req.params;

    const doctor = await Doctor.findByPk(doctorId, {
      include: [
        {
          model: DoctorAvailability,
          attributes: ["id", "dayOfWeek", "startTime", "endTime", "location"]
        }
      ]
    });

    if (!doctor) {
      return res.status(404).json({ error: "Doctor not found" });
    }

    res.json(doctor);
  } catch (error) {
    console.error("Error fetching doctor details:", error);
    res.status(500).json({ error: "Failed to fetch doctor details" });
  }
};

// 5. Book Appointment
export const bookAppointment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { doctorId, appointmentDate, consultationType, symptoms, reason } = req.body;

    const patient = await Patient.findOne({ where: { userId } });
    if (!patient) {
      return res.status(404).json({ error: "Patient not found" });
    }

    const doctor = await Doctor.findByPk(doctorId);
    if (!doctor) {
      return res.status(404).json({ error: "Doctor not found" });
    }

    // Create appointment
    const appointment = await Appointment.create({
      patientId: patient.id,
      doctorId,
      appointmentDate: new Date(appointmentDate),
      consultationType,
      status: "pending",
      notes: symptoms || reason
    });

    // Create patient booking record
    const booking = await PatientBooking.create({
      patientId: patient.id,
      doctorId,
      appointmentId: appointment.id,
      consultationType,
      symptoms,
      reason,
      status: "pending"
    });

    // Create payment transaction if applicable
    if (doctor.consultationFee) {
      await PaymentTransaction.create({
        patientId: patient.id,
        doctorId,
        appointmentId: appointment.id,
        amount: doctor.consultationFee,
        status: "pending",
        description: `Consultation fee for appointment with ${doctor.name}`
      });
    }

    // Create notification for doctor
    await Notification.create({
      userId: doctor.userId,
      type: "appointment_booked",
      message: `${patient.name} has booked an appointment`,
      relatedId: appointment.id,
      isRead: false
    });

    // Log activity
    await ActivityLog.create({
      userId,
      action: "BOOK_APPOINTMENT",
      details: `Patient booked appointment with Dr. ${doctor.name}`
    });

    res.json({ success: true, message: "Appointment booked successfully", appointment, booking });
  } catch (error) {
    console.error("Error booking appointment:", error);
    res.status(500).json({ error: "Failed to book appointment" });
  }
};

// 6. Get Appointment History
export const getAppointmentHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status } = req.query;

    const patient = await Patient.findOne({ where: { userId } });
    if (!patient) {
      return res.status(404).json({ error: "Patient not found" });
    }

    const where = { patientId: patient.id };
    if (status) where.status = status;

    const appointments = await Appointment.findAll({
      where,
      include: [{ model: Doctor, attributes: ["id", "name", "specialization", "consultationFee"] }],
      order: [["appointmentDate", "DESC"]]
    });

    res.json(appointments);
  } catch (error) {
    console.error("Error fetching appointments:", error);
    res.status(500).json({ error: "Failed to fetch appointments" });
  }
};

// 7. Join Consultation
export const joinConsultation = async (req, res) => {
  try {
    const userId = req.user.id;
    const { appointmentId } = req.params;

    const patient = await Patient.findOne({ where: { userId } });
    if (!patient) {
      return res.status(404).json({ error: "Patient not found" });
    }

    const appointment = await Appointment.findOne({
      where: { id: appointmentId, patientId: patient.id }
    });

    if (!appointment) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    // Get or create consultation record
    let consultation = await Consultation.findOne({
      where: { appointmentId }
    });

    if (!consultation) {
      consultation = await Consultation.create({
        patientId: patient.id,
        doctorId: appointment.doctorId,
        appointmentId,
        status: "active",
        startTime: new Date(),
        consultationType: appointment.consultationType
      });

      // Generate meeting link (placeholder - in real app, integrate with Zoom/Jitsi)
      const meetingLink = `https://mediserve.local/consultation/${consultation.id}`;
      consultation.meetingLink = meetingLink;
      await consultation.save();
    }

    // Update appointment status
    appointment.status = "in-progress";
    await appointment.save();

    // Log activity
    await ActivityLog.create({
      userId,
      action: "JOIN_CONSULTATION",
      details: `Patient joined consultation ${consultation.id}`
    });

    res.json({ success: true, consultation, meetingLink: consultation.meetingLink });
  } catch (error) {
    console.error("Error joining consultation:", error);
    res.status(500).json({ error: "Failed to join consultation" });
  }
};

// 8. Get Prescription History
export const getPrescriptionHistory = async (req, res) => {
  try {
    const userId = req.user.id;

    const patient = await Patient.findOne({ where: { userId } });
    if (!patient) {
      return res.status(404).json({ error: "Patient not found" });
    }

    const prescriptions = await Prescription.findAll({
      where: { patientId: patient.id },
      include: [{ model: Doctor, attributes: ["id", "name", "specialization"] }],
      order: [["prescribedDate", "DESC"]]
    });

    res.json(prescriptions);
  } catch (error) {
    console.error("Error fetching prescriptions:", error);
    res.status(500).json({ error: "Failed to fetch prescriptions" });
  }
};

// 9. Get Medical Records
export const getMedicalRecords = async (req, res) => {
  try {
    const userId = req.user.id;

    const patient = await Patient.findOne({ where: { userId } });
    if (!patient) {
      return res.status(404).json({ error: "Patient not found" });
    }

    const records = await MedicalRecord.findAll({
      where: { patientId: patient.id },
      include: [{ model: Doctor, attributes: ["id", "name", "specialization"] }],
      order: [["recordDate", "DESC"]]
    });

    res.json(records);
  } catch (error) {
    console.error("Error fetching medical records:", error);
    res.status(500).json({ error: "Failed to fetch medical records" });
  }
};

// 10. Add Medical History
export const addMedicalHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { recordType, description, startDate, endDate, severity, notes } = req.body;

    const patient = await Patient.findOne({ where: { userId } });
    if (!patient) {
      return res.status(404).json({ error: "Patient not found" });
    }

    const history = await PatientMedicalHistory.create({
      patientId: patient.id,
      recordType,
      description,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      severity,
      status: "active",
      notes
    });

    await ActivityLog.create({
      userId,
      action: "ADD_MEDICAL_HISTORY",
      details: `Patient added ${recordType} to medical history`
    });

    res.json({ success: true, message: "Medical history added successfully", history });
  } catch (error) {
    console.error("Error adding medical history:", error);
    res.status(500).json({ error: "Failed to add medical history" });
  }
};

// 11. Upload Patient Document
export const uploadPatientDocument = async (req, res) => {
  try {
    const userId = req.user.id;
    const { documentType, description } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const patient = await Patient.findOne({ where: { userId } });
    if (!patient) {
      return res.status(404).json({ error: "Patient not found" });
    }

    const document = await PatientDocument.create({
      patientId: patient.id,
      documentType,
      fileName: req.file.filename,
      filePath: `/uploads/${req.file.filename}`,
      originalName: req.file.originalname,
      description
    });

    await ActivityLog.create({
      userId,
      action: "UPLOAD_DOCUMENT",
      details: `Patient uploaded document: ${req.file.originalname}`
    });

    res.json({ success: true, message: "Document uploaded successfully", document });
  } catch (error) {
    console.error("Error uploading document:", error);
    res.status(500).json({ error: "Failed to upload document" });
  }
};

// 12. Get Patient Documents
export const getPatientDocuments = async (req, res) => {
  try {
    const userId = req.user.id;

    const patient = await Patient.findOne({ where: { userId } });
    if (!patient) {
      return res.status(404).json({ error: "Patient not found" });
    }

    const documents = await PatientDocument.findAll({
      where: { patientId: patient.id },
      order: [["uploadedAt", "DESC"]]
    });

    res.json(documents);
  } catch (error) {
    console.error("Error fetching documents:", error);
    res.status(500).json({ error: "Failed to fetch documents" });
  }
};

// 13. Get Messages with Doctor
export const getPatientMessages = async (req, res) => {
  try {
    const userId = req.user.id;
    const { doctorId } = req.params;

    const patient = await Patient.findOne({ where: { userId } });
    if (!patient) {
      return res.status(404).json({ error: "Patient not found" });
    }

    const messages = await PatientMessage.findAll({
      where: {
        patientId: patient.id,
        doctorId,
        [Op.or]: [
          { senderRole: "patient" },
          { senderRole: "doctor" }
        ]
      },
      order: [["createdAt", "ASC"]]
    });

    // Mark doctor messages as read
    await PatientMessage.update(
      { isRead: true, readAt: new Date() },
      {
        where: {
          patientId: patient.id,
          doctorId,
          senderRole: "doctor",
          isRead: false
        }
      }
    );

    res.json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
};

// 15. Get Payment History
export const getPaymentHistory = async (req, res) => {
  try {
    const userId = req.user.id;

    const patient = await Patient.findOne({ where: { userId } });
    if (!patient) {
      return res.status(404).json({ error: "Patient not found" });
    }

    const payments = await PaymentTransaction.findAll({
      where: { patientId: patient.id },
      include: [
        { model: Doctor, attributes: ["id", "name"] }
      ],
      order: [["transactionDate", "DESC"]]
    });

    res.json(payments);
  } catch (error) {
    console.error("Error fetching payment history:", error);
    res.status(500).json({ error: "Failed to fetch payment history" });
  }
};

// 16. Make Payment
export const makePayment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { transactionId, paymentMethod, amount } = req.body;

    const payment = await PaymentTransaction.findByPk(transactionId);
    if (!payment) {
      return res.status(404).json({ error: "Payment not found" });
    }

    payment.status = "completed";
    payment.paymentMethod = paymentMethod;
    payment.transactionDate = new Date();
    payment.invoiceNumber = `INV-${Date.now()}`;
    await payment.save();

    // Create notification
    await Notification.create({
      userId,
      type: "payment_completed",
      message: `Payment of ${payment.currency} ${amount} completed successfully`,
      relatedId: payment.id,
      isRead: false
    });

    await ActivityLog.create({
      userId,
      action: "MAKE_PAYMENT",
      details: `Patient made payment: ${payment.currency} ${amount}`
    });

    res.json({ success: true, message: "Payment processed successfully", payment });
  } catch (error) {
    console.error("Error processing payment:", error);
    res.status(500).json({ error: "Failed to process payment" });
  }
};

// 17. Get Notifications
export const getPatientNotifications = async (req, res) => {
  try {
    const userId = req.user.id;

    const notifications = await Notification.findAll({
      where: { userId },
      order: [["createdAt", "DESC"]],
      limit: 20
    });

    res.json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
};

// 18. Mark Notification as Read
export const markNotificationRead = async (req, res) => {
  try {
    const { notificationId } = req.params;

    const notification = await Notification.findByPk(notificationId);
    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    notification.isRead = true;
    await notification.save();

    res.json({ success: true, notification });
  } catch (error) {
    console.error("Error marking notification:", error);
    res.status(500).json({ error: "Failed to mark notification" });
  }
};

// 19. Get Patient Health Analytics
export const getPatientAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;

    const patient = await Patient.findOne({ where: { userId } });
    if (!patient) {
      return res.status(404).json({ error: "Patient not found" });
    }

    // Get appointment trends
    const appointmentStats = await Appointment.findAll({
      where: { patientId: patient.id },
      attributes: [
        [fn("COUNT", col("id")), "count"],
        [fn("DATE_FORMAT", col("appointmentDate"), "%Y-%m"), "month"]
      ],
      group: [fn("DATE_FORMAT", col("appointmentDate"), "%Y-%m")],
      order: [[fn("DATE_FORMAT", col("appointmentDate"), "%Y-%m"), "DESC"]],
      raw: true
    });

    // Get consultation frequency by doctor specialization
    const consultationBySpecialization = await Consultation.findAll({
      where: { patientId: patient.id },
      include: [{
        model: Doctor,
        attributes: ["specialization"],
        duplicating: false
      }],
      raw: true
    });

    const specializationCounts = {};
    consultationBySpecialization.forEach(c => {
      const spec = c["Doctor.specialization"];
      specializationCounts[spec] = (specializationCounts[spec] || 0) + 1;
    });

    // Get prescription trends
    const prescriptionStats = await Prescription.findAll({
      where: { patientId: patient.id },
      attributes: [
        [fn("COUNT", col("id")), "count"],
        [fn("DATE_FORMAT", col("prescribedDate"), "%Y-%m"), "month"]
      ],
      group: [fn("DATE_FORMAT", col("prescribedDate"), "%Y-%m")],
      raw: true
    });

    res.json({
      appointmentTrends: appointmentStats,
      consultationBySpecialization: specializationCounts,
      prescriptionTrends: prescriptionStats
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
};

export const cancelAppointment = async (req, res) => {
  try {
    const userId = req.user?.id || req.session?.userId;
    const { appointmentId, reason } = req.body;

    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const patient = await Patient.findOne({ where: { userId } });
    if (!patient) {
      return res.status(404).json({ error: "Patient not found" });
    }

    const appointment = await Appointment.findByPk(appointmentId);

    if (!appointment || appointment.patientId !== patient.id) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    appointment.status = "cancelled";
    await appointment.save();

    await Notification.create({
      userId,
      type: "appointment",
      title: "Appointment Cancelled",
      message: `Your appointment has been cancelled. ${reason || ""}`,
      relatedId: appointment.id
    });

    res.json({ success: true, message: "Appointment cancelled successfully" });
  } catch (error) {
    console.error("Error cancelling appointment:", error);
    res.status(500).json({ error: "Failed to cancel appointment" });
  }
};

export const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 20, offset = 0 } = req.query;

    const notifications = await Notification.findAll({
      where: { userId },
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [["createdAt", "DESC"]]
    });

    const total = await Notification.count({ where: { userId } });

    res.json({ notifications, total });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
};

export const markNotificationAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;

    await Notification.update(
      { isRead: true },
      { where: { id: notificationId } }
    );

    res.json({ success: true });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ error: "Failed to update notification" });
  }
};

export const requestConsultation = async (req, res) => {
  try {
    const userId = req.user?.id || req.session?.userId;
    if (!userId) {
      return res.redirect("/login");
    }

    const { doctorId, consultationMode, concern, preferredDateTime } = req.body;
    if (!doctorId || !consultationMode || !concern || !preferredDateTime) {
      return res.redirect("/patient-dashboard?consultation=error");
    }

    if (!["chat", "video"].includes(consultationMode)) {
      return res.redirect("/patient-dashboard?consultation=error");
    }

    const patient = await Patient.findOne({ where: { userId } });
    const doctor = await Doctor.findByPk(doctorId);

    if (!patient || !doctor) {
      return res.redirect("/patient-dashboard?consultation=error");
    }

    const modeLabel = consultationMode === "video" ? "Video Consultation" : "Chat Consultation";
    const patientName = patient.name || "Patient";

    // Notify selected doctor
    await Notification.create({
      userId: doctor.userId,
      type: "appointment",
      title: `New ${modeLabel} Request`,
      message: `${patientName} requested a ${consultationMode} consultation on ${new Date(preferredDateTime).toLocaleString()}. Concern: ${concern}`,
      isRead: false
    });

    // Notify all nurses
    const nurses = await Nurse.findAll({ attributes: ["userId"] });
    if (nurses.length) {
      await Notification.bulkCreate(
        nurses.map((nurse) => ({
          userId: nurse.userId,
          type: "appointment",
          title: `Patient ${modeLabel} Request`,
          message: `${patientName} requested a ${consultationMode} consultation with Dr. ${doctor.name}.`,
          isRead: false
        }))
      );
    }

    // Notify admins and super admins
    const admins = await User.findAll({
      where: { role: { [Op.in]: ["admin", "super_admin"] } },
      attributes: ["id"]
    });

    if (admins.length) {
      await Notification.bulkCreate(
        admins.map((admin) => ({
          userId: admin.id,
          type: "system_alert",
          title: `New ${modeLabel} Request`,
          message: `${patientName} submitted a ${consultationMode} consultation request.`,
          isRead: false
        }))
      );
    }

    // Confirmation notification for patient
    await Notification.create({
      userId,
      type: "appointment",
      title: "Consultation Request Sent",
      message: `Your ${consultationMode} consultation request has been sent to Dr. ${doctor.name}.`,
      isRead: false
    });

    return res.redirect("/patient-dashboard?consultation=sent");
  } catch (error) {
    console.error("Error requesting consultation:", error);
    return res.redirect("/patient-dashboard?consultation=error");
  }
};

export const downloadMedicalRecord = async (req, res) => {
  try {
    const userId = req.user?.id || req.session?.userId;
    const { recordId } = req.params;

    if (!userId) {
      return res.redirect("/login");
    }

    const patient = await Patient.findOne({ where: { userId } });
    const record = await MedicalRecord.findByPk(recordId);

    if (!record || record.patientId !== patient.id) {
      return res.status(404).json({ error: "Medical record not found" });
    }

    // Create a JSON representation of the medical record
    const recordData = {
      recordId: record.id,
      patientName: patient.name,
      recordDate: record.recordDate,
      diagnosis: record.diagnosis,
      treatment: record.treatment,
      doctorName: record.doctorName || "N/A",
      notes: record.notes,
      downloadedAt: new Date().toLocaleString()
    };

    // Send as JSON file download
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", `attachment; filename="medical-record-${recordId}.json"`);
    res.send(JSON.stringify(recordData, null, 2));
  } catch (error) {
    console.error("Error downloading medical record:", error);
    res.status(500).json({ error: "Failed to download medical record" });
  }
};

export const downloadPrescription = async (req, res) => {
  try {
    const userId = req.user?.id || req.session?.userId;
    const { prescriptionId } = req.params;

    if (!userId) {
      return res.redirect("/login");
    }

    const patient = await Patient.findOne({ where: { userId } });
    const prescription = await Prescription.findByPk(prescriptionId);

    if (!prescription) {
      return res.status(404).json({ error: "Prescription not found" });
    }

    // Verify patient owns this prescription via medical record
    const record = await MedicalRecord.findByPk(prescription.medicalRecordId);
    if (!record || record.patientId !== patient.id) {
      return res.status(404).json({ error: "Prescription not found" });
    }

    const prescriptionData = {
      prescriptionId: prescription.id,
      patientName: patient.name,
      medicineName: prescription.medicineName,
      dosage: prescription.dosage,
      frequency: prescription.frequency,
      duration: prescription.duration,
      instructions: prescription.instructions,
      prescribedDate: prescription.prescribedDate,
      prescribedBy: prescription.prescribedBy || "Doctor",
      downloadedAt: new Date().toLocaleString()
    };

    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", `attachment; filename="prescription-${prescriptionId}.json"`);
    res.send(JSON.stringify(prescriptionData, null, 2));
  } catch (error) {
    console.error("Error downloading prescription:", error);
    res.status(500).json({ error: "Failed to download prescription" });
  }
};

export const printPrescription = async (req, res) => {
  try {
    const userId = req.user?.id || req.session?.userId;
    const { prescriptionId } = req.params;

    if (!userId) {
      return res.redirect("/login");
    }

    const patient = await Patient.findOne({ where: { userId } });
    const prescription = await Prescription.findByPk(prescriptionId);

    if (!prescription) {
      return res.status(404).json({ error: "Prescription not found" });
    }

    // Verify patient owns this prescription
    const record = await MedicalRecord.findByPk(prescription.medicalRecordId);
    if (!record || record.patientId !== patient.id) {
      return res.status(404).json({ error: "Prescription not found" });
    }

    // Create HTML for printing
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Prescription</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          .header { border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 20px; }
          .pharmacy-name { font-size: 24px; font-weight: bold; color: #0066cc; }
          .prescription-details { margin: 20px 0; }
          .detail-row { display: flex; margin: 10px 0; }
          .detail-label { font-weight: bold; width: 150px; }
          .medicine-box { border: 1px solid #ddd; padding: 20px; margin: 20px 0; background: #f9f9f9; }
          .instructions { margin-top: 20px; padding: 15px; background: #fff3cd; border-left: 4px solid #ffc107; }
          .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; }
          .print-button { display: none; }
          @media print {
            .print-button { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="pharmacy-name">MEDISERVE</div>
          <p>Online Consultation & Medical Records System</p>
        </div>
        
        <div class="prescription-details">
          <div class="detail-row">
            <div class="detail-label">Patient Name:</div>
            <div>${patient.name}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Issued Date:</div>
            <div>${new Date(prescription.prescribedDate).toLocaleDateString()}</div>
          </div>
        </div>
        
        <div class="medicine-box">
          <h3>Medicine Details</h3>
          <div class="detail-row">
            <div class="detail-label">Medicine Name:</div>
            <div><strong>${prescription.medicineName}</strong></div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Dosage:</div>
            <div>${prescription.dosage}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Frequency:</div>
            <div>${prescription.frequency}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Duration:</div>
            <div>${prescription.duration}</div>
          </div>
        </div>
        
        ${prescription.instructions ? `
        <div class="instructions">
          <strong>Special Instructions:</strong>
          <p>${prescription.instructions}</p>
        </div>
        ` : ''}
        
        <div class="footer">
          <p>This prescription is issued by ${prescription.prescribedBy || 'Doctor'}.</p>
          <p>Prescription ID: ${prescription.id}</p>
          <p>Please consult your pharmacist if you have any questions about this prescription.</p>
        </div>
      </body>
      </html>
    `;

    res.setHeader("Content-Type", "text/html");
    res.send(htmlContent);
  } catch (error) {
    console.error("Error printing prescription:", error);
    res.status(500).json({ error: "Failed to print prescription" });
  }
};

export const rateDoctorOrService = async (req, res) => {
  try {
    const userId = req.user?.id || req.session?.userId;
    const { doctorId, rating, feedback, appointmentId } = req.body;

    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: "Rating must be between 1 and 5" });
    }

    const patient = await Patient.findOne({ where: { userId } });
    if (!patient) {
      return res.status(404).json({ error: "Patient not found" });
    }

    // Verify patient had an appointment with this doctor
    if (appointmentId) {
      const appointment = await Appointment.findByPk(appointmentId);
      if (!appointment || appointment.patientId !== patient.id) {
        return res.status(404).json({ error: "Appointment not found" });
      }
    }

    // Create a feedback record (you can create a Feedback model if needed)
    // For now, we'll create a notification to track the feedback
    await Notification.create({
      userId: doctorId,
      type: "feedback",
      title: `New Rating from ${patient.name}`,
      message: `${patient.name} rated you ${rating}/5. Feedback: ${feedback || "No comment"}`,
      isRead: false,
      relatedId: appointmentId
    });

    // Send confirmation to patient
    await Notification.create({
      userId,
      type: "feedback",
      title: "Rating Submitted",
      message: `Thank you for rating your consultation experience. Your feedback helps us improve our services.`,
      isRead: false
    });

    res.json({ success: true, message: "Rating submitted successfully" });
  } catch (error) {
    console.error("Error submitting rating:", error);
    res.status(500).json({ error: "Failed to submit rating" });
  }
};

export const getEditProfilePage = async (req, res) => {
  try {
    const userId = req.user?.id || req.session?.userId;

    if (!userId) {
      return res.redirect("/login");
    }

    const patient = await Patient.findOne({ where: { userId } });
    if (!patient) {
      return res.status(404).render("error", { message: "Patient profile not found" });
    }

    res.render("edit-profile", {
      title: "Edit Profile",
      patient,
      success_msg: req.flash("success_msg"),
      error_msg: req.flash("error_msg")
    });
  } catch (error) {
    console.error("Error in getEditProfilePage:", error);
    res.status(500).render("error", { message: "Error loading edit profile page" });
  }
};

export const editPatientProfile = async (req, res) => {
  try {
    const userId = req.user?.id || req.session?.userId;
    const { name, age, gender, bloodType, phone, address, allergies, medicalHistory } = req.body;

    if (!userId) {
      return res.redirect("/login");
    }

    const patient = await Patient.findOne({ where: { userId } });
    if (!patient) {
      return res.status(404).render("error", { message: "Patient profile not found" });
    }

    // Update patient information
    if (name) patient.name = name;
    if (age) patient.age = age;
    if (gender) patient.gender = gender;
    if (bloodType) patient.bloodType = bloodType;
    if (phone) patient.phone = phone;
    if (address) patient.address = address;
    if (allergies) patient.allergies = allergies;
    if (medicalHistory) patient.medicalHistory = medicalHistory;

    // Handle file upload if present
    if (req.file) {
      const profilePicturePath = `/uploads/${req.file.filename}`;
      patient.profilePicture = profilePicturePath;
    }

    await patient.save();
    req.flash("success_msg", "Profile updated successfully!");
    res.redirect("/profile");
  } catch (error) {
    console.error("Error updating patient profile:", error);
    req.flash("error_msg", "Failed to update profile. Please try again.");
    res.redirect("/profile");
  }
};

export const getAppointmentsPage = async (req, res) => {
  try {
    const userId = req.user?.id || req.session?.userId;

    if (!userId) {
      return res.redirect("/login");
    }

    const patient = await Patient.findOne({ where: { userId } });
    if (!patient) {
      return res.status(404).render("error", { message: "Patient profile not found" });
    }

    const appointments = await Appointment.findAll({
      where: { patientId: patient.id },
      order: [["appointmentDate", "DESC"]]
    });

    // Fetch doctor details separately for each appointment
    const appointmentsWithDoctors = await Promise.all(
      appointments.map(async (appointment) => {
        const doctor = await Doctor.findByPk(appointment.doctorId, {
          attributes: ["id", "name", "specialization"]
        });
        return {
          ...appointment.toJSON(),
          appointmentDateText: new Date(appointment.appointmentDate).toLocaleString(),
          doctor: doctor || { name: "Unknown Doctor", specialization: "N/A" }
        };
      })
    );

    const doctors = await Doctor.findAll({
      where: { status: "active" },
      attributes: ["id", "name", "specialization"],
      order: [["name", "ASC"]]
    });

    res.render("appointments", {
      title: "Appointments",
      patient,
      appointments: appointmentsWithDoctors,
      doctors,
      bookingSuccess: req.query.booked === "1",
      bookingError: req.query.error === "1"
    });
  } catch (error) {
    console.error("Error loading appointments page:", error);
    res.status(500).render("error", { message: "Error loading appointments" });
  }
};

export const createAppointmentFromPage = async (req, res) => {
  try {
    const userId = req.user?.id || req.session?.userId;
    const { doctorId, appointmentDate, consultationType } = req.body;

    if (!userId) {
      return res.redirect("/login");
    }

    if (!doctorId || !appointmentDate || !consultationType) {
      return res.redirect("/appointments?error=1");
    }

    const patient = await Patient.findOne({ where: { userId } });
    if (!patient) {
      return res.redirect("/appointments?error=1");
    }

    const doctor = await Doctor.findByPk(doctorId);
    if (!doctor) {
      return res.redirect("/appointments?error=1");
    }

    const normalizedType = consultationType === "video" ? "video" : "in-person";
    const dateValue = new Date(appointmentDate);
    if (Number.isNaN(dateValue.getTime())) {
      return res.redirect("/appointments?error=1");
    }

    const existingAppointment = await Appointment.findOne({
      where: {
        doctorId,
        appointmentDate: dateValue,
        status: { [Op.ne]: "cancelled" }
      }
    });

    if (existingAppointment) {
      return res.redirect("/appointments?error=1");
    }

    const appointment = await Appointment.create({
      patientId: patient.id,
      doctorId,
      appointmentDate: dateValue,
      consultationType: normalizedType,
      status: "scheduled",
      startTime: dateValue,
      endTime: new Date(dateValue.getTime() + 60 * 60000)
    });

    await Notification.create({
      userId: doctor.userId,
      type: "appointment",
      title: "New Appointment Request",
      message: `${patient.name} booked a ${normalizedType === "video" ? "video call" : "walk-in"} appointment on ${dateValue.toLocaleString()}.`,
      relatedId: appointment.id,
      isRead: false
    });

    await Notification.create({
      userId,
      type: "appointment",
      title: "Appointment Booked",
      message: `Your appointment with Dr. ${doctor.name} is set for ${dateValue.toLocaleString()}.`,
      relatedId: appointment.id,
      isRead: false
    });

    return res.redirect("/appointments?booked=1");
  } catch (error) {
    console.error("Error creating appointment from page:", error);
    return res.redirect("/appointments?error=1");
  }
};

export const getMedicalRecordsPage = async (req, res) => {
  try {
    const userId = req.user?.id || req.session?.userId;

    if (!userId) {
      return res.redirect("/login");
    }

    const patient = await Patient.findOne({ where: { userId } });
    if (!patient) {
      return res.status(404).render("error", { message: "Patient profile not found" });
    }

    const records = await MedicalRecord.findAll({
      where: { patientId: patient.id },
      order: [["recordDate", "DESC"]]
    });

    // Fetch doctor details separately for each record
    const recordsWithDoctors = await Promise.all(
      records.map(async (record) => {
        const doctor = await Doctor.findByPk(record.doctorId, {
          attributes: ["id", "name", "specialization"]
        });
        return {
          ...record.toJSON(),
          doctor: doctor || { name: "Unknown Doctor", specialization: "N/A" },
          recordDateText: new Date(record.recordDate).toLocaleDateString(),
          downloadUrl: `/patient/download-record/${record.id}`,
          printUrl: `/patient/print-record/${record.id}`,
          isDemo: false
        };
      })
    );

    const demoRecords = [
      {
        id: "demo-1",
        diagnosis: "Seasonal Flu",
        treatment: "Rest, fluids, and paracetamol as needed.",
        status: "completed",
        notes: "Patient advised to monitor temperature and return if symptoms worsen.",
        recordDateText: new Date().toLocaleDateString(),
        doctor: { name: "Maria Santos", specialization: "Internal Medicine" },
        downloadUrl: null,
        printUrl: "/patient/print-record/demo-1",
        isDemo: true
      },
      {
        id: "demo-2",
        diagnosis: "Mild Hypertension",
        treatment: "Low-salt diet, exercise, and daily blood pressure monitoring.",
        status: "active",
        notes: "Follow-up checkup scheduled after 2 weeks.",
        recordDateText: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toLocaleDateString(),
        doctor: { name: "Jorge Reyes", specialization: "Cardiology" },
        downloadUrl: null,
        printUrl: "/patient/print-record/demo-2",
        isDemo: true
      }
    ];

    const recordsToShow = recordsWithDoctors.length > 0 ? recordsWithDoctors : demoRecords;

    res.render("medical-records", {
      title: "Medical Records",
      patient,
      records: recordsToShow,
      hasRealRecords: recordsWithDoctors.length > 0
    });
  } catch (error) {
    console.error("Error loading medical records page:", error);
    res.status(500).render("error", { message: "Error loading medical records" });
  }
};

export const printMedicalRecord = async (req, res) => {
  try {
    const userId = req.user?.id || req.session?.userId;
    const { recordId } = req.params;

    if (!userId) {
      return res.redirect("/login");
    }

    const patient = await Patient.findOne({ where: { userId } });
    if (!patient) {
      return res.status(404).render("error", { message: "Patient profile not found" });
    }

    let record = null;
    let doctor = { name: "Unknown Doctor", specialization: "N/A" };

    if (String(recordId).startsWith("demo-")) {
      const demoMap = {
        "demo-1": {
          diagnosis: "Seasonal Flu",
          treatment: "Rest, fluids, and paracetamol as needed.",
          notes: "Patient advised to monitor temperature and return if symptoms worsen.",
          recordDate: new Date().toLocaleDateString(),
          doctor: { name: "Maria Santos", specialization: "Internal Medicine" }
        },
        "demo-2": {
          diagnosis: "Mild Hypertension",
          treatment: "Low-salt diet, exercise, and daily blood pressure monitoring.",
          notes: "Follow-up checkup scheduled after 2 weeks.",
          recordDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toLocaleDateString(),
          doctor: { name: "Jorge Reyes", specialization: "Cardiology" }
        }
      };

      record = demoMap[recordId];
      if (!record) {
        return res.status(404).render("error", { message: "Medical record not found" });
      }
      doctor = record.doctor;
    } else {
      const dbRecord = await MedicalRecord.findByPk(recordId);
      if (!dbRecord || dbRecord.patientId !== patient.id) {
        return res.status(404).render("error", { message: "Medical record not found" });
      }

      const dbDoctor = await Doctor.findByPk(dbRecord.doctorId, {
        attributes: ["name", "specialization"]
      });

      record = {
        diagnosis: dbRecord.diagnosis || "No diagnosis provided",
        treatment: dbRecord.treatment || "No treatment information provided",
        notes: dbRecord.notes || "No additional notes",
        recordDate: new Date(dbRecord.recordDate).toLocaleDateString()
      };

      doctor = dbDoctor || doctor;
    }

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Medical Record Print</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; color: #111827; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #2563eb; padding-bottom: 16px; margin-bottom: 24px; }
          .brand { font-size: 24px; font-weight: 700; color: #2563eb; }
          .meta { color: #6b7280; font-size: 14px; }
          .card { border: 1px solid #e5e7eb; border-radius: 12px; padding: 18px; margin-bottom: 16px; }
          .label { font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: .08em; margin-bottom: 6px; }
          .value { font-size: 16px; font-weight: 600; }
          .section-title { font-size: 18px; font-weight: 700; margin-bottom: 8px; }
          .footer { margin-top: 24px; font-size: 12px; color: #6b7280; text-align: center; }
          @media print { .no-print { display: none; } body { margin: 20px; } }
          .button-bar { margin-bottom: 16px; }
          .btn { display: inline-block; padding: 10px 14px; border-radius: 8px; background: #2563eb; color: white; text-decoration: none; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="button-bar no-print">
          <a href="javascript:window.print()" class="btn">Print Now</a>
        </div>
        <div class="header">
          <div>
            <div class="brand">MEDISERVE</div>
            <div class="meta">Medical Record Result</div>
          </div>
          <div class="meta">Printed: ${new Date().toLocaleString()}</div>
        </div>

        <div class="card">
          <div class="section-title">Patient Information</div>
          <div class="meta">Name: ${patient.name}</div>
          <div class="meta">Record Date: ${record.recordDate}</div>
          <div class="meta">Attending Doctor: ${doctor.name} - ${doctor.specialization}</div>
        </div>

        <div class="card">
          <div class="section-title">Diagnosis</div>
          <div class="value">${record.diagnosis}</div>
        </div>

        <div class="card">
          <div class="section-title">Treatment</div>
          <div class="value">${record.treatment}</div>
        </div>

        <div class="card">
          <div class="section-title">Clinical Notes</div>
          <div class="value">${record.notes}</div>
        </div>

        <div class="footer">This printed page is an official copy of the medical record result.</div>

        <script>
          window.onload = function () { window.print(); };
        </script>
      </body>
      </html>
    `;

    res.setHeader("Content-Type", "text/html");
    res.send(html);
  } catch (error) {
    console.error("Error printing medical record:", error);
    res.status(500).render("error", { message: "Failed to print medical record" });
  }
};

export const getMessagesPage = async (req, res) => {
  try {
    const userId = req.user?.id || req.session?.userId;

    if (!userId) {
      return res.redirect("/login");
    }

    const patient = await Patient.findOne({ where: { userId } });
    if (!patient) {
      return res.status(404).render("error", { message: "Patient profile not found" });
    }

    const doctors = await Doctor.findAll({
      where: { status: "active" },
      attributes: ["id", "name", "specialization"],
      order: [["name", "ASC"]]
    });

    const nurses = await Nurse.findAll({
      attributes: ["id", "name", "specialization"],
      order: [["name", "ASC"]]
    });

    const messageNotifications = await Notification.findAll({
      where: {
        userId,
        type: "status_update"
      },
      order: [["createdAt", "DESC"]],
      limit: 20
    });

    const inboxMessages = messageNotifications
      .filter((note) => !String(note.title || "").startsWith("You sent a message"))
      .map((note) => ({
        ...note.toJSON(),
        createdAtText: new Date(note.createdAt).toLocaleString()
      }));

    const sentMessages = messageNotifications
      .filter((note) => String(note.title || "").startsWith("You sent a message"))
      .map((note) => ({
        ...note.toJSON(),
        createdAtText: new Date(note.createdAt).toLocaleString()
      }));

    res.render("messages", {
      title: "Messages",
      patient,
      doctors,
      nurses,
      inboxMessages,
      sentMessages,
      messageSent: req.query.sent === "1",
      messageError: req.query.error === "1"
    });
  } catch (error) {
    console.error("Error loading messages page:", error);
    res.status(500).render("error", { message: "Error loading messages" });
  }
};

export const sendPatientMessage = async (req, res) => {
  try {
    const userId = req.user?.id || req.session?.userId;
    const { recipient, recipientRole, recipientId, message } = req.body;

    if (!userId) {
      return res.redirect("/login");
    }

    if (!message || !String(message).trim()) {
      return res.redirect("/messages?error=1");
    }

    let recipientType = null;
    let recipientIdNumber = null;

    if (recipientRole && recipientId) {
      recipientType = String(recipientRole).toLowerCase();
      recipientIdNumber = Number(recipientId);
    } else if (recipient) {
      const [combinedType, rawRecipientId] = String(recipient).split(":");
      recipientType = combinedType;
      recipientIdNumber = Number(rawRecipientId);
    }

    if (!recipientType || Number.isNaN(recipientIdNumber)) {
      return res.redirect("/messages?error=1");
    }

    const patient = await Patient.findOne({ where: { userId } });
    if (!patient) {
      return res.redirect("/messages?error=1");
    }

    let recipientRecord = null;
    if (recipientType === "doctor") {
      recipientRecord = await Doctor.findByPk(recipientIdNumber);
    } else if (recipientType === "nurse") {
      recipientRecord = await Nurse.findByPk(recipientIdNumber);
    }

    if (!recipientRecord || !recipientRecord.userId) {
      return res.redirect("/messages?error=1");
    }

    const recipientLabel = recipientType === "doctor"
      ? `Dr. ${recipientRecord.name}`
      : `Nurse ${recipientRecord.name}`;

    await Notification.create({
      userId: recipientRecord.userId,
      type: "status_update",
      title: `Message from ${patient.name}`,
      message: String(message).trim(),
      relatedId: patient.id,
      isRead: false
    });

    await Notification.create({
      userId,
      type: "status_update",
      title: `You sent a message to ${recipientLabel}`,
      message: String(message).trim(),
      relatedId: recipientRecord.id,
      isRead: true
    });

    return res.redirect("/messages?sent=1");
  } catch (error) {
    console.error("Error sending patient message:", error);
    return res.redirect("/messages?error=1");
  }
};
