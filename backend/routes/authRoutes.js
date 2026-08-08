import express from "express";
import {
  register,
  login,
  getMe,
  updateCurrency,
  googleAuth,
  sendGoogleOtp,
  verifyGoogleOtp,
  sendRegistrationOtp,
  verifyRegistrationOtp,
  updateProfile,
  changePassword,
  updateSettings,
  exportData,
  deleteAccount,
  sendEmailChangeOtp,
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register/send-otp", sendRegistrationOtp);
router.post("/register/verify", verifyRegistrationOtp);
router.post("/register", register);
router.post("/login", login);
router.post("/google/send-otp", sendGoogleOtp);
router.post("/google/verify", verifyGoogleOtp);
router.post("/google", googleAuth);
router.get("/me", protect, getMe);
router.put("/me", protect, updateCurrency);
router.put("/me/profile", protect, updateProfile);
router.put("/me/password", protect, changePassword);
router.put("/me/settings", protect, updateSettings);
router.get("/me/export", protect, exportData);
router.delete("/me", protect, deleteAccount);
router.post("/me/send-email-otp", protect, sendEmailChangeOtp);

export default router;
