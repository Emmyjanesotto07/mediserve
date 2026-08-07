import { Op } from "sequelize";
import { User } from "../models/userModel.js";
import { Doctor } from "../models/doctorModel.js";
import { Patient } from "../models/patientModel.js";
import { Appointment } from "../models/appointmentModel.js";
import { Consultation } from "../models/consultationModel.js";
import { MedicalRecord } from "../models/medicalRecordModel.js";
import { Prescription } from "../models/prescriptionModel.js";
import { Notification } from "../models/notificationModel.js";
import { sequelize } from "../models/db.js";
import { DoctorAvailability } from "../models/doctorAvailabilityModel.js";
import { DoctorDocument } from "../models/doctorDocumentModel.js";
import { DoctorMessage } from "../models/doctorMessageModel.js";
import { DoctorBilling } from "../models/doctorBillingModel.js";

const getAuthUserId = (req) => req.user?.id || req.session?.userId;

const ensureDoctorContext = async (req, res) => {
  const userId = getAuthUserId(req);
  if (!userId) {
    res.status(401).json({ success: false, message: "Unauthorized" });
    return null;
  }

  const user = await User.findByPk(userId);
  const doctor = await Doctor.findOne({ where: { userId } });

  if (!user || !doctor) {
    res.status(404).json({ success: false, message: "Doctor profile not found" });
    return null;
  }

  return { user, doctor, userId };
};

const toDateText = (value) => new Date(value).toLocaleString();
const toDayText = (value) => String(value || "").trim();

