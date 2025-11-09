"use client";

import { auth } from "@/lib/firebaseClient";
import { signInWithEmailAndPassword } from "firebase/auth";

/**
 * ✅ Sends a professionally styled login alert email
 */
async function sendLoginEmail(email) {
  try {
    const loginTime = new Date().toLocaleString();

    const res = await fetch("/api/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: email,
        subject: "🔐 Login Alert - FirstCBU Bank",
        html: `
          <div style="background-color:#f6f8fb;padding:40px 0;font-family:Arial,Helvetica,sans-serif;">
            <div style="max-width:600px;margin:auto;background:#ffffff;border-radius:10px;overflow:hidden;
              box-shadow:0 4px 8px rgba(0,0,0,0.05);">
              
              <div style="background:#0b8f60;color:#fff;text-align:center;padding:25px 0;">
                <h1 style="margin:0;font-size:22px;">Login Alert - FirstCBU Bank</h1>
              </div>

              <div style="padding:30px;">
                <p style="font-size:16px;color:#333;">Hello,</p>

                <p style="font-size:15px;color:#555;line-height:1.6;">
                  We detected a login to your <b>FirstCBU Bank</b> account using this email:
                  <br><b>${email}</b>
                </p>

                <table style="width:100%;margin-top:15px;border-collapse:collapse;">
                  <tr>
                    <td style="padding:8px 0;color:#555;"><b>Login Time:</b></td>
                    <td style="padding:8px 0;">${loginTime}</td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;color:#555;"><b>IP Address:</b></td>
                    <td style="padding:8px 0;">Auto-detected</td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;color:#555;"><b>Device:</b></td>
                    <td style="padding:8px 0;">Web Browser</td>
                  </tr>
                </table>

                <p style="margin-top:25px;font-size:15px;color:#555;line-height:1.6;">
                  If this login was <b>not you</b>, please reset your password immediately to secure your account.
                </p>

                <a href="https://firscbu.app/reset-password"
                  style="display:inline-block;margin-top:20px;background:#e53e3e;color:#fff;padding:12px 30px;
                  border-radius:6px;text-decoration:none;font-weight:bold;">
                  Secure My Account
                </a>

                <p style="margin-top:30px;color:#999;font-size:13px;">
                  This message was sent automatically by Honstinger Bank for your security.
                </p>
              </div>

              <div style="background:#f1f1f1;text-align:center;padding:15px;color:#666;font-size:13px;">
                © ${new Date().getFullYear()} FirstCBU Bank. All rights reserved.
              </div>
            </div>
          </div>
        `,
      }),
    });

    if (!res.ok) {
      console.error("❌ Login alert email failed to send");
    } else {
      console.log("✅ Login alert email sent successfully");
    }
  } catch (error) {
    console.error("❌ Email send error:", error);
  }
}

/**
 * ✅ Logs the user in via Firebase Authentication
 */
export async function loginUser({ email, password }) {
  try {
    // 1️⃣ Sign in user using Firebase Auth
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    console.log("✅ User logged in successfully:", user.email);

    // 2️⃣ Send login alert email
    await sendLoginEmail(email);

    return { success: true, message: "Login successful", user };
  } catch (error) {
    console.error("❌ Login error:", error.code, error.message);

    // 3️⃣ Handle all common Firebase login errors
    let errorMessage = "Unexpected error. Please try again later.";

    switch (error.code) {
      case "auth/user-not-found":
        errorMessage = "User not found. Please sign up first.";
        break;
      case "auth/wrong-password":
        errorMessage = "Incorrect password. Please try again.";
        break;
      case "auth/invalid-email":
        errorMessage = "Invalid email address.";
        break;
      case "auth/invalid-credential":
        errorMessage =
          "Invalid credentials or unauthorized domain. Make sure your domain is added in Firebase Auth settings.";
        break;
      case "auth/network-request-failed":
        errorMessage = "Network error. Please check your internet connection.";
        break;
      case "auth/too-many-requests":
        errorMessage = "Too many failed login attempts. Try again later.";
        break;
      default:
        errorMessage = error.message || "An unexpected error occurred.";
    }

    return { success: false, message: errorMessage };
  }
}
