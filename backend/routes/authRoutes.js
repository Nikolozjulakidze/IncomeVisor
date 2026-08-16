import express from "express";
import {
  register,
  login,
  getMe,
  updateCurrency,
  googleAuth,
  updateProfile,
  changePassword,
  updateSettings,
  exportData,
  deleteAccount,
  sendEmailChangeOtp,
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
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
