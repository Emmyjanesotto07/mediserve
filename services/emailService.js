/*
MIT License

Copyright (c) 2025 Christian I. Cabrera || XianFire Framework
Mindoro State University - Philippines
*/

import nodemailer from "nodemailer";

// Configure your email service here
// Using Gmail SMTP - you need to use App Password
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER || "your-email@gmail.com",
    pass: process.env.EMAIL_PASSWORD || "your-app-password" // Use app password, not regular password
  }
});

// Test the connection
transporter.verify((error, success) => {
  if (error) {
    console.warn("⚠️ Email service warning:", error.message);
    console.warn("💡 Please configure EMAIL_USER and EMAIL_PASSWORD in .env file");
  } else {
    console.log("✓ Email service is ready to send messages");
  }
});

export const sendVerificationEmail = async (email, name, verificationToken, verificationLink) => {
  try {
    const mailOptions = {
      from: '"MEDISERVE" <noreply@mediserve.com>',
      to: email,
      subject: "📧 Verify Your MEDISERVE Account",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9; border-radius: 10px; }
            .header { background: linear-gradient(135deg, #0066cc 0%, #0066cc 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .header h1 { margin: 0; font-size: 28px; }
            .content { background: white; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #0066cc; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
            .button:hover { background: #0052a3; }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
            .token-box { background: #f0f0f0; padding: 15px; border-radius: 5px; font-family: monospace; word-break: break-all; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Verify Your Email</h1>
            </div>
            <div class="content">
              <p>Hi <strong>${name}</strong>,</p>
              <p>Welcome to <strong>MEDISERVE</strong> - Your Online Consultation & Medical Records System!</p>
              <p>To activate your account and start using our services, please verify your email address by clicking the button below:</p>
              
              <center>
                <a href="${verificationLink}" class="button">✓ Verify Email Address</a>
              </center>
              
              <p>Or copy and paste this verification token:</p>
              <div class="token-box">${verificationToken}</div>
              
              <p><strong>This link expires in 24 hours.</strong></p>
              
              <p>If you didn't create this account, please ignore this email.</p>
              
              <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
              
              <p>Best regards,<br><strong>MEDISERVE Team</strong></p>
            </div>
            <div class="footer">
              <p>&copy; 2025 MEDISERVE. All rights reserved. | Online Consultation & Medical Records System</p>
              <p>Healthcare made accessible • Available 24/7</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Verification email sent:", info.response);
    return { success: true, message: "Verification email sent successfully" };
  } catch (error) {
    console.error("Error sending verification email:", error);
    return { success: false, error: error.message };
  }
};

export const sendWelcomeEmail = async (email, name, userRole) => {
  try {
    const roleDescription = {
      patient: "Patient",
      doctor: "Doctor",
      nurse: "Nurse",
      admin: "Administrator"
    };

    const mailOptions = {
      from: '"MEDISERVE" <noreply@mediserve.com>',
      to: email,
      subject: "🎉 Welcome to MEDISERVE!",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9; border-radius: 10px; }
            .header { background: linear-gradient(135deg, #0066cc 0%, #0066cc 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .header h1 { margin: 0; font-size: 28px; }
            .content { background: white; padding: 30px; border-radius: 0 0 10px 10px; }
            .feature { background: #f0f7ff; border-left: 4px solid #0066cc; padding: 15px; margin: 15px 0; border-radius: 5px; }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Welcome, ${name}!</h1>
            </div>
            <div class="content">
              <p>Your MEDISERVE account as a <strong>${roleDescription[userRole] || "User"}</strong> has been successfully created!</p>
              
              <p>You can now access:</p>
              
              <div class="feature">
                <strong>📅 Appointment Management</strong><br>
                Schedule consultations with doctors or healthcare providers
              </div>
              
              <div class="feature">
                <strong>💻 Online Consultation</strong><br>
                Video calls and chat-based consultations anytime, anywhere
              </div>
              
              <div class="feature">
                <strong>📂 Medical Records</strong><br>
                Access and download your medical history, prescriptions, and lab results
              </div>
              
              <div class="feature">
                <strong>🔔 Notifications</strong><br>
                Get appointment reminders and medication alerts
              </div>
              
              <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
              
              <p>Best regards,<br><strong>MEDISERVE Team</strong></p>
            </div>
            <div class="footer">
              <p>&copy; 2025 MEDISERVE. All rights reserved. | Online Consultation & Medical Records System</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Welcome email sent:", info.response);
    return { success: true, message: "Welcome email sent successfully" };
  } catch (error) {
    console.error("Error sending welcome email:", error);
    return { success: false, error: error.message };
  }
};

export const sendPasswordResetEmail = async (email, name, resetLink) => {
  try {
    const mailOptions = {
      from: '"MEDISERVE" <noreply@mediserve.com>',
      to: email,
      subject: "🔑 Reset Your MEDISERVE Password",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9; border-radius: 10px; }
            .header { background: linear-gradient(135deg, #ff6600 0%, #ff6600 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .header h1 { margin: 0; font-size: 28px; }
            .content { background: white; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #ff6600; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
            .button:hover { background: #e55a00; }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
            .warning { background: #fff3cd; border-left: 4px solid #ff6600; padding: 15px; margin: 20px 0; border-radius: 5px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔑 Password Reset</h1>
            </div>
            <div class="content">
              <p>Hi <strong>${name}</strong>,</p>
              <p>We received a request to reset your MEDISERVE account password. Click the button below to create a new password:</p>
              
              <center>
                <a href="${resetLink}" class="button">🔐 Reset Password</a>
              </center>
              
              <div class="warning">
                <strong>⚠️ Security Notice:</strong> This link expires in 1 hour. If you didn't request a password reset, please ignore this email or contact our support team immediately.
              </div>
              
              <p>Best regards,<br><strong>MEDISERVE Team</strong></p>
            </div>
            <div class="footer">
              <p>&copy; 2025 MEDISERVE. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Password reset email sent:", info.response);
    return { success: true, message: "Password reset email sent successfully" };
  } catch (error) {
    console.error("Error sending password reset email:", error);
    return { success: false, error: error.message };
  }
};

export const sendApprovalEmail = async (email, name, userRole) => {
  try {
    const mailOptions = {
      from: '"MEDISERVE" <noreply@mediserve.com>',
      to: email,
      subject: "✅ Your MEDISERVE Registration Has Been Approved!",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9; border-radius: 10px; }
            .header { background: linear-gradient(135deg, #28a745 0%, #28a745 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .header h1 { margin: 0; font-size: 28px; }
            .content { background: white; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
            .button:hover { background: #218838; }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Registration Approved!</h1>
            </div>
            <div class="content">
              <p>Hi <strong>${name}</strong>,</p>
              <p>Great news! Your registration as a <strong>${userRole}</strong> on MEDISERVE has been approved by our administrator.</p>
              <p>You can now log in and start using all MEDISERVE features:</p>
              
              <center>
                <a href="https://mediserve.local/login" class="button">🚀 Log In Now</a>
              </center>
              
              <p>If you need any assistance, feel free to contact our support team.</p>
              <p>Best regards,<br><strong>MEDISERVE Team</strong></p>
            </div>
            <div class="footer">
              <p>&copy; 2025 MEDISERVE. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Approval email sent:", info.response);
    return { success: true, message: "Approval email sent successfully" };
  } catch (error) {
    console.error("Error sending approval email:", error);
    return { success: false, error: error.message };
  }
};
