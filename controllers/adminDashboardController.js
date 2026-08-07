/*
MIT License

Copyright (c) 2025 Christian I. Cabrera || XianFire Framework
Mindoro State University - Philippines
*/

import { User } from "../models/userModel.js";
import { Doctor } from "../models/doctorModel.js";
import { Patient } from "../models/patientModel.js";
import { Nurse } from "../models/nurseModel.js";
import { Appointment } from "../models/appointmentModel.js";
import { ActivityLog } from "../models/activityLogModel.js";
import { Consultation } from "../models/consultationModel.js";
import { MedicalRecord } from "../models/medicalRecordModel.js";
import { Notification } from "../models/notificationModel.js";
import { sequelize } from "../models/db.js";
import { Op } from "sequelize";
import { QueryTypes } from "sequelize";

const toPercent = (value, total) => {
  if (!total || total <= 0) return 0;
  return Math.round((value / total) * 100);
};

const toWidthClass = (percentage) => {
  if (percentage >= 100) return "w-full";
  if (percentage >= 90) return "w-11/12";
  if (percentage >= 80) return "w-10/12";
  if (percentage >= 70) return "w-9/12";
  if (percentage >= 60) return "w-8/12";
  if (percentage >= 50) return "w-6/12";
  if (percentage >= 40) return "w-5/12";
  if (percentage >= 30) return "w-4/12";
  if (percentage >= 20) return "w-3/12";
  if (percentage >= 10) return "w-2/12";
  if (percentage > 0) return "w-1/12";
  return "w-0";
};