const buildDashboardData = async ({ user, doctor, userId }) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const weekStart = new Date(today);
  weekStart.setDate(weekStart.getDate() - 6);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  const upcomingAppointments = await Appointment.findAll({
    where: {
      doctorId: doctor.id,
      appointmentDate: { [Op.gte]: today },
      status: { [Op.ne]: "cancelled" }
    },
    order: [["appointmentDate", "ASC"]],
    limit: 10,
    raw: true
  });

  const recentAppointments = await Appointment.findAll({
    where: { doctorId: doctor.id },
    order: [["appointmentDate", "DESC"]],
    limit: 10,
    raw: true
  });

  const consultationHistory = await Consultation.findAll({
    where: { doctorId: doctor.id },
    order: [["createdAt", "DESC"]],
    limit: 10,
    raw: true
  });

  const recordHistory = await MedicalRecord.findAll({
    where: { doctorId: doctor.id },
    order: [["recordDate", "DESC"]],
    limit: 10,
    raw: true
  });

  const recordIds = recordHistory.map((record) => record.id);
  const prescriptions = recordIds.length
    ? await Prescription.findAll({
      where: { medicalRecordId: { [Op.in]: recordIds } },
      order: [["prescribedDate", "DESC"]],
      limit: 20,
      raw: true
    })
    : [];

  const availabilitySlots = await DoctorAvailability.findAll({
    where: { doctorId: doctor.id },
    order: [["dayOfWeek", "ASC"], ["startTime", "ASC"]],
    raw: true
  });

  const documents = await DoctorDocument.findAll({
    where: { doctorId: doctor.id },
    order: [["createdAt", "DESC"]],
    raw: true
  });

  const messages = await DoctorMessage.findAll({
    where: { doctorId: doctor.id },
    order: [["createdAt", "DESC"]],
    limit: 20,
    raw: true
  });

  const billingHistory = await DoctorBilling.findAll({
    where: { doctorId: doctor.id },
    order: [["createdAt", "DESC"]],
    limit: 20,
    raw: true
  });

  const patientIds = [...new Set([
    ...upcomingAppointments.map((item) => item.patientId),
    ...recentAppointments.map((item) => item.patientId),
    ...recordHistory.map((item) => item.patientId),
    ...messages.map((item) => item.patientId),
    ...billingHistory.map((item) => item.patientId)
  ].filter(Boolean))];

  const patients = patientIds.length
    ? await Patient.findAll({
      where: { id: { [Op.in]: patientIds } },
      attributes: ["id", "name", "age", "phone", "bloodType", "allergies"],
      raw: true
    })
    : [];

  const patientMap = Object.fromEntries(patients.map((patient) => [patient.id, patient]));

  const formattedSchedule = upcomingAppointments.map((item) => ({
    ...item,
    patientName: patientMap[item.patientId]?.name || "Unknown Patient",
    patientPhone: patientMap[item.patientId]?.phone || "N/A",
    time: new Date(item.appointmentDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    appointmentDateText: toDateText(item.appointmentDate)
  }));

  const formattedRecentAppointments = recentAppointments.map((item) => ({
    ...item,
    patientName: patientMap[item.patientId]?.name || "Unknown Patient",
    appointmentDateText: toDateText(item.appointmentDate)
  }));

  const formattedConsultations = consultationHistory.map((item) => ({
    ...item,
    patientName: patientMap[item.patientId]?.name || "Unknown Patient",
    startTimeText: item.startTime ? toDateText(item.startTime) : "N/A",
    endTimeText: item.endTime ? toDateText(item.endTime) : "N/A"
  }));

  const formattedRecords = recordHistory.map((item) => ({
    ...item,
    patientName: patientMap[item.patientId]?.name || "Unknown Patient",
    recordDateText: toDateText(item.recordDate)
  }));

  const formattedPrescriptions = prescriptions.map((item) => ({
    ...item,
    recordDateText: toDateText(item.prescribedDate)
  }));

  const formattedMessages = messages.map((item) => ({
    ...item,
    patientName: patientMap[item.patientId]?.name || "Unknown Patient",
    createdAtText: toDateText(item.createdAt)
  }));

  const formattedBilling = billingHistory.map((item) => ({
    ...item,
    patientName: patientMap[item.patientId]?.name || "Unknown Patient",
    transactionDateText: item.transactionDate ? toDateText(item.transactionDate) : toDateText(item.createdAt)
  }));

  const todayAppointments = formattedSchedule.length;
  const completedConsultations = await Appointment.count({
    where: { doctorId: doctor.id, status: "completed", appointmentDate: { [Op.gte]: monthStart } }
  });
  const pendingConsultations = await Appointment.count({
    where: { doctorId: doctor.id, status: "scheduled", appointmentDate: { [Op.gte]: today } }
  });
  const criticalAlerts = await Notification.count({
    where: { userId, isRead: false, type: { [Op.in]: ["system_alert", "appointment"] } }
  });

  const consultationsDaily = await Consultation.count({
    where: { doctorId: doctor.id, createdAt: { [Op.gte]: today } }
  });
  const consultationsWeekly = await Consultation.count({
    where: { doctorId: doctor.id, createdAt: { [Op.gte]: weekStart } }
  });
  const consultationsMonthly = await Consultation.count({
    where: { doctorId: doctor.id, createdAt: { [Op.gte]: monthStart } }
  });

  const totalEarnings = billingHistory.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const pendingEarnings = billingHistory.filter((item) => item.status === "pending").reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const paidEarnings = billingHistory.filter((item) => item.status === "paid").reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const profileSnapshot = {
    name: doctor.name || user.name,
    specialization: doctor.specialization,
    license: doctor.license,
    experience: doctor.experience,
    consultationFee: Number(doctor.consultationFee || 0).toFixed(2),
    phone: doctor.phone || "",
    status: doctor.status || "active"
  };

  const stats = {
    totalPatientsToday: todayAppointments,
    pendingConsultations,
    completedConsultations,
    criticalAlerts,
    upcomingAppointments: formattedSchedule.length,
    recentConsultations: formattedConsultations.length,
    totalRecords: formattedRecords.length,
    totalPrescriptions: formattedPrescriptions.length,
    availabilitySlots: availabilitySlots.length,
    documentsCount: documents.length,
    messagesCount: formattedMessages.length,
    billingCount: formattedBilling.length,
    totalEarnings: totalEarnings.toFixed(2),
    pendingEarnings: pendingEarnings.toFixed(2),
    paidEarnings: paidEarnings.toFixed(2),
    consultationsDaily,
    consultationsWeekly,
    consultationsMonthly
  };

  const commonCaseMap = {};
  formattedRecords.forEach((record) => {
    const key = String(record.diagnosis || "Unspecified").split(" ")[0].toLowerCase();
    commonCaseMap[key] = (commonCaseMap[key] || 0) + 1;
  });

  const commonCases = Object.entries(commonCaseMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([label, count]) => ({ label, count }));

  return {
    user,
    doctor,
    profileSnapshot,
    stats,
    todaySchedule: formattedSchedule,
    recentAppointments: formattedRecentAppointments,
    consultationHistory: formattedConsultations,
    recentRecords: formattedRecords,
    prescriptions: formattedPrescriptions,
    availabilitySlots,
    documents,
    messages: formattedMessages,
    billingHistory: formattedBilling,
    commonCases,
    patientOptions: patients,
    notifications: await Notification.findAll({
      where: { userId },
      order: [["createdAt", "DESC"]],
      limit: 10,
      raw: true
    })
  };
};

