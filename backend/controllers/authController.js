import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { Resend } from "resend";
import { OAuth2Client } from "google-auth-library";
import pool from "../db.js";
import { defaultCategories } from "../utils/defaultCategories.js";

const signToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "7d" });

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Mask an email for display, e.g. j***@gmail.com
const maskEmail = (email) => {
  if (!email) return "";
  const [local, domain] = email.split("@");
  const maskedLocal =
    local.length <= 2
      ? local[0] + "*"
      : local[0] + "*".repeat(local.length - 1);
  return `${maskedLocal}@${domain}`;
};

// Verify a reCAPTCHA v2 response token against the Google API.
const verifyRecaptcha = async (token) => {
  if (!process.env.RECAPTCHA_SECRET_KEY) return true; // disabled when not configured
  if (!token) return false;

  try {
    const params = new URLSearchParams({
      secret: process.env.RECAPTCHA_SECRET_KEY,
      response: token,
    });
    const verRes = await fetch(
      "https://www.google.com/recaptcha/api/siteverify",
      {
        method: "POST",
        body: params,
      },
    );
    const data = await verRes.json();
    return data.success === true;
  } catch (error) {
    console.error("reCAPTCHA verification error:", error);
    return false;
  }
};

// Initialize Resend HTTP Client
const getResend = () => {
  if (!process.env.RESEND_API_KEY) return null;
  return new Resend(process.env.RESEND_API_KEY);
};

// Send OTP via Resend HTTP API (bypasses Render SMTP port blocking)
const sendOtpEmail = async (email, otp) => {
  const resend = getResend();
  if (!resend) {
    console.warn(
      "[OTP] RESEND_API_KEY not configured. Returning code without email:",
      email,
    );
    return;
  }

  const sender = process.env.SMTP_FROM || "IncomeVerse <onboarding@resend.dev>";

  await resend.emails.send({
    from: sender,
    to: email,
    subject: "Your IncomeVerse verification code",
    text: `Your IncomeVerse verification code is: ${otp}. It expires in 10 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; background: #f4f4f5; border-radius: 12px;">
        <h2 style="color: #6366f1; margin: 0 0 12px;">IncomeVerse Verification</h2>
        <p style="color: #333; font-size: 15px;">Use the following code to complete your sign in:</p>
        <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #312e81; background: #ffffff; display: inline-block; padding: 12px 20px; border-radius: 10px; border: 1px solid #e4e4e7;">${otp}</div>
        <p style="color: #71717a; font-size: 13px; margin-top: 16px;">This code expires in 10 minutes.</p>
      </div>
    `,
  });
};

// Store a fresh OTP for an email, invalidating any previous ones.
const createOtp = async (email) => {
  const otp = crypto.randomInt(100000, 1000000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  await pool.query("DELETE FROM email_otps WHERE email = $1", [email]);
  await pool.query(
    `INSERT INTO email_otps (email, otp, expires_at)
     VALUES ($1, $2, $3)`,
    [email, otp, expiresAt],
  );

  return otp;
};

// Verify a Google ID token and return its payload.
const verifyGoogleIdToken = async (idToken) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;

  if (!clientId) {
    throw new Error("GOOGLE_CLIENT_ID is missing from backend .env");
  }

  const client = new OAuth2Client(clientId);

  const ticket = await client.verifyIdToken({
    idToken,
    audience: clientId,
  });

  return ticket.getPayload();
};

// Create default categories for a brand-new user inside a transaction.
const insertDefaultCategories = async (client, userId) => {
  for (const cat of defaultCategories) {
    await client.query(
      `INSERT INTO categories (user_id, name, type, icon, color, is_default)
       VALUES ($1, $2, $3, $4, $5, true)`,
      [userId, cat.name, cat.type, cat.icon, cat.color],
    );
  }
};

// Verify an OTP for an email; returns true and marks it used on success.
const verifyOtp = async (email, otp) => {
  const result = await pool.query(
    `SELECT id FROM email_otps
     WHERE email = $1 AND otp = $2 AND used = FALSE AND expires_at > NOW()
     ORDER BY id DESC LIMIT 1`,
    [email, otp],
  );

  if (result.rows.length === 0) return false;

  await pool.query("UPDATE email_otps SET used = TRUE WHERE id = $1", [
    result.rows[0].id,
  ]);
  return true;
};

