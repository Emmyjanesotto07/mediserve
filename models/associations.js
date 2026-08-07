/*
MIT License

Copyright (c) 2025 Christian I. Cabrera || XianFire Framework
Mindoro State University - Philippines
*/

export const setupAssociations = (models) => {
  const {
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
  } = models;

  // ============================================
  // Patient Associations
  // ============================================
  Patient.belongsTo(User, { foreignKey: 'userId' });
  Patient.hasMany(Appointment, { foreignKey: 'patientId' });
  Patient.hasMany(MedicalRecord, { foreignKey: 'patientId' });
  Patient.hasMany(Prescription, { foreignKey: 'patientId' });
  Patient.hasMany(PatientBooking, { foreignKey: 'patientId' });
  Patient.hasMany(PatientDocument, { foreignKey: 'patientId' });
  Patient.hasMany(PatientMedicalHistory, { foreignKey: 'patientId' });
  Patient.hasMany(PatientMessage, { foreignKey: 'patientId' });
  Patient.hasMany(PaymentTransaction, { foreignKey: 'patientId' });
  Patient.hasMany(Consultation, { foreignKey: 'patientId' });

  // ============================================
  // Doctor Associations
  // ============================================
  Doctor.belongsTo(User, { foreignKey: 'userId' });
  Doctor.hasMany(Appointment, { foreignKey: 'doctorId' });
  Doctor.hasMany(DoctorAvailability, { foreignKey: 'doctorId' });
  Doctor.hasMany(MedicalRecord, { foreignKey: 'doctorId' });
  Doctor.hasMany(Prescription, { foreignKey: 'doctorId' });
  Doctor.hasMany(Consultation, { foreignKey: 'doctorId' });
  Doctor.hasMany(DoctorMessage, { foreignKey: 'doctorId' });
  Doctor.hasMany(DoctorBilling, { foreignKey: 'doctorId' });
  Doctor.hasMany(DoctorDocument, { foreignKey: 'doctorId' });
  Doctor.hasMany(PatientBooking, { foreignKey: 'doctorId' });
  Doctor.hasMany(PaymentTransaction, { foreignKey: 'doctorId' });

  // ============================================
  // Appointment Associations
  // ============================================
  Appointment.belongsTo(Patient, { foreignKey: 'patientId' });
  Appointment.belongsTo(Doctor, { foreignKey: 'doctorId' });
  Appointment.hasMany(Consultation, { foreignKey: 'appointmentId' });
  Appointment.hasMany(MedicalRecord, { foreignKey: 'appointmentId' });
  Appointment.hasMany(PaymentTransaction, { foreignKey: 'appointmentId' });

  // ============================================
  // MedicalRecord Associations
  // ============================================
  MedicalRecord.belongsTo(Patient, { foreignKey: 'patientId' });
  MedicalRecord.belongsTo(Doctor, { foreignKey: 'doctorId' });
  if (Appointment) {
    MedicalRecord.belongsTo(Appointment, { foreignKey: 'appointmentId' });
  }
  MedicalRecord.hasMany(Prescription, { foreignKey: 'medicalRecordId' });

  // ============================================
  // Prescription Associations
  // ============================================
  Prescription.belongsTo(Patient, { foreignKey: 'patientId' });
  Prescription.belongsTo(Doctor, { foreignKey: 'doctorId' });
  if (MedicalRecord) {
    Prescription.belongsTo(MedicalRecord, { foreignKey: 'medicalRecordId' });
  }

  // ============================================
  // Consultation Associations
  // ============================================
  Consultation.belongsTo(Patient, { foreignKey: 'patientId' });
  Consultation.belongsTo(Doctor, { foreignKey: 'doctorId' });
  Consultation.belongsTo(Appointment, { foreignKey: 'appointmentId' });

  // ============================================
  // PatientBooking Associations
  // ============================================
  PatientBooking.belongsTo(Patient, { foreignKey: 'patientId' });
  PatientBooking.belongsTo(Doctor, { foreignKey: 'doctorId' });
  if (Appointment) {
    PatientBooking.belongsTo(Appointment, { foreignKey: 'appointmentId' });
  }

  // ============================================
  // User Associations
  // ============================================
  User.hasOne(Patient, { foreignKey: 'userId' });
  User.hasOne(Doctor, { foreignKey: 'userId' });
  User.hasOne(Nurse, { foreignKey: 'userId' });
  User.hasMany(Notification, { foreignKey: 'userId' });
  User.hasMany(ActivityLog, { foreignKey: 'userId' });

  // ============================================
  // Other Associations
  // ============================================
  PatientDocument.belongsTo(Patient, { foreignKey: 'patientId' });
  PatientMedicalHistory.belongsTo(Patient, { foreignKey: 'patientId' });
  PatientMessage.belongsTo(Patient, { foreignKey: 'patientId' });
  DoctorMessage.belongsTo(Doctor, { foreignKey: 'doctorId' });
  DoctorAvailability.belongsTo(Doctor, { foreignKey: 'doctorId' });
  DoctorBilling.belongsTo(Doctor, { foreignKey: 'doctorId' });
  DoctorDocument.belongsTo(Doctor, { foreignKey: 'doctorId' });
};

export default setupAssociations;