export const adminDashboardPage = async (req, res) => {
  try {
    const userId = req.user?.id || req.session?.userId;
    if (!userId) {
      return res.redirect("/login");
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - 6);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 5, 1);

    // User and registration statistics
    const totalUsers = await User.count();
    const totalDoctors = await User.count({ where: { role: "doctor" } });
    const totalPatients = await User.count({ where: { role: "patient" } });
    const totalNurses = await User.count({ where: { role: "nurse" } });
    const totalAdmins = await User.count({ where: { role: "admin" } });
    const totalSuperAdmins = await User.count({ where: { role: "super_admin" } });
    const medicalStaffCount = totalDoctors + totalNurses;

    const activeAccounts = await User.count({ where: { status: "active" } });
    const blockedAccounts = await User.count({ where: { status: "blocked" } });
    const inactiveAccounts = await User.count({ where: { status: "inactive" } });

    // Appointment management statistics
    const totalAppointments = await Appointment.count();
    const appointmentStatusRaw = await Appointment.findAll({
      attributes: ["status", [sequelize.fn("COUNT", sequelize.col("id")), "count"]],
      group: ["status"],
      raw: true
    });

    const appointmentStatusMap = {
      scheduled: 0,
      completed: 0,
      cancelled: 0,
      "no-show": 0
    };

    appointmentStatusRaw.forEach((row) => {
      appointmentStatusMap[row.status] = Number(row.count);
    });

    const todayAppointments = await Appointment.count({
      where: {
        appointmentDate: {
          [Op.gte]: today,
          [Op.lt]: tomorrow
        }
      }
    });

    const monthAppointments = await Appointment.count({
      where: {
        appointmentDate: {
          [Op.gte]: monthStart
        }
      }
    });

    const recentAppointments = await Appointment.findAll({
      attributes: ["id", "appointmentDate", "startTime", "consultationType", "status"],
      order: [["appointmentDate", "DESC"]],
      limit: 8,
      raw: true
    });

    const monthlyAppointmentsRaw = await Appointment.findAll({
      where: {
        appointmentDate: {
          [Op.gte]: sixMonthsAgo
        }
      },
      attributes: ["appointmentDate"],
      raw: true
    });

    const monthlyAppointmentMap = {};
    for (let i = 0; i < 6; i += 1) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      monthlyAppointmentMap[key] = {
        label: d.toLocaleString("en-US", { month: "short" }),
        count: 0
      };
    }

    monthlyAppointmentsRaw.forEach((row) => {
      const date = new Date(row.appointmentDate);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      if (monthlyAppointmentMap[key]) {
        monthlyAppointmentMap[key].count += 1;
      }
    });

    const monthlyAppointmentSeries = Object.values(monthlyAppointmentMap).reverse();
    const maxMonthlyAppointments = Math.max(1, ...monthlyAppointmentSeries.map((m) => m.count));
    const monthlyAppointmentBars = monthlyAppointmentSeries.map((m) => ({
      ...m,
      percentage: toPercent(m.count, maxMonthlyAppointments),
      widthClass: toWidthClass(toPercent(m.count, maxMonthlyAppointments))
    }));

    // Consultation statistics
    const consultationsTotal = await Consultation.count();
    const consultationsDaily = await Consultation.count({ where: { createdAt: { [Op.gte]: today } } });
    const consultationsWeekly = await Consultation.count({ where: { createdAt: { [Op.gte]: weekStart } } });
    const consultationsMonthly = await Consultation.count({ where: { createdAt: { [Op.gte]: monthStart } } });

    const maxConsultationValue = Math.max(1, consultationsDaily, consultationsWeekly, consultationsMonthly);
    const consultationTrendBars = [
      { label: "Daily", count: consultationsDaily, percentage: toPercent(consultationsDaily, maxConsultationValue) },
      { label: "Weekly", count: consultationsWeekly, percentage: toPercent(consultationsWeekly, maxConsultationValue) },
      { label: "Monthly", count: consultationsMonthly, percentage: toPercent(consultationsMonthly, maxConsultationValue) }
    ].map((item) => ({
      ...item,
      widthClass: toWidthClass(item.percentage)
    }));

    // Medical records and notifications
    const totalMedicalRecords = await MedicalRecord.count();
    const updatedMedicalRecordsMonthly = await MedicalRecord.count({
      where: {
        updatedAt: {
          [Op.gte]: monthStart
        }
      }
    });

    const totalNotifications = await Notification.count();
    const unreadNotifications = await Notification.count({ where: { isRead: false } });

    // Security and activity
    const loginEventsToday = await ActivityLog.count({
      where: {
        action: "LOGIN",
        createdAt: {
          [Op.gte]: today
        }
      }
    });

    const auditTrailCountMonthly = await ActivityLog.count({
      where: {
        createdAt: {
          [Op.gte]: monthStart
        }
      }
    });

    const recentActivity = await ActivityLog.findAll({
      limit: 20,
      order: [["createdAt", "DESC"]]
    });

    // Feedback and support metrics
    const feedbackOpen = await ActivityLog.count({
      where: {
        action: {
          [Op.in]: ["FEEDBACK", "COMPLAINT", "SUPPORT_REQUEST"]
        }
      }
    });

    const feedbackResolved = await ActivityLog.count({
      where: {
        action: {
          [Op.in]: ["FEEDBACK_RESOLVED", "COMPLAINT_RESOLVED", "SUPPORT_RESOLVED"]
        }
      }
    });

    // System settings metrics
    const doctorsWithSchedule = await Doctor.count({ where: { status: "active" } });
    const averageConsultationFee = await Doctor.findOne({
      attributes: [[sequelize.fn("AVG", sequelize.col("consultationFee")), "avgFee"]],
      raw: true
    });

    const avgConsultationFee = Number(averageConsultationFee?.avgFee || 0).toFixed(2);

    const recentUsers = await User.findAll({
      attributes: ["id", "name", "email", "role", "status", "createdAt"],
      order: [["createdAt", "DESC"]],
      limit: 8,
      raw: true
    });

    const appointmentStatusItems = [
      { key: "scheduled", label: "Scheduled", count: appointmentStatusMap.scheduled, color: "bg-amber-500" },
      { key: "completed", label: "Completed", count: appointmentStatusMap.completed, color: "bg-emerald-500" },
      { key: "cancelled", label: "Cancelled", count: appointmentStatusMap.cancelled, color: "bg-rose-500" },
      { key: "no-show", label: "No Show", count: appointmentStatusMap["no-show"], color: "bg-slate-400" }
    ].map((item) => ({
      ...item,
      percentage: toPercent(item.count, Math.max(totalAppointments, 1)),
      widthClass: toWidthClass(toPercent(item.count, Math.max(totalAppointments, 1)))
    }));

    const userRoleItems = [
      { label: "Patient", count: totalPatients },
      { label: "Doctor", count: totalDoctors },
      { label: "Nurse", count: totalNurses },
      { label: "Admin", count: totalAdmins + totalSuperAdmins }
    ].map((item) => ({
      ...item,
      percentage: toPercent(item.count, Math.max(totalUsers, 1)),
      widthClass: toWidthClass(toPercent(item.count, Math.max(totalUsers, 1)))
    }));

    const formattedRecentActivity = recentActivity.map((log) => ({
      ...log.toJSON(),
      createdAtText: new Date(log.createdAt).toLocaleString()
    }));

    const formattedRecentUsers = recentUsers.map((user) => {
      const isBlocked = user.status === "blocked";
      return {
        ...user,
        isBlocked,
        userActionText: isBlocked ? "Unblock" : "Block",
        userActionClass: isBlocked ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700",
        createdAtText: new Date(user.createdAt).toLocaleDateString()
      };
    });

    const formattedRecentAppointments = recentAppointments.map((appointment) => ({
      ...appointment,
      appointmentDateText: new Date(appointment.appointmentDate).toLocaleDateString()
    }));

    const viewData = {
      title: "Admin Dashboard",
      stats: {
        totalUsers,
        totalDoctors,
        totalPatients,
        totalNurses,
        totalAppointments,
        todayAppointments,
        monthAppointments,
        consultationsTotal,
        consultationsDaily,
        consultationsWeekly,
        consultationsMonthly,
        totalMedicalRecords,
        updatedMedicalRecordsMonthly,
        totalNotifications,
        unreadNotifications,
        activeAccounts,
        blockedAccounts,
        inactiveAccounts,
        loginEventsToday,
        auditTrailCountMonthly,
        totalAdmins,
        totalSuperAdmins,
        medicalStaffCount,
        doctorsWithSchedule,
        avgConsultationFee,
        feedbackOpen,
        feedbackResolved
      },
      appointmentStatusItems,
      userRoleItems,
      consultationTrendBars,
      monthlyAppointmentBars,
      recentActivity: formattedRecentActivity,
      recentUsers: formattedRecentUsers,
      recentAppointments: formattedRecentAppointments
    };

    res.render("admin-dashboard", viewData);
  } catch (error) {
    console.error("Error in adminDashboardPage:", error);
    res.status(500).render("error", { message: "Error loading admin dashboard" });
  }
};

