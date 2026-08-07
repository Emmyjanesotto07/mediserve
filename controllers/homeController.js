
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
import { homeViewData } from "../data/viewData.js";
import { Doctor } from "../models/doctorModel.js";
import { Patient } from "../models/patientModel.js";
import { Appointment } from "../models/appointmentModel.js";
import { sequelize } from "../models/db.js";
import { Op } from "sequelize";

export const homePage = async (req, res) => {
  try {
    // Fetch statistics from database
    const totalDoctors = await Doctor.count({ where: { status: "active" } });
    const totalPatients = await Patient.count();
    const totalAppointments = await Appointment.count();
    
    // Count scheduled appointments (upcoming)
    const scheduledAppointments = await Appointment.count({
      where: {
        status: "scheduled",
        appointmentDate: {
          [Op.gte]: new Date()
        }
      }
    });

    // Get today's appointments
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayAppointments = await Appointment.count({
      where: {
        appointmentDate: {
          [Op.gte]: today,
          [Op.lt]: tomorrow
        }
      }
    });

    // Get completed appointments this month
    const monthStart = new Date();
    monthStart.setDate(1);
    
    const completedThisMonth = await Appointment.count({
      where: {
        status: "completed",
        createdAt: {
          [Op.gte]: monthStart
        }
      }
    });

    // Get top specializations
    const specializations = await Doctor.findAll({
      attributes: [
        "specialization",
        [sequelize.fn("COUNT", sequelize.col("id")), "count"]
      ],
      where: { status: "active" },
      group: ["specialization"],
      order: [[sequelize.fn("COUNT", sequelize.col("id")), "DESC"]],
      limit: 3,
      raw: true
    });

    // Get recent doctors
    const recentDoctors = await Doctor.findAll({
      limit: 6,
      order: [["createdAt", "DESC"]],
      where: { status: "active" }
    });

    // Prepare view data with database statistics
    const viewData = {
      ...homeViewData,
      stats: {
        totalDoctors,
        totalPatients,
        totalAppointments,
        scheduledAppointments,
        todayAppointments,
        completedThisMonth
      },
      specializations: specializations || [],
      recentDoctors: recentDoctors || []
    };

    res.render("home", viewData);
  } catch (error) {
    console.error("Error in homePage:", error);
    // Fallback to static data if there's an error
    res.render("home", homeViewData);
  }
};
