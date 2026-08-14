import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext.jsx";
import Spinner from "./Spinner.jsx";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

// 🔍 DEBUG
console.log("🔥 NEW SOCIAL AUTH COMPONENT LOADED");
console.log("Google Client ID:", GOOGLE_CLIENT_ID);
console.log("Google API:", window.google?.accounts?.id);

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 48 48">
    <path
      fill="#FFC107"
      d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
    />
    <path
      fill="#FF3D00"
      d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 10.337 6.306 14.691z"
    />
    <path
      fill="#4CAF50"
      d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
    />
    <path
      fill="#1976D2"
      d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-6.08 4.166-11.303 5.571.001-.001.002-.002.003-.002l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
    />
  </svg>
);

const SocialAuthButtons = () => {
  const { sendGoogleOtp, verifyGoogleOtp } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState("idle");
  const [idToken, setIdToken] = useState(null);
  const [maskedEmail, setMaskedEmail] = useState(null);
  const [otp, setOtp] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState(null);

  const googleButtonRef = useRef(null);
  const recaptchaRef = useRef(null);
  const googleInitializedRef = useRef(false);

  const finishAuth = useCallback(() => {
    toast.success("Signed in with Google!");
    navigate("/dashboard");
  }, [navigate]);

  // Handle Google's ID token
  const handleCredential = useCallback(
    async (response) => {
      console.log("🔥 Google credential response:", response);

      if (!response?.credential) {
        toast.error("Google did not return an ID token");
        return;
      }

      const token = response.credential;

      console.log("🔥 Google ID token received");
      console.log("Token starts with:", token.substring(0, 20));

      setSending(true);

      try {
        const data = await sendGoogleOtp(token);

        console.log("🔥 Google OTP response:", data);

        setIdToken(token);
        setMaskedEmail(data.email);
        setOtp("");
        setRecaptchaToken(null);
        setStep("otp");

        toast.success("Verification code sent to your email");
      } catch (err) {
        console.error("❌ Send Google OTP error:", err);

        toast.error(
          err.response?.data?.message || "Failed to send verification code",
        );
      } finally {
        setSending(false);
      }
    },
    [sendGoogleOtp],
  );

  // Initialize Google Identity Services
  useEffect(() => {
    console.log("🔵 Google initialization effect running");

    if (!GOOGLE_CLIENT_ID) {
      console.error("❌ VITE_GOOGLE_CLIENT_ID is missing");
      return;
    }

    if (!window.google?.accounts?.id) {
      console.error("❌ Google Identity Services script is not loaded");
      console.log("window.google:", window.google);
      return;
    }

    if (!googleButtonRef.current) {
      console.error("❌ Google button container not found");
      return;
    }

    if (googleInitializedRef.current) {
      return;
    }

    console.log("✅ Google Identity Services is available");

    try {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,

        callback: handleCredential,

        auto_select: false,

        cancel_on_tap_outside: true,
      });

      googleInitializedRef.current = true;

      console.log("✅ Google Identity Services initialized");

      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: "outline",
        size: "large",
        text: "signin_with",
        shape: "pill",
        width: 400,
      });

      console.log("✅ Google button rendered");
    } catch (error) {
      console.error("❌ Google initialization failed:", error);
    }
  }, [handleCredential]);

  // Render reCAPTCHA when OTP screen appears
  useEffect(() => {
    if (step !== "otp") return;

    if (!RECAPTCHA_SITE_KEY) {
      console.warn("⚠️ VITE_RECAPTCHA_SITE_KEY is missing");
      return;
    }

    if (!recaptchaRef.current) {
      console.warn("⚠️ reCAPTCHA container not found");
      return;
    }

    if (!window.grecaptcha) {
      console.warn("⚠️ reCAPTCHA script is not loaded");
      return;
    }

    try {
      recaptchaRef.current.innerHTML = "";

      window.grecaptcha.render(recaptchaRef.current, {
        sitekey: RECAPTCHA_SITE_KEY,
        theme: "light",
        callback: (token) => {
          console.log("✅ reCAPTCHA token received");
          setRecaptchaToken(token);
        },
        "expired-callback": () => {
          console.log("⚠️ reCAPTCHA token expired");
          setRecaptchaToken(null);
        },
      });

      console.log("✅ reCAPTCHA rendered");
    } catch (error) {
      console.error("❌ reCAPTCHA render error:", error);
    }
  }, [step]);

  const handleVerify = async (e) => {
    e.preventDefault();

    if (!otp.trim()) {
      toast.error("Please enter the verification code");
      return;
    }

    if (!recaptchaToken) {
      toast.error(
        "Please complete the reCAPTCHA to confirm you are not a robot",
      );
      return;
    }

    if (!idToken) {
      toast.error("Google authentication token is missing");
      return;
    }

    setVerifying(true);

    try {
      console.log("🔵 Verifying Google OTP...");

      await verifyGoogleOtp({
        idToken,
        otp: otp.trim(),
        recaptchaToken,
      });

      console.log("✅ Google OTP verification successful");

      finishAuth();
    } catch (err) {
      console.error("❌ Google OTP verification error:", err);

      toast.error(err.response?.data?.message || "Verification failed");
    } finally {
      setVerifying(false);
    }
  };

  const handleReset = () => {
    setStep("idle");
    setIdToken(null);
    setMaskedEmail(null);
    setOtp("");
    setRecaptchaToken(null);

    // Reset Google button container
    if (googleButtonRef.current) {
      googleButtonRef.current.innerHTML = "";
    }

    googleInitializedRef.current = false;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4 my-6">
        <div className="flex-1 h-px bg-border-color" />

        <span className="text-xs uppercase tracking-wider text-text-tertiary font-medium">
          or continue with
        </span>

        <div className="flex-1 h-px bg-border-color" />
      </div>

      {step === "idle" && (
        <div className="w-full flex justify-center">
          <div ref={googleButtonRef} />
        </div>
      )}

      {step === "otp" && (
        <form onSubmit={handleVerify} className="space-y-4">
          <div className="rounded-2xl border border-border-color bg-surface/60 p-4 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <GoogleIcon />

                <div>
                  <p className="text-sm font-semibold text-text-primary">
                    Verify your email
                  </p>

                  <p className="text-xs text-text-secondary">
                    We sent a code to {maskedEmail}
                    {!RECAPTCHA_SITE_KEY && (
                      <span className="ml-1 text-amber-500">
                        (reCAPTCHA not configured)
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleReset}
                className="text-xs text-text-tertiary hover:text-text-primary transition"
              >
                Change
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-text-primary">
                Verification code
              </label>

              <input
                inputMode="numeric"
                maxLength={6}
                pattern="[0-9]*"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                className="input-field w-full rounded-2xl px-5 py-4 text-center text-lg tracking-[0.5em] placeholder-text-tertiary focus-ring-accent"
                placeholder="______"
                autoFocus
              />
            </div>

            <div className="flex justify-center">
              {RECAPTCHA_SITE_KEY ? (
                <div ref={recaptchaRef} />
              ) : (
                <button
                  type="button"
                  onClick={() => toast.error("reCAPTCHA is not configured yet")}
                  className="border border-border-color bg-surface rounded-lg px-4 py-2 text-xs text-text-secondary"
                >
                  reCAPTCHA unavailable
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={verifying}
              className="w-full inline-flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover text-white font-semibold py-3.5 rounded-2xl transition shadow-lg shadow-violet-500/30 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {verifying ? (
                <>
                  <Spinner size="sm" />
                  Verifying...
                </>
              ) : (
                "Verify & Sign In"
              )}
            </button>
          </div>
        </form>
      )}

      {sending && (
        <div className="flex items-center justify-center gap-2 text-sm text-text-secondary">
          <Spinner size="sm" />
          Sending verification code...
        </div>
      )}
    </div>
  );
};

export default SocialAuthButtons;
