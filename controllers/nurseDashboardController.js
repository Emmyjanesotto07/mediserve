/*
MIT License

Copyright (c) 2025 Christian I. Cabrera || XianFire Framework
Mindoro State University - Philippines
*/

import { Nurse } from "../models/nurseModel.js";
import { Doctor } from "../models/doctorModel.js";
import { Patient } from "../models/patientModel.js";
import { Appointment } from "../models/appointmentModel.js";
import { MedicalRecord } from "../models/medicalRecordModel.js";
import { Notification } from "../models/notificationModel.js";
import { sequelize } from "../models/db.js";
import { Op } from "sequelize";

const formatDateText = (value) => {
  if (!value) return "N/A";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "N/A"
    : date.toLocaleDateString([], {
        month: "short",
        day: "numeric",
        year: "numeric"
      });
};

const formatDateTimeText = (value) => {
  if (!value) return "N/A";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "N/A"
    : date.toLocaleString([], {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
};

const formatTimeText = (value) => {
  if (!value) return "N/A";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "N/A"
    : date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
      });
};

const getInitials = (name = "") => {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "N";
  return parts.slice(0, 2).map((part) => part.charAt(0)).join("").toUpperCase();
};

export const nurseDashboardPage = async (req, res) => {
  try {
    const userId = req.user?.id || req.session?.userId;

    if (!userId) {
      return res.redirect("/login");
    }
    
    // Get nurse info
    const nurse = await Nurse.findOne({ where: { userId } });

    if (!nurse) {
      return res.status(404).render("error", { message: "Nurse profile not found" });
    }

    const doctorAttributes = ["id", "name", "specialization"];

    // Get today's patients
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextSevenDays = new Date(today);
    nextSevenDays.setDate(nextSevenDays.getDate() + 7);

    const appointmentWhere = nurse.assignedDoctorId
      ? {
          doctorId: nurse.assignedDoctorId,
          appointmentDate: {
            [Op.gte]: today,
            [Op.lt]: nextSevenDays
          },
          status: { [Op.ne]: "cancelled" }
        }
      : {
          appointmentDate: {
            [Op.gte]: today,
            [Op.lt]: nextSevenDays
          },
          status: { [Op.ne]: "cancelled" }
        };

    const rawAppointments = await Appointment.findAll({
      where: appointmentWhere,
      include: [
        { model: Patient, attributes: ["id", "name", "age", "phone", "bloodType"] },
        { model: Doctor, attributes: doctorAttributes }
      ],
      order: [["appointmentDate", "ASC"]],
      limit: 20
    });

    const assignedDoctor = nurse.assignedDoctorId
      ? await Doctor.findByPk(nurse.assignedDoctorId, { attributes: doctorAttributes })
      : null;

    const patientMap = new Map();
    rawAppointments.forEach((appointment) => {
      if (appointment.Patient) {
        patientMap.set(appointment.Patient.id, appointment.Patient);
      }
    });

    const patients = Array.from(patientMap.values()).map((patient) => ({
      id: patient.id,
      name: patient.name,
      age: patient.age,
      phone: patient.phone,
      bloodType: patient.bloodType
    }));

    // Get recent medical records
    const recentRecords = await MedicalRecord.findAll({
      limit: 10,
      order: [["createdAt", "DESC"]],
      include: [
        { model: Patient, attributes: ["id", "name", "age", "phone"] },
        { model: Doctor, attributes: doctorAttributes }
      ],
      where: nurse.assignedDoctorId ? { doctorId: nurse.assignedDoctorId } : undefined
    });

    // Get unread notifications
    const notifications = await Notification.findAll({
      where: {
        userId,
        isRead: false
      },
      limit: 5,
      order: [["createdAt", "DESC"]]
    });

    const todayAppointments = rawAppointments.filter((appointment) => {
      const appointmentDate = new Date(appointment.appointmentDate);
      return appointmentDate >= today && appointmentDate < tomorrow;
    });

    const followUps = rawAppointments
      .filter((appointment) => new Date(appointment.appointmentDate) >= tomorrow)
      .slice(0, 5);

    const dashboardAppointments = rawAppointments.map((appointment) => ({
      id: appointment.id,
      patientId: appointment.patientId,
      patientName: appointment.Patient?.name || "Unknown Patient",
      doctorName: appointment.Doctor?.name || assignedDoctor?.name || "Assigned Doctor",
      specialization: appointment.Doctor?.specialization || assignedDoctor?.specialization || "General Practice",
      date: formatDateText(appointment.appointmentDate),
      time: formatTimeText(appointment.appointmentDate || appointment.startTime),
      status: appointment.status,
      consultationType: appointment.consultationType || "in-person",
      appointmentDate: appointment.appointmentDate,
      notes: appointment.notes || ""
    }));

    const recentRecordCards = recentRecords.map((record) => ({
      id: record.id,
      title: record.diagnosis ? record.diagnosis.slice(0, 60) : "Nursing record",
      date: formatDateText(record.recordDate || record.createdAt),
      patient: record.Patient?.name || "Unknown Patient",
      patientId: record.patientId,
      notes: record.notes || "",
      diagnosis: record.diagnosis || "",
      treatment: record.treatment || ""
    }));

    const followUpCards = followUps.map((appointment) => ({
      id: appointment.id,
      patientId: appointment.patientId,
      patientName: appointment.Patient?.name || "Unknown Patient",
      lastConsultation: formatDateText(appointment.appointmentDate),
      status: appointment.status,
      phone: appointment.Patient?.phone || "N/A"
    }));

    const viewData = {
      title: "Nurse Dashboard",
      nurse,
      assignedDoctor,
      nurseName: nurse.name,
      nurseInitials: getInitials(nurse.name),
      date: new Date().toLocaleDateString([], {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric"
      }),
      todayAppointments: dashboardAppointments,
      appointments: dashboardAppointments,
      patients,
      recentRecords: recentRecordCards,
      records: recentRecordCards,
      followups: followUpCards,
      notifications,
      stats: {
        todayPatients: todayAppointments.length,
        pendingApprovals: dashboardAppointments.filter((appointment) => appointment.status === "scheduled").length,
        recordsUpdated: recentRecords.length,
        followUps: followUpCards.length
      }
    };

    res.render("nurse-dashboard-ui", viewData);
  } catch (error) {
    console.error("Error in nurseDashboardPage:", error);
    res.status(500).render("error", { message: "Error loading nurse dashboard" });
  }
};

