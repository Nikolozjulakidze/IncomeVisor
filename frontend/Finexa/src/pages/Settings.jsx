import { useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import {
  Settings as SettingsIcon,
  Loader2,
  Check,
  User,
  Bell,
  Globe,
  Shield,
  Download,
  Trash2,
  Mail,
  KeyRound,
  Eye,
  EyeOff,
  PiggyBank,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";
import { getCurrencySymbol } from "../utils/format.js";
import { SUPPORTED_LANGUAGES } from "../utils/i18n.js";
import Button from "../components/ui/Button.jsx";
import Modal from "../components/ui/Modal.jsx";

const CURRENCIES = [
  { value: "USD", label: "USD - US Dollar" },
  { value: "EUR", label: "EUR - Euro" },
  { value: "GEL", label: "GEL - Georgian Lari" },
  { value: "GBP", label: "GBP - British Pound" },
  { value: "INR", label: "INR - Indian Rupee" },
  { value: "JPY", label: "JPY - Japanese Yen" },
  { value: "CAD", label: "CAD - Canadian Dollar" },
  { value: "AUD", label: "AUD - Australian Dollar" },
];

const TABS = [
  { id: "profile", icon: User },
  { id: "notifications", icon: Bell },
  { id: "language", icon: Globe },
  { id: "currency", icon: PiggyBank },
  { id: "data", icon: Shield },
];

const SectionTitle = ({ icon: Icon, title, desc }) => (
  <div className="flex items-center gap-2 mb-1">
    <Icon size={18} className="text-slate-400" />
    <h2 className="font-semibold text-slate-900">{title}</h2>
  </div>
);

const Settings = () => {
  const {
    user,
    updateCurrency,
    updateProfile,
    changePassword,
    updateSettings,
    sendEmailChangeOtp,
    exportData,
    deleteAccount,
  } = useAuth();
  const { t, lang, setLanguage } = useLanguage();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("profile");

  // Currency
  const [currency, setCurrency] = useState(user?.currency || "USD");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Profile
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [profileSaving, setProfileSaving] = useState(false);

  // Email change OTP
  const [emailOtp, setEmailOtp] = useState("");
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailOtpSending, setEmailOtpSending] = useState(false);
  const [maskedEmail, setMaskedEmail] = useState("");

  // Password
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Notifications
  const [prefs, setPrefs] = useState({
    emailAlerts: user?.preferences?.emailAlerts ?? true,
    budgetAlerts: user?.preferences?.budgetAlerts ?? true,
    weeklySummary: user?.preferences?.weeklySummary ?? false,
    aiInsights: user?.preferences?.aiInsights ?? true,
  });
  const [prefsSaving, setPrefsSaving] = useState(false);

  // Language
  const [pendingLang, setPendingLang] = useState(lang || "en");

  // Data & Privacy
  const [exporting, setExporting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isOAuth = Boolean(user?.provider);

  const handleCurrencySave = async () => {
    if (!currency || currency === user?.currency) {
      toast.success(t("settings.currency.uptodate"));
      return;
    }
    setSaving(true);
    setSaved(false);
    try {
      await updateCurrency(currency);
      setSaved(true);
      toast.success(t("settings.currency.updated"));
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      toast.error(
        err.response?.data?.message || t("settings.currency.updated"),
      );
      setCurrency(user?.currency || "USD");
    } finally {
      setSaving(false);
    }
  };

  // Auto-save the name when the input loses focus.
  const handleNameBlur = async () => {
    if (!name.trim() || name.trim() === user?.name) return;
    try {
      await updateProfile({ name: name.trim() });
      toast.success(t("settings.profile.saved"));
    } catch (err) {
      toast.error(err.response?.data?.message || t("settings.profile.saved"));
      setName(user?.name || "");
    }
  };

  // Auto-send an OTP to the new email when the user edits it.
  const handleEmailChange = async (value) => {
    setEmail(value);
    setEmailOtp("");
    if (!value || !/^\S+@\S+\.\S+$/.test(value)) {
      setEmailOtpSent(false);
      return;
    }
    if (value.trim().toLowerCase() === (user?.email || "").toLowerCase()) {
      setEmailOtpSent(false);
      return;
    }
    setEmailOtpSending(true);
    try {
      const res = await sendEmailChangeOtp(value.trim());
      setMaskedEmail(res.email || value);
      setEmailOtpSent(true);
      toast.success(t("settings.profile.sendCode"));
    } catch (err) {
      setEmailOtpSent(false);
      toast.error(
        err.response?.data?.message || t("settings.profile.sendCode"),
      );
    } finally {
      setEmailOtpSending(false);
    }
  };

  // Apply the new email using the received OTP.
  const handleEmailApply = async () => {
    if (!email.trim()) {
      toast.error(t("settings.profile.email"));
      return;
    }
    if (!emailOtpSent) {
      toast.error(t("settings.profile.verifyHint"));
      return;
    }
    setProfileSaving(true);
    try {
      await updateProfile({
        email: email.trim(),
        otp: emailOtp,
      });
      toast.success(t("settings.profile.saved"));
      setEmailOtpSent(false);
      setEmailOtp("");
    } catch (err) {
      toast.error(err.response?.data?.message || t("settings.profile.saved"));
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (newPw.length < 6) {
      toast.error(t("settings.password.short"));
      return;
    }
    if (newPw !== confirmPw) {
      toast.error(t("settings.password.mismatch"));
      return;
    }
    setPwSaving(true);
    try {
      await changePassword({ currentPassword: currentPw, newPassword: newPw });
      toast.success(t("settings.password.changed"));
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
    } catch (err) {
      toast.error(
        err.response?.data?.message || t("settings.password.changed"),
      );
    } finally {
      setPwSaving(false);
    }
  };

  const handlePrefsSave = async () => {
    setPrefsSaving(true);
    try {
      await updateSettings({ preferences: prefs });
      toast.success(t("settings.notifications.saved"));
    } catch (err) {
      toast.error(
        err.response?.data?.message || t("settings.notifications.saved"),
      );
    } finally {
      setPrefsSaving(false);
    }
  };

  const handleLanguageSave = async () => {
    try {
      await setLanguage(pendingLang);
      toast.success(t("settings.language.saved"));
    } catch {
      toast.error(t("settings.language.saved"));
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const data = await exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `incomevisor-export-${new Date()
        .toISOString()
        .slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(t("settings.data.exported"));
    } catch (err) {
      toast.error(err.response?.data?.message || t("settings.data.exported"));
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteAccount();
      toast.success(t("settings.data.deleted"));
      navigate("/");
    } catch (err) {
      toast.error(err.response?.data?.message || t("settings.data.deleted"));
      setDeleting(false);
      setDeleteOpen(false);
    }
  };

  const tabs = TABS.map(({ id, icon }) => ({
    id,
    label: t(`settings.${id}`),
    icon,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
          {t("settings.title")}
        </h1>
        <p className="text-sm text-slate-500 mt-1.5">
          {t("settings.subtitle")}
        </p>
      </div>

      {/* Account info */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-accent flex items-center justify-center text-white font-semibold text-lg shrink-0">
              {user?.name?.[0]?.toUpperCase() || "U"}
            </div>
            <div>
              <div className="font-semibold text-slate-900">
                {user?.name || "User"}
              </div>
              <div className="text-sm text-slate-500">{user?.email}</div>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Tabs */}
          <div className="flex flex-wrap gap-2 mb-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition ${
                    activeTab === tab.id
                      ? "bg-accent text-white shadow-md shadow-violet-500/30"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  <Icon size={15} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* ===== PROFILE ===== */}
          {activeTab === "profile" && (
            <div className="max-w-xl space-y-5">
              <div>
                <SectionTitle
                  icon={User}
                  title={t("settings.profile")}
                  desc=""
                />
                <p className="text-sm text-slate-500 mb-4">
                  {t("settings.profile.desc")}
                </p>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-slate-700">
                      {t("settings.profile.name")}
                    </label>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      onBlur={handleNameBlur}
                      className="input-field w-full rounded-2xl px-5 py-3.5 text-sm focus-ring-accent"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-slate-700">
                      {t("settings.profile.email")}
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => handleEmailChange(e.target.value)}
                      className="input-field w-full rounded-2xl px-5 py-3.5 text-sm focus-ring-accent"
                    />
                    {emailOtpSending && (
                      <p className="text-xs text-slate-500 flex items-center gap-1.5">
                        <Loader2 size={13} className="animate-spin" />
                        {t("settings.profile.sendCode")}...
                      </p>
                    )}
                    {emailOtpSent && (
                      <div className="mt-3 space-y-1.5">
                        <label className="block text-sm font-medium text-slate-700">
                          {t("settings.profile.otpPlaceholder")}
                        </label>
                        <div className="flex gap-2">
                          <input
                            value={emailOtp}
                            onChange={(e) =>
                              setEmailOtp(e.target.value.replace(/\D/g, ""))
                            }
                            maxLength={6}
                            placeholder="••••••"
                            className="input-field w-full rounded-2xl px-5 py-3.5 text-center text-xl font-bold tracking-[0.4em] focus-ring-accent"
                          />
                          <Button
                            type="button"
                            onClick={handleEmailApply}
                            disabled={profileSaving || emailOtp.length < 6}
                            className="shrink-0"
                          >
                            {profileSaving ? (
                              <Loader2 size={15} className="animate-spin" />
                            ) : (
                              <>
                                <Check size={15} />
                                {t("settings.profile.apply")}
                              </>
                            )}
                          </Button>
                        </div>
                        <p className="text-xs text-slate-500">
                          {t("settings.profile.verifyHint")} ({maskedEmail})
                        </p>
                      </div>
                    )}
                  </div>

                  {isOAuth && (
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Mail size={15} />
                      {t("settings.profile.signinMethod")}: Google
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ===== PASSWORD (within profile) ===== */}
          {activeTab === "profile" && !isOAuth && (
            <div className="border-t border-slate-100 pt-5 max-w-xl">
              <SectionTitle
                icon={KeyRound}
                title={t("settings.password")}
                desc=""
              />
              <p className="text-sm text-slate-500 mb-4">
                {t("settings.password.desc")}
              </p>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-slate-700">
                    {t("settings.password.current")}
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrent ? "text" : "password"}
                      value={currentPw}
                      onChange={(e) => setCurrentPw(e.target.value)}
                      className="input-field w-full rounded-2xl px-5 py-3.5 pr-12 text-sm focus-ring-accent"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrent((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                      aria-label={
                        showCurrent ? "Hide password" : "Show password"
                      }
                    >
                      {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-slate-700">
                    {t("settings.password.new")}
                  </label>
                  <div className="relative">
                    <input
                      type={showNew ? "text" : "password"}
                      value={newPw}
                      onChange={(e) => setNewPw(e.target.value)}
                      className="input-field w-full rounded-2xl px-5 py-3.5 pr-12 text-sm focus-ring-accent"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                      aria-label={showNew ? "Hide password" : "Show password"}
                    >
                      {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-slate-700">
                    {t("settings.password.confirm")}
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirm ? "text" : "password"}
                      value={confirmPw}
                      onChange={(e) => setConfirmPw(e.target.value)}
                      className="input-field w-full rounded-2xl px-5 py-3.5 pr-12 text-sm focus-ring-accent"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                      aria-label={
                        showConfirm ? "Hide password" : "Show password"
                      }
                    >
                      {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <Button onClick={handlePasswordChange} disabled={pwSaving}>
                  {pwSaving ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      {t("settings.saving")}
                    </>
                  ) : (
                    <>
                      <KeyRound size={16} />
                      {t("settings.password.change")}
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* ===== NOTIFICATIONS ===== */}
          {activeTab === "notifications" && (
            <div className="max-w-xl">
              <SectionTitle
                icon={Bell}
                title={t("settings.notifications")}
                desc=""
              />
              <p className="text-sm text-slate-500 mb-4">
                {t("settings.notifications.desc")}
              </p>
              <div className="space-y-3">
                {[
                  {
                    key: "emailAlerts",
                    label: "settings.notifications.emailAlerts",
                  },
                  {
                    key: "budgetAlerts",
                    label: "settings.notifications.budgetAlerts",
                  },
                  {
                    key: "weeklySummary",
                    label: "settings.notifications.weeklySummary",
                  },
                  {
                    key: "aiInsights",
                    label: "settings.notifications.aiInsights",
                  },
                ].map((item) => (
                  <label
                    key={item.key}
                    className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-slate-50/50 cursor-pointer"
                  >
                    <span className="text-sm font-medium text-slate-700">
                      {t(item.label)}
                    </span>
                    <input
                      type="checkbox"
                      checked={prefs[item.key]}
                      onChange={(e) =>
                        setPrefs({ ...prefs, [item.key]: e.target.checked })
                      }
                      className="h-5 w-5 accent-violet-600"
                    />
                  </label>
                ))}
              </div>
              <Button
                onClick={handlePrefsSave}
                disabled={prefsSaving}
                className="mt-5"
              >
                {prefsSaving ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    {t("settings.saving")}
                  </>
                ) : (
                  t("settings.notifications.save")
                )}
              </Button>
            </div>
          )}

          {/* ===== LANGUAGE ===== */}
          {activeTab === "language" && (
            <div className="max-w-xl">
              <SectionTitle
                icon={Globe}
                title={t("settings.language")}
                desc=""
              />
              <p className="text-sm text-slate-500 mb-4">
                {t("settings.language.desc")}
              </p>
              <div className="space-y-3">
                {SUPPORTED_LANGUAGES.map((langOpt) => (
                  <label
                    key={langOpt.value}
                    className={`flex items-center gap-3 p-4 rounded-2xl border cursor-pointer transition ${
                      pendingLang === langOpt.value
                        ? "border-violet-500 bg-black-50"
                        : "border-slate-100 bg-slate-50/50 hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="language"
                      checked={pendingLang === langOpt.value}
                      onChange={() => setPendingLang(langOpt.value)}
                      className="accent-violet-600"
                    />
                    <span className="text-xl">{langOpt.flag}</span>
                    <span className="font-medium text-slate-700">
                      {langOpt.label}
                    </span>
                  </label>
                ))}
              </div>
              <Button onClick={handleLanguageSave} className="mt-5">
                {t("settings.save")}
              </Button>
            </div>
          )}

          {/* ===== CURRENCY ===== */}
          {activeTab === "currency" && (
            <div className="max-w-xl">
              <SectionTitle
                icon={PiggyBank}
                title={t("settings.currency")}
                desc=""
              />
              <p className="text-sm text-slate-500 mb-4">
                {t("settings.currency.desc")}
              </p>

              {/* Current currency display */}
              <div className="mb-5 p-4 rounded-2xl border border-black-100 bg-slate-50/50">
                <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                  {t("settings.currency.current")}
                </div>
                <div className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                  <span>{getCurrencySymbol(currency)}</span>
                  <span>{currency}</span>
                </div>
              </div>

              <div className="space-y-3">
                {CURRENCIES.map((c) => (
                  <label
                    key={c.value}
                    className={`flex items-center gap-3 p-4 rounded-2xl border cursor-pointer transition ${
                      currency === c.value
                        ? "border-violet-500 bg-black-50"
                        : "border-black-100 bg-slate-50/50 hover:bg-black-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="currency"
                      checked={currency === c.value}
                      onChange={() => setCurrency(c.value)}
                      className="accent-violet-600"
                    />
                    <span className="text-xl">
                      {getCurrencySymbol(c.value)}
                    </span>
                    <span className="font-medium text-slate-700">
                      {c.label}
                    </span>
                  </label>
                ))}
              </div>
              <Button
                onClick={handleCurrencySave}
                disabled={saving}
                className="mt-5"
              >
                {saving ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    {t("settings.saving")}
                  </>
                ) : saved ? (
                  <>
                    <Check size={16} />
                    {t("settings.saved")}
                  </>
                ) : (
                  t("settings.currency.save")
                )}
              </Button>
            </div>
          )}

          {/* ===== DATA & PRIVACY ===== */}
          {activeTab === "data" && (
            <div className="max-w-xl">
              <SectionTitle icon={Shield} title={t("settings.data")} desc="" />
              <p className="text-sm text-slate-500 mb-5">
                {t("settings.data.desc")}
              </p>

              <div className="p-5 rounded-2xl border border-slate-100 bg-slate-50/50 mb-4">
                <div className="flex items-center gap-2 mb-1">
                  <Download size={16} className="text-slate-400" />
                  <span className="font-semibold text-slate-900">
                    {t("settings.data.export")}
                  </span>
                </div>
                <p className="text-sm text-slate-500 mb-3">
                  {t("settings.data.exportDesc")}
                </p>
                <Button onClick={handleExport} disabled={exporting}>
                  {exporting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      {t("settings.data.exporting")}
                    </>
                  ) : (
                    <>
                      <Download size={16} />
                      {t("settings.data.export")}
                    </>
                  )}
                </Button>
              </div>

              <div className="p-5 rounded-2xl border border-rose-200 bg-rose-50/50">
                <div className="flex items-center gap-2 mb-1">
                  <Trash2 size={16} className="text-rose-500" />
                  <span className="font-semibold text-rose-600">
                    {t("settings.data.delete")}
                  </span>
                </div>
                <p className="text-sm text-red-600 mb-3">
                  {t("settings.data.deleteDesc")}
                </p>
                <Button variant="danger" onClick={() => setDeleteOpen(true)}>
                  <Trash2 size={16} />
                  {t("settings.data.delete")}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete confirmation modal */}
      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title={t("settings.data.deleteConfirmTitle")}
      >
        <div className="space-y-5">
          <p className="text-sm text-slate-600">
            {t("settings.data.deleteConfirmBody")}
          </p>
          <div className="flex items-center gap-3 justify-end">
            <Button
              variant="ghost"
              onClick={() => setDeleteOpen(false)}
              disabled={deleting}
            >
              {t("settings.data.cancel")}
            </Button>
            <Button variant="danger" onClick={handleDelete} disabled={deleting}>
              {deleting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  {t("settings.data.deleting")}
                </>
              ) : (
                <>
                  <Trash2 size={16} />
                  {t("settings.data.deleteConfirmBtn")}
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Settings;
