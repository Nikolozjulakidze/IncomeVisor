import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Eye, EyeOff, ChevronDown } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";
import AuthHero from "../components/AuthHero.jsx";
import Spinner from "../components/Spinner.jsx";
import FinexaLogo from "../components/FinexaLogo.jsx";
import SocialAuthButtons from "../components/SocialAuthButtons.jsx";

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

const Register = () => {
  const { register } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    currency: "USD",
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) {
      toast.error(t("auth.pwShort"));
      return;
    }
    setLoading(true);
    try {
      await register({
        name: form.name,
        email: form.email,
        password: form.password,
        currency: form.currency,
      });
      toast.success(t("auth.accountCreated"));
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.message || t("auth.registerFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-background text-text-primary">
      <div className="flex-1 flex flex-col px-6 sm:px-10 lg:px-14 py-8 order-1">
        <div className="flex justify-start items-center">
          <FinexaLogo variant="horizontal" size={64} titleSize={24} />
        </div>

        <div className="flex-1 flex items-center justify-center py-10">
          <div className="w-full max-w-md">
            <h2 className="text-4xl font-bold text-text-primary tracking-tight mb-2">
              {t("auth.signUp")}
            </h2>
            <p className="text-text-secondary mb-10">
              {t("auth.signupSubtitle")}
            </p>

            <form onSubmit={onSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-text-primary">
                  {t("auth.name")}
                </label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="input-field w-full rounded-2xl px-5 py-4 text-sm placeholder-text-tertiary focus-ring-accent"
                  placeholder="Alex"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-text-primary">
                  {t("auth.email")}
                </label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="input-field w-full rounded-2xl px-5 py-4 text-sm placeholder-text-tertiary focus-ring-accent"
                  placeholder="you@example.com"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-text-primary">
                  {t("auth.password")}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    value={form.password}
                    onChange={(e) =>
                      setForm({ ...form, password: e.target.value })
                    }
                    className="input-field w-full rounded-2xl px-5 py-4 pr-12 text-sm placeholder-text-tertiary focus-ring-accent"
                    placeholder={t("settings.password.short")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary transition"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-text-primary">
                  {t("auth.currency")}
                </label>
                <div className="relative">
                  <select
                    value={form.currency}
                    onChange={(e) =>
                      setForm({ ...form, currency: e.target.value })
                    }
                    className="input-field w-full appearance-none rounded-2xl px-5 py-4 pr-12 text-sm placeholder-text-tertiary focus-ring-accent cursor-pointer"
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={18}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover text-white font-semibold py-4 rounded-2xl transition shadow-lg shadow-violet-500/30 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Spinner size="sm" />
                    {t("auth.creatingAccount")}
                  </>
                ) : (
                  t("auth.createAccount")
                )}
              </button>
            </form>

            <SocialAuthButtons />

            <p className="text-center mt-8 text-sm text-text-secondary">
              {t("auth.alreadyHaveAccount")}{" "}
              <Link
                to="/login"
                className="font-semibold text-accent hover:text-accent-hover transition"
              >
                {t("auth.signIn2")}
              </Link>
            </p>
          </div>
        </div>

        <div className="flex justify-start gap-6 text-xs text-text-secondary">
          <a className="hover:text-text-primary transition cursor-pointer">
            {t("auth.privacyPolicy")}
          </a>
          <a className="hover:text-text-primary transition cursor-pointer">
            {t("auth.terms")}
          </a>
          <a className="hover:text-text-primary transition cursor-pointer">
            {t("auth.faq")}
          </a>
        </div>
      </div>

      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] order-2">
        <AuthHero headline="Begin" subheadline="your financial journey" />
      </div>
    </div>
  );
};

export default Register;