export const getAssignedPatients = async (req, res) => {
  try {
    const userId = req.user?.id || req.session?.userId;
    const nurse = await Nurse.findOne({ where: { userId } });

    if (!nurse) {
      return res.status(404).json({ error: "Nurse not found" });
    }

    const upcomingAppointments = await Appointment.findAll({
      where: {
        doctorId: nurse.assignedDoctorId,
        appointmentDate: { [Op.gte]: new Date() }
      },
      include: [
        { model: Patient, attributes: ["id", "name", "age", "phone", "bloodType"] },
        { model: Doctor, attributes: ["id", "name"] }
      ],
      order: [["appointmentDate", "ASC"]]
    });

    res.json(upcomingAppointments);
  } catch (error) {
    console.error("Error fetching patients:", error);
    res.status(500).json({ error: "Failed to fetch patients" });
  }
};

export const approveAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { notes } = req.body;
    const userId = req.user?.id || req.session?.userId;

    const nurse = await Nurse.findOne({ where: { userId } });
    if (!nurse) {
      return res.status(404).json({ error: "Nurse not found" });
    }

    const appointment = await Appointment.findOne({
      where: {
        id: appointmentId,
        ...(nurse.assignedDoctorId ? { doctorId: nurse.assignedDoctorId } : {})
      }
    });

    if (!appointment) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    appointment.notes = [appointment.notes, notes || "Nurse approved this appointment."]
      .filter(Boolean)
      .join("\n");
    await appointment.save();

    const patient = await Patient.findByPk(appointment.patientId);
    if (patient?.userId) {
      await Notification.create({
        userId: patient.userId,
        type: "appointment",
        title: "Appointment Approved",
        message: "Your appointment has been approved by the nursing team.",
        relatedId: appointment.id,
        isRead: false
      });
    }

    return res.json({ success: true, appointment });
  } catch (error) {
    console.error("Error approving appointment:", error);
    return res.status(500).json({ error: "Failed to approve appointment" });
  }
};

export const rescheduleAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { newDate } = req.body;
    const userId = req.user?.id || req.session?.userId;

    if (!newDate) {
      return res.status(400).json({ error: "newDate is required" });
    }

    const nurse = await Nurse.findOne({ where: { userId } });
    if (!nurse) {
      return res.status(404).json({ error: "Nurse not found" });
    }

    const appointment = await Appointment.findOne({
      where: {
        id: appointmentId,
        ...(nurse.assignedDoctorId ? { doctorId: nurse.assignedDoctorId } : {})
      }
    });

    if (!appointment) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    appointment.appointmentDate = newDate;
    appointment.startTime = newDate;
    appointment.endTime = new Date(new Date(newDate).getTime() + 60 * 60000);
    appointment.notes = [appointment.notes, `Rescheduled by nurse to ${formatDateTimeText(newDate)}.`]
      .filter(Boolean)
      .join("\n");

    await appointment.save();

    const patient = await Patient.findByPk(appointment.patientId);
    if (patient?.userId) {
      await Notification.create({
        userId: patient.userId,
        type: "appointment",
        title: "Appointment Rescheduled",
        message: `Your appointment has been rescheduled to ${formatDateTimeText(newDate)}.`,
        relatedId: appointment.id,
        isRead: false
      });
    }

    return res.json({ success: true, appointment });
  } catch (error) {
    console.error("Error rescheduling appointment:", error);
    return res.status(500).json({ error: "Failed to reschedule appointment" });
  }
};

