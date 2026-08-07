
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
    
import bcrypt from "bcrypt";
import crypto from "crypto";
import { User, sequelize } from "../models/userModel.js";
import { Doctor } from "../models/doctorModel.js";
import { Patient } from "../models/patientModel.js";
import { Nurse } from "../models/nurseModel.js";
import "../models/doctorAvailabilityModel.js";
import "../models/doctorDocumentModel.js";
import "../models/doctorMessageModel.js";
import "../models/doctorBillingModel.js";
import "../models/patientBookingModel.js";
import "../models/patientDocumentModel.js";
import "../models/patientMedicalHistoryModel.js";
import "../models/patientMessageModel.js";
import "../models/paymentTransactionModel.js";
import { ActivityLog } from "../models/activityLogModel.js";
import { generateToken, updateLastLogin } from "../middleware/authMiddleware.js";
import { sendVerificationEmail, sendWelcomeEmail } from "../services/emailService.js";
import {
  loginViewData,
  registerViewData,
  forgotPasswordViewData,
  dashboardViewData
} from "../data/viewData.js";

await sequelize.sync();

export const loginPage = (req, res) => res.render("login", loginViewData);
export const registerPage = (req, res) => res.render("register", registerViewData);
export const forgotPasswordPage = (req, res) => res.render("forgotpassword", forgotPasswordViewData);
export const dashboardPage = (req, res) => {
  if (!req.session.userId) return res.redirect("/login");
  res.render("dashboard", dashboardViewData);
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const errors = [];

    if (!email || !password) {
      errors.push("Email and password are required");
      return res.render("login", { ...loginViewData, errors, formData: { email } });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      errors.push("Email or password is incorrect");
      return res.render("login", { ...loginViewData, errors, formData: { email } });
    }

    // Check if user is blocked
    if (user.status === "blocked") {
      errors.push("Your account has been blocked. Please contact the administrator.");
      return res.render("login", { ...loginViewData, errors, formData: { email } });
    }

    let match = false;

    // Backward compatibility: support legacy plain-text passwords once,
    // then upgrade to bcrypt hash after successful login.
    if (typeof user.password === "string" && user.password.startsWith("$2")) {
      match = await bcrypt.compare(password, user.password);
    } else {
      match = password === user.password;
      if (match) {
        user.password = await bcrypt.hash(password, 10);
        await user.save();
      }
    }

    if (!match) {
      errors.push("Email or password is incorrect");
      return res.render("login", { ...loginViewData, errors, formData: { email } });
    }

    // Update last login
    await updateLastLogin(user.id);

    // Log activity
    await ActivityLog.create({
      userId: user.id,
      action: "LOGIN",
      description: `User ${user.email} logged in`,
      ipAddress: req.ip
    });

    req.session.userId = user.id;
    req.session.userName = user.name;
    req.session.userRole = user.role;
    
    const token = generateToken(user.id);
    res.cookie("authToken", token, { maxAge: 7 * 24 * 60 * 60 * 1000 });

    // Redirect based on role
    const redirects = {
      patient: "/patient-dashboard",
      doctor: "/doctor-dashboard",
      nurse: "/nurse-dashboard",
      admin: "/admin-dashboard",
      super_admin: "/admin-dashboard"
    };

    const redirectUrl = redirects[user.role] || "/dashboard";
    res.redirect(redirectUrl);
  } catch (error) {
    console.error("Login error:", error);
    res.render("login", { 
      ...loginViewData, 
      errors: ["An error occurred during login. Please try again."],
      formData: { email: req.body.email }
    });
  }
};

