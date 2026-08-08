import { createContext, useContext, useEffect, useState } from "react";
import api from "../lib/axios.js";
import { API_PATHS } from "../utils/apiPaths.js";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get(API_PATHS.AUTH.ME)
      .then((res) => setUser(res.data))
      .catch(() => localStorage.removeItem("token"))
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const res = await api.post(API_PATHS.AUTH.LOGIN, { email, password });
    localStorage.setItem("token", res.data.token);
    setUser(res.data.user);
  };

  const register = async (payload) => {
    const res = await api.post(API_PATHS.AUTH.REGISTER, payload);
    localStorage.setItem("token", res.data.token);
    setUser(res.data.user);
  };

  const sendRegisterOtp = async ({ email }) => {
    const res = await api.post(API_PATHS.AUTH.REGISTER_SEND_OTP, { email });
    return res.data;
  };

  const verifyRegisterOtp = async ({
    name,
    email,
    password,
    currency,
    otp,
  }) => {
    const res = await api.post(API_PATHS.AUTH.REGISTER_VERIFY_OTP, {
      name,
      email,
      password,
      currency,
      otp,
    });
    localStorage.setItem("token", res.data.token);
    setUser(res.data.user);
    return res.data;
  };

  const googleLogin = async (idToken) => {
    const res = await api.post(API_PATHS.AUTH.GOOGLE, { idToken });
    localStorage.setItem("token", res.data.token);
    setUser(res.data.user);
  };

  const sendGoogleOtp = async (idToken) => {
    const res = await api.post(API_PATHS.AUTH.GOOGLE_SEND_OTP, { idToken });
    return res.data;
  };

  const verifyGoogleOtp = async ({ idToken, otp, recaptchaToken }) => {
    const res = await api.post(API_PATHS.AUTH.GOOGLE_VERIFY_OTP, {
      idToken,
      otp,
      recaptchaToken,
    });
    localStorage.setItem("token", res.data.token);
    setUser(res.data.user);
    return res.data;
  };

  const updateCurrency = async (currency) => {
    const res = await api.put(API_PATHS.AUTH.UPDATE_ME, { currency });
    setUser((prev) => ({ ...prev, currency: res.data.currency }));
    return res.data;
  };

  const updateProfile = async ({ name, email, otp }) => {
    const res = await api.put(API_PATHS.AUTH.UPDATE_PROFILE, {
      name,
      email,
      otp,
    });
    setUser((prev) => ({ ...prev, ...res.data }));
    return res.data;
  };

  const changePassword = async ({ currentPassword, newPassword }) => {
    const res = await api.put(API_PATHS.AUTH.CHANGE_PASSWORD, {
      currentPassword,
      newPassword,
    });
    return res.data;
  };

  const updateSettings = async ({ language, preferences }) => {
    const res = await api.put(API_PATHS.AUTH.UPDATE_SETTINGS, {
      language,
      preferences,
    });
    setUser((prev) => ({ ...prev, ...res.data }));
    return res.data;
  };

  const sendEmailChangeOtp = async (email) => {
    const res = await api.post(API_PATHS.AUTH.SEND_EMAIL_OTP, { email });
    return res.data;
  };

  const exportData = async () => {
    const res = await api.get(API_PATHS.AUTH.EXPORT);
    return res.data;
  };

  const deleteAccount = async () => {
    await api.delete(API_PATHS.AUTH.DELETE_ACCOUNT);
    localStorage.removeItem("token");
    setUser(null);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        sendRegisterOtp,
        verifyRegisterOtp,
        googleLogin,
        sendGoogleOtp,
        verifyGoogleOtp,
        updateCurrency,
        updateProfile,
        changePassword,
        updateSettings,
        sendEmailChangeOtp,
        exportData,
        deleteAccount,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