export const approveDoctorRegistration = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findByPk(userId);
    if (!user || user.role !== "doctor") {
      return res.status(404).json({ error: "Doctor not found" });
    }

    await User.update({ status: "active" }, { where: { id: userId } });

    // Log activity
    await ActivityLog.create({
      userId: req.user.id,
      action: "APPROVED",
      entityType: "Doctor",
      entityId: userId,
      description: `Approved doctor registration for user ${user.name}`
    });

    res.json({ success: true, message: "Doctor approved successfully" });
  } catch (error) {
    console.error("Error approving doctor:", error);
    res.status(500).json({ error: "Failed to approve doctor" });
  }
};

export const rejectDoctorRegistration = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    const user = await User.findByPk(userId);
    if (!user || user.role !== "doctor") {
      return res.status(404).json({ error: "Doctor not found" });
    }

    await User.update({ status: "inactive" }, { where: { id: userId } });

    // Log activity
    await ActivityLog.create({
      userId: req.user.id,
      action: "REJECTED",
      entityType: "Doctor",
      entityId: userId,
      description: `Rejected doctor registration. Reason: ${reason || "No reason provided"}`
    });

    res.json({ success: true, message: "Doctor registration rejected" });
  } catch (error) {
    console.error("Error rejecting doctor:", error);
    res.status(500).json({ error: "Failed to reject doctor" });
  }
};

export const approveNurseRegistration = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findByPk(userId);
    if (!user || user.role !== "nurse") {
      return res.status(404).json({ error: "Nurse not found" });
    }

    await User.update({ status: "active" }, { where: { id: userId } });

    await ActivityLog.create({
      userId: req.user.id,
      action: "APPROVED",
      entityType: "Nurse",
      entityId: userId,
      description: `Approved nurse registration for user ${user.name}`
    });

    res.json({ success: true, message: "Nurse approved successfully" });
  } catch (error) {
    console.error("Error approving nurse:", error);
    res.status(500).json({ error: "Failed to approve nurse" });
  }
};

