/*
MIT License

Copyright (c) 2025 Christian I. Cabrera || XianFire Framework
Mindoro State University - Philippines
*/

import { Consultation } from "../models/consultationModel.js";
import { Appointment } from "../models/appointmentModel.js";
import { MedicalRecord } from "../models/medicalRecordModel.js";
import { Prescription } from "../models/prescriptionModel.js";
import { Notification } from "../models/notificationModel.js";
import { Patient } from "../models/patientModel.js";
import { Doctor } from "../models/doctorModel.js";
import { Op } from "sequelize";

export const startConsultation = async (req, res) => {
  try {
    const { appointmentId, consultationType } = req.body;

    const appointment = await Appointment.findByPk(appointmentId);
    if (!appointment) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    const consultation = await Consultation.create({
      appointmentId,
      patientId: appointment.patientId,
      doctorId: appointment.doctorId,
      consultationType: consultationType || appointment.consultationType,
      status: "ongoing",
      startTime: new Date()
    });

    // Generate meeting link for video consultations
    if (consultationType === "video") {
      consultation.meetingLink = `https://mediserve.app/consultation/${consultation.id}`;
      await consultation.save();
    }

    // Notify patient
    const patient = await Patient.findByPk(appointment.patientId);
    await Notification.create({
      userId: patient.userId,
      type: "appointment",
      title: "Consultation Started",
      message: `Your consultation with the doctor has started`,
      relatedId: consultation.id
    });

    res.json({ success: true, consultation });
  } catch (error) {
    console.error("Error starting consultation:", error);
    res.status(500).json({ error: "Failed to start consultation" });
  }
};

export const endConsultation = async (req, res) => {
  try {
    const { consultationId, notes } = req.body;

    const consultation = await Consultation.findByPk(consultationId);
    if (!consultation) {
      return res.status(404).json({ error: "Consultation not found" });
    }

    consultation.status = "completed";
    consultation.endTime = new Date();
    if (notes) consultation.notes = notes;

    await consultation.save();

    // Update appointment status
    await Appointment.update(
      { status: "completed" },
      { where: { id: consultation.appointmentId } }
    );

    // Notify patient
    const patient = await Patient.findByPk(consultation.patientId);
    await Notification.create({
      userId: patient.userId,
      type: "appointment",
      title: "Consultation Completed",
      message: `Your consultation has been completed. Check your medical records for updates.`,
      relatedId: consultation.id
    });

    res.json({ success: true, message: "Consultation ended successfully" });
  } catch (error) {
    console.error("Error ending consultation:", error);
    res.status(500).json({ error: "Failed to end consultation" });
  }
};

export const getConsultationHistory = async (req, res) => {
  try {
    const { patientId } = req.query;

    const consultations = await Consultation.findAll({
      where: { patientId },
      include: [
        { model: Appointment, attributes: ["id", "appointmentDate", "consultationType"] },
        { model: Patient, attributes: ["id", "name"] },
        { model: Doctor, attributes: ["id", "name", "specialization"] }
      ],
      order: [["createdAt", "DESC"]]
    });

    res.json(consultations);
  } catch (error) {
    console.error("Error fetching consultation history:", error);
    res.status(500).json({ error: "Failed to fetch consultation history" });
  }
};

export const getChatHistory = async (req, res) => {
  try {
    const { consultationId } = req.params;

    const consultation = await Consultation.findByPk(consultationId);
    if (!consultation) {
      return res.status(404).json({ error: "Consultation not found" });
    }

    // In a real application, you would fetch chat messages from a separate collection
    // For now, return the consultation details
    res.json(consultation);
  } catch (error) {
    console.error("Error fetching chat history:", error);
    res.status(500).json({ error: "Failed to fetch chat history" });
  }
};

export const scheduleConsultation = async (req, res) => {
  try {
    const { patientId, doctorId, appointmentDate, consultationType } = req.body;

    // Check if appointment overlaps
    const existingAppointment = await Appointment.findOne({
      where: {
        doctorId,
        appointmentDate,
        status: { [Op.ne]: "cancelled" }
      }
    });

    if (existingAppointment) {
      return res.status(400).json({ error: "Doctor is not available at this time" });
    }

    const appointment = await Appointment.create({
      patientId,
      doctorId,
      appointmentDate,
      status: "scheduled",
      consultationType: consultationType || "in-person",
      startTime: appointmentDate,
      endTime: new Date(new Date(appointmentDate).getTime() + 60 * 60000) // 1 hour later
    });

    // Notify patient
    const patient = await Patient.findByPk(patientId);
    await Notification.create({
      userId: patient.userId,
      type: "appointment",
      title: "Appointment Scheduled",
      message: `Your appointment has been scheduled successfully`,
      relatedId: appointment.id
    });

    res.json({ success: true, appointment });
  } catch (error) {
    console.error("Error scheduling consultation:", error);
    res.status(500).json({ error: "Failed to schedule consultation" });
  }
};

export const rescheduleConsultation = async (req, res) => {
  try {
    const { appointmentId, newDate } = req.body;

    const appointment = await Appointment.findByPk(appointmentId);
    if (!appointment) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    appointment.appointmentDate = newDate;
    appointment.startTime = newDate;
    appointment.endTime = new Date(new Date(newDate).getTime() + 60 * 60000);

    await appointment.save();

    // Notify patient
    const patient = await Patient.findByPk(appointment.patientId);
    await Notification.create({
      userId: patient.userId,
      type: "appointment",
      title: "Appointment Rescheduled",
      message: `Your appointment has been rescheduled`,
      relatedId: appointment.id
    });

    res.json({ success: true, appointment });
  } catch (error) {
    console.error("Error rescheduling consultation:", error);
    res.status(500).json({ error: "Failed to reschedule consultation" });
  }
};

export const cancelConsultation = async (req, res) => {
  try {
    const { appointmentId, reason } = req.body;

    const appointment = await Appointment.findByPk(appointmentId);
    if (!appointment) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    appointment.status = "cancelled";
    await appointment.save();

    // Notify patient
    const patient = await Patient.findByPk(appointment.patientId);
    await Notification.create({
      userId: patient.userId,
      type: "appointment",
      title: "Appointment Cancelled",
      message: `Your appointment has been cancelled. Reason: ${reason || "No reason provided"}`,
      relatedId: appointment.id
    });

    res.json({ success: true, message: "Appointment cancelled successfully" });
  } catch (error) {
    console.error("Error cancelling consultation:", error);
    res.status(500).json({ error: "Failed to cancel consultation" });
  }
};