export const registerUser = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      confirmPassword,
      role = "patient",
      specialization,
      license,
      experience,
      licenseNumber,
      phone,
      age,
      gender,
      bloodType,
      allergies,
      address
    } = req.body;
    const errors = [];

    // Validation
    if (!name || name.trim().length < 3) {
      errors.push("Name must be at least 3 characters long");
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push("Please enter a valid email address");
    }
    if (!password || password.length < 6) {
      errors.push("Password must be at least 6 characters long");
    }
    if (password !== confirmPassword) {
      errors.push("Passwords do not match");
    }

    if (!["patient", "doctor", "nurse"].includes(role)) {
      errors.push("Please select a valid role");
    }

    // Patient personal details validation
    if (role === "patient") {
      if (!phone || phone.trim().length < 6) {
        errors.push("Please enter a valid phone number");
      }
      if (!age || age < 1 || age > 120) {
        errors.push("Please enter a valid age (1-120)");
      }
      if (!gender || !["male", "female", "other"].includes(gender)) {
        errors.push("Please select a valid gender");
      }
      if (!bloodType || !["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"].includes(bloodType)) {
        errors.push("Please select a valid blood type");
      }
      if (!address || address.trim().length < 3) {
        errors.push("Please enter a valid address");
      }
    }

    if (role === "doctor") {
      if (!specialization || specialization.trim().length < 2) {
        errors.push("Doctor specialization is required");
      }
      if (!license || license.trim().length < 3) {
        errors.push("Doctor license number is required");
      }
    }

    if (role === "nurse") {
      if (!licenseNumber || licenseNumber.trim().length < 3) {
        errors.push("Nurse license number is required");
      }
    }

    if (errors.length > 0) {
      return res.render("register", {
        ...registerViewData,
        errors,
        formData: {
          name,
          email,
          role,
          specialization,
          license,
          experience,
          licenseNumber,
          phone,
          age,
          gender,
          bloodType,
          allergies,
          address
        }
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      errors.push("Email is already registered. Please login or use a different email.");
      return res.render("register", {
        ...registerViewData,
        errors,
        formData: {
          name,
          email,
          role,
          specialization,
          license,
          experience,
          licenseNumber,
          phone,
          age,
          gender,
          bloodType,
          allergies,
          address
        }
      });
    }

    if (role === "doctor") {
      const existingLicense = await Doctor.findOne({ where: { license } });
      if (existingLicense) {
        errors.push("Doctor license is already registered.");
      }
    }

    if (role === "nurse") {
      const existingNurseLicense = await Nurse.findOne({ where: { licenseNumber } });
      if (existingNurseLicense) {
        errors.push("Nurse license number is already registered.");
      }
    }

    if (errors.length > 0) {
      return res.render("register", {
        ...registerViewData,
        errors,
        formData: {
          name,
          email,
          role,
          specialization,
          license,
          experience,
          licenseNumber,
          phone,
          age,
          gender,
          bloodType,
          allergies,
          address
        }
      });
    }

    // Hash password
    const hashed = await bcrypt.hash(password, 10);

    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationTokenHash = crypto.createHash("sha256").update(verificationToken).digest("hex");
    const verificationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create user with role
    const userStatus = "active";

    const user = await User.create({ 
      name, 
      email, 
      password: hashed,
      role: role || "patient",
      status: userStatus,
      emailVerified: false,
      emailVerificationToken: verificationTokenHash,
      emailVerificationExpiresAt: verificationExpiresAt
    });

    // Create role-specific records
    if (role === "patient") {
      await Patient.create({
        userId: user.id,
        name: name,
        phone: phone,
        age: Number(age),
        gender: gender,
        bloodType: bloodType,
        allergies: allergies || null,
        address: address
      });
    } else if (role === "doctor") {
      await Doctor.create({
        userId: user.id,
        name,
        specialization,
        license,
        experience: Number(experience) || 0
      });
    } else if (role === "nurse") {
      await Nurse.create({
        userId: user.id,
        name,
        specialization: specialization || null,
        licenseNumber
      });
    }

    // Log activity
    await ActivityLog.create({
      userId: user.id,
      action: "REGISTER",
      entityType: "User",
      description: `User registered as ${role}`
    });

    // Send verification email
    const verificationLink = `${process.env.APP_URL || "http://localhost:3007"}/verify-email/${user.id}/${verificationToken}`;
    await sendVerificationEmail(email, name, verificationToken, verificationLink);

    // Set session
    req.session.userId = user.id;
    req.session.userName = user.name;
    req.session.userRole = user.role;

    // Redirect to email verification page
    res.render("email-verification", {
      title: "Verify Your Email",
      email: email,
      name: name,
      role: role,
      message: `A verification email has been sent to ${email}. Please check your inbox and click the verification link to activate your account.`
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.render("register", { 
      ...registerViewData, 
      errors: ["An error occurred during registration. Please try again."],
      formData: {
        name: req.body.name,
        email: req.body.email,
        role: req.body.role,
        specialization: req.body.specialization,
        license: req.body.license,
        experience: req.body.experience,
        licenseNumber: req.body.licenseNumber,
        phone: req.body.phone,
        age: req.body.age,
        gender: req.body.gender,
        bloodType: req.body.bloodType,
        allergies: req.body.allergies,
        address: req.body.address
      }
    });
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const { userId, token } = req.params;

    if (!userId || !token) {
      return res.render("error", { message: "Invalid or missing verification link." });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.render("error", { message: "User not found." });
    }

    // Check if already verified
    if (user.emailVerified) {
      return res.render("email-verified", {
        title: "Email Already Verified",
        message: "Your email has already been verified. You can now log in to your account.",
        email: user.email
      });
    }

    // Verify token
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    if (user.emailVerificationToken !== tokenHash) {
      return res.render("error", { message: "Invalid verification token." });
    }

    // Check if token expired
    if (new Date() > user.emailVerificationExpiresAt) {
      return res.render("error", { message: "Verification link has expired. Please register again." });
    }

    // Mark email as verified
    user.emailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpiresAt = null;
    await user.save();

    // Send welcome email
    await sendWelcomeEmail(user.email, user.name, user.role);

    // Log activity
    await ActivityLog.create({
      userId: user.id,
      action: "EMAIL_VERIFIED",
      description: `User ${user.email} verified their email address`,
      ipAddress: req.ip
    });

    res.render("email-verified", {
      title: "Email Verified Successfully!",
      message: "Your email has been verified successfully! You can now log in to your MEDISERVE account.",
      email: user.email
    });
  } catch (error) {
    console.error("Email verification error:", error);
    res.render("error", { message: "An error occurred during email verification. Please try again." });
  }
};

export const registerDoctor = async (req, res) => {
  try {
    const { name, email, password, specialization, license, experience } = req.body;
    const errors = [];

    // Validation
    if (!name || name.trim().length < 3) errors.push("Name is required");
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push("Valid email is required");
    if (!password || password.length < 6) errors.push("Password must be at least 6 characters");
    if (!specialization) errors.push("Specialization is required");
    if (!license) errors.push("License number is required");

    if (errors.length > 0) {
      return res.json({ success: false, errors });
    }

    // Check existing user
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.json({ success: false, errors: ["Email already registered"] });
    }

    // Create user
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      password: hashed,
      role: "doctor",
      status: "active"
    });

    // Create doctor profile
    await Doctor.create({
      userId: user.id,
      name,
      specialization,
      license,
      experience: experience || 0
    });

    res.json({ 
      success: true, 
      message: "Registration successful! You can now sign in."
    });
  } catch (error) {
    console.error("Doctor registration error:", error);
    res.json({ success: false, errors: ["Registration failed"] });
  }
};