export const doctorDashboardPage = async (req, res) => {
  try {
    const context = await ensureDoctorContext(req, res);
    if (!context) return;

    const dashboard = await buildDashboardData(context);

    res.render("doctor-dashboard-ui", {
      title: "Doctor Dashboard",
      pageHeading: "Doctor Dashboard",
      welcomeMessage: "Manage your consultations, records, messages, and daily workflow.",
      doctorName: dashboard.profileSnapshot.name,
      doctor: dashboard.doctor,
      profileSnapshot: dashboard.profileSnapshot,
      stats: dashboard.stats,
      todaySchedule: dashboard.todaySchedule,
      recentAppointments: dashboard.recentAppointments,
      consultationHistory: dashboard.consultationHistory,
      recentRecords: dashboard.recentRecords,
      prescriptions: dashboard.prescriptions,
      availabilitySlots: dashboard.availabilitySlots,
      documents: dashboard.documents,
      messages: dashboard.messages,
      billingHistory: dashboard.billingHistory,
      commonCases: dashboard.commonCases,
      patientOptions: dashboard.patientOptions,
      notifications: dashboard.notifications
    });
  } catch (error) {
    console.error("Error in doctorDashboardPage:", error);
    res.status(500).render("error", { message: "Error loading doctor dashboard" });
  }
};

export const getDoctorOverview = async (req, res) => {
  try {
    const context = await ensureDoctorContext(req, res);
    if (!context) return;

    const dashboard = await buildDashboardData(context);

    return res.status(200).json({
      success: true,
      data: {
        doctorName: dashboard.profileSnapshot.name,
        profile: dashboard.profileSnapshot,
        stats: dashboard.stats,
        commonCases: dashboard.commonCases
      }
    });
  } catch (error) {
    console.error("Error fetching doctor overview:", error);
    return res.status(500).json({ success: false, message: "Failed to load doctor overview" });
  }
};

export const getTodaySchedule = async (req, res) => {
  try {
    const context = await ensureDoctorContext(req, res);
    if (!context) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const appointments = await Appointment.findAll({
      where: {
        doctorId: context.doctor.id,
        appointmentDate: { [Op.gte]: today, [Op.lt]: tomorrow },
        status: { [Op.ne]: "cancelled" }
      },
      order: [["appointmentDate", "ASC"]],
      raw: true
    });

    const patientIds = [...new Set(appointments.map((item) => item.patientId).filter(Boolean))];
    const patients = patientIds.length
      ? await Patient.findAll({ where: { id: { [Op.in]: patientIds } }, raw: true })
      : [];
    const patientMap = Object.fromEntries(patients.map((patient) => [patient.id, patient]));

    const data = appointments.map((item) => ({
      ...item,
      patientName: patientMap[item.patientId]?.name || "Unknown Patient",
      concern: item.notes || item.consultationType || "Consultation",
      time: new Date(item.appointmentDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      appointmentDateText: toDateText(item.appointmentDate)
    }));

    return res.status(200).json({ success: true, count: data.length, data });
  } catch (error) {
    console.error("Error fetching today's schedule:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch today's schedule" });
  }
};

export const getDoctorNotifications = async (req, res) => {
  try {
    const context = await ensureDoctorContext(req, res);
    if (!context) return;

    const notifications = await Notification.findAll({
      where: { userId: context.userId },
      order: [["createdAt", "DESC"]],
      raw: true
    });

    return res.status(200).json({ success: true, count: notifications.length, data: notifications });
  } catch (error) {
    console.error("Error fetching doctor notifications:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch notifications" });
  }
};

export const clearDoctorNotifications = async (req, res) => {
  try {
    const context = await ensureDoctorContext(req, res);
    if (!context) return;

    await Notification.update({ isRead: true }, { where: { userId: context.userId } });

    return res.status(200).json({ success: true, message: "Notifications cleared", data: [] });
  } catch (error) {
    console.error("Error clearing doctor notifications:", error);
    return res.status(500).json({ success: false, message: "Failed to clear notifications" });
  }
};