// Create the user + default categories inside a transaction; returns the user row.
const createUser = async ({ name, email, passwordHash, currency }) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const userResult = await client.query(
      `INSERT INTO users (name, email, password_hash, currency)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, currency, created_at`,
      [name, email, passwordHash, currency],
    );

    const user = userResult.rows[0];

    await insertDefaultCategories(client, user.id);

    await client.query("COMMIT");

    return user;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const register = async (req, res) => {
  const { name, email, password, currency = "USD" } = req.body;

  if (!name || !email || !password) {
    return res
      .status(400)
      .json({ message: "Name, email, and password are required" });
  }

  if (password.length < 6) {
    return res
      .status(400)
      .json({ message: "Password must be at least 6 characters" });
  }

  const client = await pool.connect();

  try {
    const existing = await client.query(
      "SELECT id FROM users WHERE email = $1",
      [email],
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ message: "Email already registered" });
    }

    await client.query("BEGIN");

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const userResult = await client.query(
      `INSERT INTO users (name, email, password_hash, currency)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, currency, created_at`,
      [name, email, passwordHash, currency],
    );

    const user = userResult.rows[0];

    await insertDefaultCategories(client, user.id);

    await client.query("COMMIT");

    const token = signToken(user.id);

    res.status(201).json({
      user,
      token,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Register error:", error);

    res.status(500).json({
      message: "Server error",
    });
  } finally {
    client.release();
  }
};

// Step 1: Validate signup fields, then send an OTP to the email.
export const sendRegistrationOtp = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  try {
    const existing = await pool.query("SELECT id FROM users WHERE email = $1", [
      email,
    ]);

    if (existing.rows.length > 0) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const otp = await createOtp(email);
    await sendOtpEmail(email, otp);

    res.json({
      message: "Verification code sent to your email",
      email: maskEmail(email),
    });
  } catch (error) {
    console.error("Send registration OTP error:", error);
    res
      .status(500)
      .json({ message: error.message || "Failed to send verification code" });
  }
};