export const registerNurse = async (req, res) => {
  try {
    const { name, email, password, licenseNumber, specialization } = req.body;
    const errors = [];

    if (!name || name.trim().length < 3) errors.push("Name is required");
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push("Valid email is required");
    if (!password || password.length < 6) errors.push("Password must be at least 6 characters");
    if (!licenseNumber) errors.push("License number is required");

    if (errors.length > 0) {
      return res.json({ success: false, errors });
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.json({ success: false, errors: ["Email already registered"] });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      password: hashed,
      role: "nurse",
      status: "active"
    });

    await Nurse.create({
      userId: user.id,
      name,
      licenseNumber,
      specialization: specialization || null
    });

    res.json({ 
      success: true, 
      message: "Registration successful! You can now sign in."
    });
  } catch (error) {
    console.error("Nurse registration error:", error);
    res.json({ success: false, errors: ["Registration failed"] });
  }
};

export const logoutUser = async (req, res) => {
  try {
    if (req.user) {
      await ActivityLog.create({
        userId: req.user.id,
        action: "LOGOUT",
        description: `User logged out`
      });
    }
    req.session.destroy();
    res.clearCookie("authToken");
    res.redirect("/");
  } catch (error) {
    console.error("Logout error:", error);
    res.redirect("/");
  }
};