export const updateAppointmentStatus = async (req, res) => {
  try {
    const context = await ensureDoctorContext(req, res);
    if (!context) return;

    const appointmentId = Number(req.params.id || req.params.appointmentId);
    const { status, notes } = req.body;

    if (!appointmentId || !status) {
      return res.status(400).json({ success: false, message: "appointmentId and status are required" });
    }

    const appointment = await Appointment.findOne({
      where: { id: appointmentId, doctorId: context.doctor.id }
    });

    if (!appointment) {
      return res.status(404).json({ success: false, message: "Appointment not found" });
    }

    appointment.status = status;
    if (notes) {
      appointment.notes = notes;
    }
    await appointment.save();

    const patient = await Patient.findByPk(appointment.patientId);
    if (patient?.userId) {
      await Notification.create({
        userId: patient.userId,
        type: "appointment",
        title: "Appointment Updated",
        message: `Your appointment with Dr. ${context.doctor.name} has been marked as ${status}.`,
        relatedId: appointment.id,
        isRead: false
      });
    }

    let billingRecord = null;
    if (status === "completed") {
      const existingBilling = await DoctorBilling.findOne({ where: { appointmentId: appointment.id } });
      if (!existingBilling) {
        billingRecord = await DoctorBilling.create({
          doctorId: context.doctor.id,
          patientId: appointment.patientId,
          appointmentId: appointment.id,
          amount: Number(context.doctor.consultationFee || 0),
          status: Number(context.doctor.consultationFee || 0) > 0 ? "pending" : "paid",
          transactionDate: Number(context.doctor.consultationFee || 0) > 0 ? null : new Date(),
          notes: notes || "Auto-generated billing record after completed appointment"
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: "Appointment status updated",
      data: {
        id: appointment.id,
        status: appointment.status,
        notes: appointment.notes,
        billingRecord
      }
    });
  } catch (error) {
    console.error("Error updating appointment status:", error);
    return res.status(500).json({ success: false, message: "Failed to update appointment status" });
  }
};

export const updateDoctorProfile = async (req, res) => {
  try {
    const context = await ensureDoctorContext(req, res);
    if (!context) return;

    const { name, specialization, experience, consultationFee, phone, status } = req.body;
    const allowedStatuses = new Set(["active", "inactive", "on_leave"]);

    if (name) {
      context.user.name = name;
      context.doctor.name = name;
    }
    if (specialization) context.doctor.specialization = specialization;
    if (experience !== undefined && experience !== "") context.doctor.experience = Number(experience) || 0;
    if (consultationFee !== undefined && consultationFee !== "") context.doctor.consultationFee = Number(consultationFee) || 0;
    if (phone !== undefined) context.doctor.phone = phone;
    if (status && allowedStatuses.has(status)) context.doctor.status = status;

    await context.user.save();
    await context.doctor.save();

    return res.status(200).json({
      success: true,
      message: "Doctor profile updated",
      data: {
        name: context.doctor.name,
        specialization: context.doctor.specialization,
        experience: context.doctor.experience,
        consultationFee: context.doctor.consultationFee,
        phone: context.doctor.phone,
        status: context.doctor.status
      }
    });
  } catch (error) {
    console.error("Error updating doctor profile:", error);
    return res.status(500).json({ success: false, message: "Failed to update profile" });
  }
};

export const createDoctorAvailability = async (req, res) => {
  try {
    const context = await ensureDoctorContext(req, res);
    if (!context) return;

    const { dayOfWeek, startTime, endTime, location, notes } = req.body;
    if (!dayOfWeek || !startTime || !endTime) {
      return res.status(400).json({ success: false, message: "dayOfWeek, startTime, and endTime are required" });
    }

    const availability = await DoctorAvailability.create({
      doctorId: context.doctor.id,
      dayOfWeek: toDayText(dayOfWeek),
      startTime,
      endTime,
      location: location || null,
      notes: notes || null,
      isActive: true
    });

    return res.status(201).json({ success: true, message: "Availability saved", data: availability });
  } catch (error) {
    console.error("Error creating doctor availability:", error);
    return res.status(500).json({ success: false, message: "Failed to save availability" });
  }
};

export const deleteDoctorAvailability = async (req, res) => {
  try {
    const context = await ensureDoctorContext(req, res);
    if (!context) return;

    const { availabilityId } = req.params;
    const deleted = await DoctorAvailability.destroy({ where: { id: availabilityId, doctorId: context.doctor.id } });

    if (!deleted) {
      return res.status(404).json({ success: false, message: "Availability slot not found" });
    }

    return res.status(200).json({ success: true, message: "Availability deleted" });
  } catch (error) {
    console.error("Error deleting availability:", error);
    return res.status(500).json({ success: false, message: "Failed to delete availability" });
  }
};

export const uploadDoctorDocument = async (req, res) => {
  try {
    const context = await ensureDoctorContext(req, res);
    if (!context) return;

    const { documentType } = req.body;
    const file = req.file;

    if (!documentType || !file) {
      return res.status(400).json({ success: false, message: "documentType and file are required" });
    }

    const document = await DoctorDocument.create({
      doctorId: context.doctor.id,
      documentType,
      fileName: file.filename,
      filePath: `/uploads/${file.filename}`,
      originalName: file.originalname
    });

    return res.status(201).json({ success: true, message: "Document uploaded", data: document });
  } catch (error) {
    console.error("Error uploading doctor document:", error);
    return res.status(500).json({ success: false, message: "Failed to upload document" });
  }
};

export const deleteDoctorDocument = async (req, res) => {
  try {
    const context = await ensureDoctorContext(req, res);
    if (!context) return;

    const { documentId } = req.params;
    const deleted = await DoctorDocument.destroy({ where: { id: documentId, doctorId: context.doctor.id } });

    if (!deleted) {
      return res.status(404).json({ success: false, message: "Document not found" });
    }

    return res.status(200).json({ success: true, message: "Document removed" });
  } catch (error) {
    console.error("Error deleting doctor document:", error);
    return res.status(500).json({ success: false, message: "Failed to delete document" });
  }
};

export const sendDoctorMessage = async (req, res) => {
  try {
    const context = await ensureDoctorContext(req, res);
    if (!context) return;

    const { patientId, message } = req.body;
    if (!patientId || !message) {
      return res.status(400).json({ success: false, message: "patientId and message are required" });
    }

    const patient = await Patient.findByPk(patientId);
    if (!patient) {
      return res.status(404).json({ success: false, message: "Patient not found" });
    }

    const savedMessage = await DoctorMessage.create({
      doctorId: context.doctor.id,
      patientId,
      senderUserId: context.userId,
      senderRole: "doctor",
      message,
      isRead: false
    });

    await Notification.create({
      userId: patient.userId,
      type: "message",
      title: "Message from your doctor",
      message: `Dr. ${context.doctor.name} sent you a message.`,
      relatedId: savedMessage.id,
      isRead: false
    });

    return res.status(201).json({ success: true, message: "Message sent", data: savedMessage });
  } catch (error) {
    console.error("Error sending doctor message:", error);
    return res.status(500).json({ success: false, message: "Failed to send message" });
  }
};

export const getDoctorMessages = async (req, res) => {
  try {
    const context = await ensureDoctorContext(req, res);
    if (!context) return;

    const messages = await DoctorMessage.findAll({
      where: { doctorId: context.doctor.id },
      order: [["createdAt", "DESC"]],
      limit: 50,
      raw: true
    });

    return res.status(200).json({ success: true, data: messages });
  } catch (error) {
    console.error("Error fetching doctor messages:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch messages" });
  }
};

export const getDoctorBilling = async (req, res) => {
  try {
    const context = await ensureDoctorContext(req, res);
    if (!context) return;

    const billing = await DoctorBilling.findAll({
      where: { doctorId: context.doctor.id },
      order: [["createdAt", "DESC"]],
      raw: true
    });

    const total = billing.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const pending = billing.filter((item) => item.status === "pending").reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const paid = billing.filter((item) => item.status === "paid").reduce((sum, item) => sum + Number(item.amount || 0), 0);

    return res.status(200).json({
      success: true,
      data: {
        total: total.toFixed(2),
        pending: pending.toFixed(2),
        paid: paid.toFixed(2),
        billing
      }
    });
  } catch (error) {
    console.error("Error fetching doctor billing:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch billing records" });
  }
};

export const getDoctorAnalytics = async (req, res) => {
  try {
    const context = await ensureDoctorContext(req, res);
    if (!context) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - 6);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const [daily, weekly, monthly, records, consultations] = await Promise.all([
      Appointment.count({ where: { doctorId: context.doctor.id, appointmentDate: { [Op.gte]: today } } }),
      Appointment.count({ where: { doctorId: context.doctor.id, appointmentDate: { [Op.gte]: weekStart } } }),
      Appointment.count({ where: { doctorId: context.doctor.id, appointmentDate: { [Op.gte]: monthStart } } }),
      MedicalRecord.count({ where: { doctorId: context.doctor.id, updatedAt: { [Op.gte]: monthStart } } }),
      Consultation.count({ where: { doctorId: context.doctor.id, createdAt: { [Op.gte]: monthStart } } })
    ]);

    return res.status(200).json({
      success: true,
      data: { daily, weekly, monthly, records, consultations }
    });
  } catch (error) {
    console.error("Error fetching doctor analytics:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch analytics" });
  }
};