export const rejectNurseRegistration = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    const user = await User.findByPk(userId);
    if (!user || user.role !== "nurse") {
      return res.status(404).json({ error: "Nurse not found" });
    }

    await User.update({ status: "inactive" }, { where: { id: userId } });

    await ActivityLog.create({
      userId: req.user.id,
      action: "REJECTED",
      entityType: "Nurse",
      entityId: userId,
      description: `Rejected nurse registration. Reason: ${reason || "No reason provided"}`
    });

    res.json({ success: true, message: "Nurse registration rejected" });
  } catch (error) {
    console.error("Error rejecting nurse:", error);
    res.status(500).json({ error: "Failed to reject nurse" });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const { role, status } = req.query;
    const where = {};

    if (role) where.role = role;
    if (status) where.status = status;

    const users = await User.findAll({
      where,
      attributes: { exclude: ["password"] },
      limit: 100,
      order: [["createdAt", "DESC"]]
    });

    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
};

export const blockUser = async (req, res) => {
  try {
    const { userId } = req.params;

    if (String(req.user.id) === String(userId)) {
      return res.status(400).json({ error: "You cannot block your own account" });
    }

    const targetUser = await User.findByPk(userId);
    if (!targetUser) {
      return res.status(404).json({ error: "User not found" });
    }

    if (targetUser.role === "super_admin") {
      return res.status(403).json({ error: "Super admin account cannot be blocked" });
    }

    await User.update({ status: "blocked" }, { where: { id: userId } });

    await ActivityLog.create({
      userId: req.user.id,
      action: "BLOCKED",
      entityType: "User",
      entityId: userId
    });

    res.json({ success: true, message: "User blocked successfully" });
  } catch (error) {
    console.error("Error blocking user:", error);
    res.status(500).json({ error: "Failed to block user" });
  }
};

export const unblockUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const targetUser = await User.findByPk(userId);
    if (!targetUser) {
      return res.status(404).json({ error: "User not found" });
    }

    await User.update({ status: "active" }, { where: { id: userId } });

    await ActivityLog.create({
      userId: req.user.id,
      action: "UNBLOCKED",
      entityType: "User",
      entityId: userId
    });

    res.json({ success: true, message: "User unblocked successfully" });
  } catch (error) {
    console.error("Error unblocking user:", error);
    res.status(500).json({ error: "Failed to unblock user" });
  }
};

export const getSystemReports = async (req, res) => {
  try {
    // Generate various system reports
    const appointmentStats = await sequelize.query(`
      SELECT status, COUNT(*) as count
      FROM Appointments
      GROUP BY status
    `, { type: QueryTypes.SELECT });

    const userStats = await sequelize.query(`
      SELECT role, status, COUNT(*) as count
      FROM Users
      GROUP BY role, status
    `, { type: QueryTypes.SELECT });

    const monthlyAppointments = await sequelize.query(`
      SELECT DATE(appointmentDate) as date, COUNT(*) as count
      FROM Appointments
      WHERE appointmentDate >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY DATE(appointmentDate)
    `, { type: QueryTypes.SELECT });

    res.json({
      appointmentStats,
      userStats,
      monthlyAppointments
    });
  } catch (error) {
    console.error("Error getting system reports:", error);
    res.status(500).json({ error: "Failed to generate reports" });
  }
};

export const getActivityLog = async (req, res) => {
  try {
    const { limit = 100, offset = 0, userId = null } = req.query;
    const where = {};
    const safeLimit = Number.isNaN(Number(limit)) ? 100 : Math.min(Math.max(parseInt(limit, 10), 1), 500);
    const safeOffset = Number.isNaN(Number(offset)) ? 0 : Math.max(parseInt(offset, 10), 0);

    if (userId) where.userId = userId;

    const logs = await ActivityLog.findAll({
      where,
      limit: safeLimit,
      offset: safeOffset,
      order: [["createdAt", "DESC"]]
    });

    const total = await ActivityLog.count({ where });

    res.json({ logs, total, limit: safeLimit, offset: safeOffset });
  } catch (error) {
    console.error("Error fetching activity logs:", error);
    res.status(500).json({ error: "Failed to fetch activity logs" });
  }
};