// Step 2: Verify the OTP, then create the account and return a token.
export const verifyRegistrationOtp = async (req, res) => {
  const { name, email, password, currency = "USD", otp } = req.body;

  if (!name || !email || !password || !otp) {
    return res
      .status(400)
      .json({ message: "Name, email, password, and code are required" });
  }

  if (password.length < 6) {
    return res
      .status(400)
      .json({ message: "Password must be at least 6 characters" });
  }

  try {
    const existing = await pool.query("SELECT id FROM users WHERE email = $1", [
      email,
    ]);

    if (existing.rows.length > 0) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const otpValid = await verifyOtp(email, otp);
    if (!otpValid) {
      return res.status(400).json({ message: "Invalid or expired code" });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await createUser({
      name,
      email,
      passwordHash,
      currency,
    });

    const token = signToken(user.id);

    res.status(201).json({ user, token });
  } catch (error) {
    console.error("Verify registration OTP error:", error);
    res.status(500).json({ message: "Registration failed" });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    const result = await pool.query(
      "SELECT id, name, email, password_hash, currency FROM users WHERE email = $1",
      [email],
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        message: "Invalid credentials",
      });
    }

    const user = result.rows[0];

    // OAuth-only accounts have no password set.
    if (!user.password_hash) {
      return res.status(400).json({
        message:
          "This account uses social sign-in. Please sign in with Google.",
      });
    }

    const match = await bcrypt.compare(password, user.password_hash);

    if (!match) {
      return res.status(400).json({
        message: "Invalid credentials",
      });
    }

    const token = signToken(user.id);

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        currency: user.currency,
      },
      token,
    });
  } catch (error) {
    console.error("Login error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

export const getMe = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name, email, currency, language, preferences, provider FROM users WHERE id = $1",
      [req.userId],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("GetMe error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// Update the authenticated user's preferred currency.
export const updateCurrency = async (req, res) => {
  const { currency } = req.body;

  if (!currency || typeof currency !== "string") {
    return res.status(400).json({ message: "Currency is required" });
  }

  const normalized = currency.trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(normalized)) {
    return res
      .status(400)
      .json({ message: "Currency must be a 3-letter ISO code" });
  }

  try {
    const result = await pool.query(
      `UPDATE users SET currency = $1 WHERE id = $2
       RETURNING id, name, email, currency`,
      [normalized, req.userId],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Update currency error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Send an OTP to a new email address for email-change verification.
export const sendEmailChangeOtp = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  try {
    const existing = await pool.query(
      "SELECT id FROM users WHERE email = $1 AND id != $2",
      [email, req.userId],
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ message: "Email already in use" });
    }

    const otp = await createOtp(email);
    await sendOtpEmail(email, otp);

    res.json({
      message: "Verification code sent to your email",
      email: maskEmail(email),
    });
  } catch (error) {
    console.error("Send email change OTP error:", error);
    res
      .status(500)
      .json({ message: error.message || "Failed to send verification code" });
  }
};

// Update the user's name and/or email.
// Email change requires a valid OTP that was sent to the new email address.
export const updateProfile = async (req, res) => {
  const { name, email, otp } = req.body;

  if (!name && !email) {
    return res.status(400).json({ message: "Name or email is required" });
  }

  try {
    const current = await pool.query(
      "SELECT id, name, email FROM users WHERE id = $1",
      [req.userId],
    );

    if (current.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = current.rows[0];
    const updates = [];
    const values = [];

    if (name && name.trim() !== user.name) {
      updates.push("name = $1");
      values.push(name.trim());
    }

    if (email && email.trim().toLowerCase() !== user.email.toLowerCase()) {
      const newEmail = email.trim().toLowerCase();

      // Verify OTP for the new email
      if (!otp) {
        return res
          .status(400)
          .json({ message: "Verification code required to change email" });
      }
      const otpValid = await verifyOtp(newEmail, otp);
      if (!otpValid) {
        return res
          .status(400)
          .json({ message: "Invalid or expired verification code" });
      }

      updates.push("email = $2");
      values.push(newEmail);
    }

    if (updates.length === 0) {
      return res.json(user);
    }

    values.push(req.userId);
    const result = await pool.query(
      `UPDATE users SET ${updates.join(", ")} WHERE id = $${values.length}
       RETURNING id, name, email, currency, language, preferences, provider`,
      values,
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Change the account password (email/password accounts only).
export const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res
      .status(400)
      .json({ message: "Current and new password are required" });
  }

  if (newPassword.length < 6) {
    return res
      .status(400)
      .json({ message: "New password must be at least 6 characters" });
  }

  try {
    const result = await pool.query(
      "SELECT id, password_hash FROM users WHERE id = $1",
      [req.userId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = result.rows[0];

    // OAuth-only accounts have no password set.
    if (!user.password_hash) {
      return res.status(400).json({
        message:
          "This account uses social sign-in. Password cannot be changed.",
      });
    }

    const match = await bcrypt.compare(currentPassword, user.password_hash);
    if (!match) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await pool.query("UPDATE users SET password_hash = $1 WHERE id = $2", [
      passwordHash,
      req.userId,
    ]);

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update language and/or notification preferences.
export const updateSettings = async (req, res) => {
  const { language, preferences } = req.body;

  try {
    const current = await pool.query(
      "SELECT language, preferences FROM users WHERE id = $1",
      [req.userId],
    );

    if (current.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = current.rows[0];
    const newLanguage = language || user.language;
    const newPrefs = { ...(user.preferences || {}), ...(preferences || {}) };

    const result = await pool.query(
      `UPDATE users SET language = $1, preferences = $2 WHERE id = $3
       RETURNING id, name, email, currency, language, preferences, provider`,
      [newLanguage, newPrefs, req.userId],
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Update settings error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Export all user data as JSON.
export const exportData = async (req, res) => {
  try {
    const [userRes, catRes, txnRes, budgetRes, acctRes] = await Promise.all([
      pool.query(
        "SELECT id, name, email, currency, language, preferences, provider, created_at FROM users WHERE id = $1",
        [req.userId],
      ),
      pool.query("SELECT * FROM categories WHERE user_id = $1 ORDER BY id", [
        req.userId,
      ]),
      pool.query(
        "SELECT * FROM transactions WHERE user_id = $1 ORDER BY transaction_date DESC, id DESC",
        [req.userId],
      ),
      pool.query("SELECT * FROM budgets WHERE user_id = $1 ORDER BY id", [
        req.userId,
      ]),
      pool.query("SELECT * FROM accounts WHERE user_id = $1 ORDER BY id", [
        req.userId,
      ]),
    ]);

    const data = {
      exportedAt: new Date().toISOString(),
      user: userRes.rows[0] || null,
      categories: catRes.rows,
      transactions: txnRes.rows,
      budgets: budgetRes.rows,
      accounts: acctRes.rows,
    };

    res.json(data);
  } catch (error) {
    console.error("Export data error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Permanently delete the user's account and all associated data (cascade).
export const deleteAccount = async (req, res) => {
  try {
    const result = await pool.query(
      "DELETE FROM users WHERE id = $1 RETURNING id",
      [req.userId],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "Account deleted" });
  } catch (error) {
    console.error("Delete account error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Shared find-or-create logic for OAuth providers.
const handleOAuthUser = async ({ provider, providerId, email, name }) => {
  const client = await pool.connect();

  try {
    // Match existing user by provider_id first, then by email.
    let result = await client.query(
      "SELECT id, name, email, currency FROM users WHERE provider = $1 AND provider_id = $2",
      [provider, providerId],
    );

    if (result.rows.length > 0) {
      return result.rows[0];
    }

    result = await client.query(
      "SELECT id, name, email, currency FROM users WHERE email = $1",
      [email],
    );

    if (result.rows.length > 0) {
      const existing = result.rows[0];
      // Link the provider id to this existing account.
      await client.query(
        "UPDATE users SET provider = $1, provider_id = $2 WHERE id = $3",
        [provider, providerId, existing.id],
      );
      return existing;
    }

    // Create a new user.
    await client.query("BEGIN");

    const userResult = await client.query(
      `INSERT INTO users (name, email, provider, provider_id, currency)
       VALUES ($1, $2, $3, $4, 'USD')
       RETURNING id, name, email, currency`,
      [name, email, provider, providerId],
    );

    const user = userResult.rows[0];

    await insertDefaultCategories(client, user.id);

    await client.query("COMMIT");

    return user;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

// Step 1: Verify the Google ID token, send an OTP to the user's email.
export const sendGoogleOtp = async (req, res) => {
  const idToken = req.body.idToken || req.body.token;

  if (!idToken) {
    return res.status(400).json({ message: "ID token is required" });
  }

  try {
    const payload = await verifyGoogleIdToken(idToken);
    const email = payload.email;

    if (!email) {
      return res.status(400).json({ message: "Google account has no email" });
    }

    const otp = await createOtp(email);
    await sendOtpEmail(email, otp);

    res.json({
      message: "Verification code sent to your email",
      email: maskEmail(email),
    });
  } catch (error) {
    console.error("Send Google OTP error:", error);
    res
      .status(500)
      .json({ message: error.message || "Failed to send verification code" });
  }
};

// Step 2: Verify the reCAPTCHA + OTP, then create/login the user.
export const verifyGoogleOtp = async (req, res) => {
  const { otp, recaptchaToken } = req.body;
  const idToken = req.body.idToken || req.body.token;

  if (!idToken || !otp) {
    return res
      .status(400)
      .json({ message: "ID token and verification code are required" });
  }

  try {
    // 1. Verify reCAPTCHA
    const isHuman = await verifyRecaptcha(recaptchaToken);
    if (!isHuman) {
      return res.status(400).json({ message: "Please complete the reCAPTCHA" });
    }

    // 2. Verify Google ID token
    const payload = await verifyGoogleIdToken(idToken);

    // 3. Verify OTP
    const result = await pool.query(
      `SELECT id FROM email_otps
       WHERE email = $1 AND otp = $2 AND used = FALSE AND expires_at > NOW()
       ORDER BY id DESC LIMIT 1`,
      [payload.email, otp],
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ message: "Invalid or expired code" });
    }

    const otpId = result.rows[0].id;
    await pool.query("UPDATE email_otps SET used = TRUE WHERE id = $1", [
      otpId,
    ]);

    // 4. Find or create the user
    const user = await handleOAuthUser({
      provider: "google",
      providerId: payload.sub,
      email: payload.email,
      name: payload.name || payload.email?.split("@")[0] || "User",
    });

    const token = signToken(user.id);

    res.json({ user, token });
  } catch (error) {
    console.error("Verify Google OTP error:", error);
    res.status(500).json({ message: "Verification failed" });
  }
};

export const googleAuth = async (req, res) => {
  const idToken = req.body.idToken || req.body.token;

  if (!idToken) {
    return res.status(400).json({ message: "ID token is required" });
  }

  try {
    const payload = await verifyGoogleIdToken(idToken);

    const user = await handleOAuthUser({
      provider: "google",
      providerId: payload.sub,
      email: payload.email,
      name: payload.name || payload.email?.split("@")[0] || "User",
    });

    const token = signToken(user.id);

    res.json({ user, token });
  } catch (error) {
    console.error("Google auth error:", error);
    res.status(500).json({ message: "Google sign-in failed" });
  }
};
