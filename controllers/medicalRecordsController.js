/*
MIT License

Copyright (c) 2025 Christian I. Cabrera || XianFire Framework
Mindoro State University - Philippines
*/

import { MedicalRecord } from "../models/medicalRecordModel.js";
import { Prescription } from "../models/prescriptionModel.js";
import { Notification } from "../models/notificationModel.js";
import { Patient } from "../models/patientModel.js";
import { Doctor } from "../models/doctorModel.js";
import { Appointment } from "../models/appointmentModel.js";
import { Op } from "sequelize";

export const createMedicalRecord = async (req, res) => {
  try {
    const { patientId, doctorId, appointmentId, diagnosis, treatment, notes, consultationType } = req.body;

    const record = await MedicalRecord.create({
      patientId,
      doctorId,
      appointmentId,
      diagnosis,
      treatment,
      notes,
      consultationType: consultationType || "in-person",
      recordDate: new Date()
    });

    // Notify patient
    const patient = await Patient.findByPk(patientId);
    await Notification.create({
      userId: patient.userId,
      type: "medical_record",
      title: "New Medical Record",
      message: "A new medical record has been created for you",
      relatedId: record.id
    });

    res.json({ success: true, record });
  } catch (error) {
    console.error("Error creating medical record:", error);
    res.status(500).json({ error: "Failed to create medical record" });
  }
};

export const getPatientMedicalRecords = async (req, res) => {
  try {
    const { patientId } = req.params;

    const records = await MedicalRecord.findAll({
      where: { patientId },
      include: [
        { model: Patient, attributes: ["id", "name", "email"] },
        { model: Doctor, attributes: ["id", "name", "specialization"] },
        { model: Appointment, attributes: ["id", "appointmentDate"] }
      ],
      order: [["recordDate", "DESC"]]
    });

    res.json(records);
  } catch (error) {
    console.error("Error fetching medical records:", error);
    res.status(500).json({ error: "Failed to fetch medical records" });
  }
};

export const getMedicalRecord = async (req, res) => {
  try {
    const { recordId } = req.params;

    const record = await MedicalRecord.findByPk(recordId, {
      include: [
        { model: Patient, attributes: ["id", "name", "email", "age", "bloodType", "allergies"] },
        { model: Doctor, attributes: ["id", "name", "specialization", "license"] },
        { 
          model: Prescription, 
          attributes: ["id", "medicationName", "dosage", "frequency", "duration", "instructions"]
        }
      ]
    });

    if (!record) {
      return res.status(404).json({ error: "Medical record not found" });
    }

    res.json(record);
  } catch (error) {
    console.error("Error fetching medical record:", error);
    res.status(500).json({ error: "Failed to fetch medical record" });
  }
};

export const updateMedicalRecord = async (req, res) => {
  try {
    const { recordId } = req.params;
    const { diagnosis, treatment, notes } = req.body;

    const record = await MedicalRecord.findByPk(recordId);
    if (!record) {
      return res.status(404).json({ error: "Medical record not found" });
    }

    if (diagnosis) record.diagnosis = diagnosis;
    if (treatment) record.treatment = treatment;
    if (notes) record.notes = notes;

    await record.save();

    res.json({ success: true, record });
  } catch (error) {
    console.error("Error updating medical record:", error);
    res.status(500).json({ error: "Failed to update medical record" });
  }
};

export const addPrescription = async (req, res) => {
  try {
    const { medicalRecordId, medicationName, dosage, frequency, duration, instructions } = req.body;

    const record = await MedicalRecord.findByPk(medicalRecordId);
    if (!record) {
      return res.status(404).json({ error: "Medical record not found" });
    }

    const prescription = await Prescription.create({
      medicalRecordId,
      medicationName,
      dosage,
      frequency,
      duration,
      instructions
    });

    // Notify patient
    const patient = await Patient.findByPk(record.patientId);
    await Notification.create({
      userId: patient.userId,
      type: "prescription",
      title: "New Prescription",
      message: `You have been prescribed ${medicationName}`,
      relatedId: prescription.id
    });

    res.json({ success: true, prescription });
  } catch (error) {
    console.error("Error adding prescription:", error);
    res.status(500).json({ error: "Failed to add prescription" });
  }
};