export const recordVitals = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { appointmentId, temperature, bloodPressure, heartRate, symptoms, notes } = req.body;
    const userId = req.user?.id || req.session?.userId;

    const nurse = await Nurse.findOne({ where: { userId } });
    if (!nurse) {
      return res.status(404).json({ error: "Nurse not found" });
    }

    const doctorId = nurse.assignedDoctorId || null;
    if (!doctorId) {
      return res.status(400).json({ error: "No assigned doctor available for this nurse" });
    }

    const patient = await Patient.findByPk(patientId);
    if (!patient) {
      return res.status(404).json({ error: "Patient not found" });
    }

    const vitalNotes = [
      temperature ? `Temperature: ${temperature}°C` : null,
      bloodPressure ? `Blood pressure: ${bloodPressure}` : null,
      heartRate ? `Heart rate: ${heartRate} bpm` : null,
      symptoms ? `Symptoms: ${symptoms}` : null,
      notes ? `Notes: ${notes}` : null
    ].filter(Boolean).join("\n");

    const record = await MedicalRecord.create({
      patientId,
      doctorId,
      appointmentId: appointmentId || null,
      diagnosis: "Nurse pre-screening",
      treatment: "Vital signs recorded",
      notes: vitalNotes || "Nurse pre-screening recorded"
    });

    if (patient.userId) {
      await Notification.create({
        userId: patient.userId,
        type: "medical_record",
        title: "Vital Signs Recorded",
        message: "Your pre-screening details and vital signs were added to your record.",
        relatedId: record.id,
        isRead: false
      });
    }

    return res.json({ success: true, record });
  } catch (error) {
    console.error("Error recording vitals:", error);
    return res.status(500).json({ error: "Failed to record vitals" });
  }
};

export const createFollowUp = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { message, followUpDate } = req.body;
    const userId = req.user?.id || req.session?.userId;

    const nurse = await Nurse.findOne({ where: { userId } });
    if (!nurse) {
      return res.status(404).json({ error: "Nurse not found" });
    }

    const patient = await Patient.findByPk(patientId);
    if (!patient) {
      return res.status(404).json({ error: "Patient not found" });
    }

    const followUpMessage = [
      message || "Please return for a follow-up review.",
      followUpDate ? `Follow-up date: ${formatDateTimeText(followUpDate)}` : null
    ].filter(Boolean).join("\n");

    const notification = await Notification.create({
      userId: patient.userId,
      type: "appointment",
      title: "Follow-up Reminder",
      message: followUpMessage,
      relatedId: nurse.id,
      isRead: false
    });

    return res.json({ success: true, notification });
  } catch (error) {
    console.error("Error creating follow-up:", error);
    return res.status(500).json({ error: "Failed to create follow-up" });
  }
};

export const updatePatientRecord = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { diagnosis, treatment, notes } = req.body;
    const userId = req.user.id;

    // Get nurse info
    const nurse = await Nurse.findOne({ where: { userId } });
    if (!nurse) {
      return res.status(404).json({ error: "Nurse not found" });
    }

    // Find the doctor assigned to this nurse
    const doctor = await Doctor.findByPk(nurse.assignedDoctorId);
    if (!doctor) {
      return res.status(404).json({ error: "Assigned doctor not found" });
    }

    // Create or update medical record
    const record = await MedicalRecord.create({
      patientId,
      doctorId: doctor.id,
      diagnosis,
      treatment,
      notes
    });

    // Create notification for patient
    await Notification.create({
      userId: (await Patient.findByPk(patientId)).userId,
      type: "medical_record",
      title: "Medical Record Updated",
      message: "Your medical record has been updated by the medical team",
      relatedId: record.id
    });

    res.json({ success: true, record });
  } catch (error) {
    console.error("Error updating patient record:", error);
    res.status(500).json({ error: "Failed to update record" });
  }
};

export const getPatientHistory = async (req, res) => {
  try {
    const { patientId } = req.params;

    const medicalRecords = await MedicalRecord.findAll({
      where: { patientId },
      include: [
        { model: Patient, attributes: ["id", "name", "email"] },
        { model: Doctor, attributes: ["id", "name", "specialization"] }
      ],
      order: [["recordDate", "DESC"]]
    });

    res.json(medicalRecords);
  } catch (error) {
    console.error("Error fetching patient history:", error);
    res.status(500).json({ error: "Failed to fetch patient history" });
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
