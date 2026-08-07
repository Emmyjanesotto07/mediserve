/*
MIT License

Copyright (c) 2025 Christian I. Cabrera || XianFire Framework
Mindoro State University - Philippines
*/

import jwt from "jsonwebtoken";
import { User } from "../models/userModel.js";

const JWT_SECRET = process.env.JWT_SECRET || "mediserve_secret_key_2025";

const wantsHtmlResponse = (req) => {
  const acceptHeader = req.headers.accept || "";
  return acceptHeader.includes("text/html");
};

const unauthorizedResponse = (req, res, message) => {
  if (wantsHtmlResponse(req)) {
    return res.redirect("/login");
  }
  return res.status(401).json({ error: message });
};

// Middleware to verify JWT token
export const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1] || req.cookies?.authToken;

    // Session fallback keeps server-rendered pages working even if JWT cookie is missing.
    if (!token && req.session?.userId) {
      const sessionUser = await User.findByPk(req.session.userId);
      if (!sessionUser || sessionUser.status === "blocked") {
        return unauthorizedResponse(req, res, "Unauthorized");
      }

      req.user = sessionUser;
      return next();
    }

    if (!token) {
      return unauthorizedResponse(req, res, "No token provided");
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findByPk(decoded.id);

    if (!user || user.status === "blocked") {
      return unauthorizedResponse(req, res, "Unauthorized");
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    console.error("Token verification error:", error);
    return unauthorizedResponse(req, res, "Invalid token");
  }
};

// Middleware to check user role(s)
export const isRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    next();
  };
};

// Middleware to check if user is patient
export const isPatient = (req, res, next) => {
  if (req.user?.role !== "patient") {
    return res.status(403).json({ error: "Patient access only" });
  }
  next();
};

// Middleware to check if user is doctor
export const isDoctor = (req, res, next) => {
  if (req.user?.role !== "doctor") {
    return res.status(403).json({ error: "Doctor access only" });
  }
  next();
};

// Middleware to check if user is nurse
export const isNurse = (req, res, next) => {
  if (req.user?.role !== "nurse") {
    return res.status(403).json({ error: "Nurse access only" });
  }
  next();
};

// Middleware to check if user is admin or super_admin
export const isAdmin = (req, res, next) => {
  if (!["admin", "super_admin"].includes(req.user?.role)) {
    return res.status(403).json({ error: "Admin access only" });
  }
  next();
};

// Middleware to check if user is super_admin
export const isSuperAdmin = (req, res, next) => {
  if (req.user?.role !== "super_admin") {
    return res.status(403).json({ error: "Super Admin access only" });
  }
  next();
};

// Generate JWT token
export const generateToken = (userId) => {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: "7d" });
};

// Update last login
export const updateLastLogin = async (userId) => {
  try {
    await User.update({ lastLogin: new Date() }, { where: { id: userId } });
  } catch (error) {
    console.error("Error updating last login:", error);
  }
};