export const getPrescriptions = async (req, res) => {
  try {
    const { patientId } = req.params;

    const patient = await Patient.findByPk(patientId);
    if (!patient) {
      return res.status(404).json({ error: "Patient not found" });
    }

    const prescriptions = await Prescription.findAll({
      include: [
        {
          model: MedicalRecord,
          where: { patientId },
          attributes: ["id", "diagnosis", "doctorId"],
          include: [
            { model: Doctor, attributes: ["id", "name", "specialization"] }
          ]
        }
      ],
      order: [["prescribedDate", "DESC"]]
    });

    res.json(prescriptions);
  } catch (error) {
    console.error("Error fetching prescriptions:", error);
    res.status(500).json({ error: "Failed to fetch prescriptions" });
  }
};

export const downloadMedicalRecord = async (req, res) => {
  try {
    const { recordId } = req.params;

    const record = await MedicalRecord.findByPk(recordId, {
      include: [
        { model: Patient, attributes: ["id", "name", "email", "age", "bloodType", "allergies", "medicalHistory"] },
        { model: Doctor, attributes: ["id", "name", "specialization"] },
        { model: Prescription }
      ]
    });

    if (!record) {
      return res.status(404).json({ error: "Medical record not found" });
    }

    // Generate PDF or text file
    const content = `
MEDICAL RECORD
==============

Patient Information:
- Name: ${record.Patient.name}
- Email: ${record.Patient.email}
- Age: ${record.Patient.age}
- Blood Type: ${record.Patient.bloodType}
- Allergies: ${record.Patient.allergies || "None"}
- Medical History: ${record.Patient.medicalHistory || "None"}

Doctor Information:
- Name: ${record.Doctor.name}
- Specialization: ${record.Doctor.specialization}

Record Details:
- Date: ${record.recordDate}
- Diagnosis: ${record.diagnosis}
- Treatment: ${record.treatment}
- Notes: ${record.notes}

Prescriptions:
${record.Prescriptions.map(p => `- ${p.medicationName} ${p.dosage} ${p.frequency}`).join('\n')}
    `;

    res.type("text/plain");
    res.download(`medical_record_${recordId}.txt`, content);
  } catch (error) {
    console.error("Error downloading medical record:", error);
    res.status(500).json({ error: "Failed to download medical record" });
  }
};

export const getPatientMedicalHistory = async (req, res) => {
  try {
    const { patientId } = req.params;

    const patient = await Patient.findByPk(patientId);
    if (!patient) {
      return res.status(404).json({ error: "Patient not found" });
    }

    const records = await MedicalRecord.findAll({
      where: { patientId },
      include: [
        { model: Doctor, attributes: ["id", "name", "specialization"] },
        { model: Prescription, attributes: ["id", "medicationName", "dosage", "frequency"] }
      ],
      order: [["recordDate", "DESC"]],
      limit: 50
    });

    res.json({
      patient: {
        id: patient.id,
        name: patient.name,
        age: patient.age,
        bloodType: patient.bloodType,
        allergies: patient.allergies,
        medicalHistory: patient.medicalHistory
      },
      records
    });
  } catch (error) {
    console.error("Error fetching patient medical history:", error);
    res.status(500).json({ error: "Failed to fetch medical history" });
  }
};

export const shareRecord = async (req, res) => {
  try {
    const { recordId, sharedWithUserId } = req.body;

    const record = await MedicalRecord.findByPk(recordId);
    if (!record) {
      return res.status(404).json({ error: "Medical record not found" });
    }

    // Notify the user the record is being shared
    await Notification.create({
      userId: sharedWithUserId,
      type: "medical_record",
      title: "Medical Record Shared",
      message: "A medical record has been shared with you",
      relatedId: recordId
    });

    res.json({ success: true, message: "Record shared successfully" });
  } catch (error) {
    console.error("Error sharing record:", error);
    res.status(500).json({ error: "Failed to share record" });
  }
};
