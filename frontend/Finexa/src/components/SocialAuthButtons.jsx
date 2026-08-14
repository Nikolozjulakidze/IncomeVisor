import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext.jsx";
import Spinner from "./Spinner.jsx";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 48 48">
    <path
      fill="#FFC107"
      d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
    />
    <path
      fill="#FF3D00"
      d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
    />
    <path
      fill="#4CAF50"
      d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
    />
    <path
      fill="#1976D2"
      d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571.001-.001.002-.001.003-.002l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
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

  const recaptchaRef = useRef(null);
  const googleButtonRef = useRef(null);
  const googleInitializedRef = useRef(false);

  const finishAuth = useCallback(() => {
    toast.success("Signed in with Google!");
    navigate("/dashboard");
  }, [navigate]);

  const handleCredential = useCallback(
    async (credential) => {
      if (!credential) {
        toast.error("Google did not return an ID token");
        return;
      }

      console.log("Google ID token received");

      setSending(true);

      try {
        const data = await sendGoogleOtp(credential);

        setIdToken(credential);
        setMaskedEmail(data.email);
        setOtp("");
        setRecaptchaToken(null);
        setStep("otp");

        toast.success("Verification code sent to your email");
      } catch (err) {
        console.error("Google OTP error:", err);

        toast.error(
          err.response?.data?.message || "Failed to send verification code",
        );
      } finally {
        setSending(false);
      }
    },
    [sendGoogleOtp],
  );

  /*
   * Initialize Google Identity Services.
   *
   * This returns response.credential, which is the ID token.
   */
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) {
      console.error("VITE_GOOGLE_CLIENT_ID is missing");
      return;
    }

    const initializeGoogle = () => {
      if (!window.google?.accounts?.id) {
        return false;
      }

      if (!googleButtonRef.current) {
        return false;
      }

      if (googleInitializedRef.current) {
        return true;
      }

      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,

        callback: (response) => {
          if (!response?.credential) {
            toast.error("Google sign-in failed");
            return;
          }

          handleCredential(response.credential);
        },

        auto_select: false,
        cancel_on_tap_outside: true,
      });

      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: "outline",
        size: "large",
        width: 400,
        text: "signin_with",
        shape: "pill",
      });

      googleInitializedRef.current = true;

      return true;
    };

    if (initializeGoogle()) {
      return;
    }

    /*
     * Google script is loaded asynchronously, so wait for it.
     */
    const interval = setInterval(() => {
      if (initializeGoogle()) {
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [handleCredential]);

  const handleGoogleSignIn = () => {
    if (!GOOGLE_CLIENT_ID) {
      toast.error("Google sign-in is not configured");
      return;
    }

    if (!window.google?.accounts?.id) {
      toast.error("Google sign-in is still loading. Please try again.");
      return;
    }

    if (!googleButtonRef.current) {
      toast.error("Google sign-in is unavailable");
      return;
    }

    /*
     * The actual Google button is rendered inside googleButtonRef.
     *
     * Clicking our custom button triggers the first Google button
     * inside that container.
     */
    const googleButton =
      googleButtonRef.current.querySelector('[role="button"]');

    if (googleButton) {
      googleButton.click();
    } else {
      toast.error("Google sign-in is unavailable");
    }
  };

  /*
   * Render reCAPTCHA after OTP step appears.
   */
  useEffect(() => {
    if (step !== "otp") return;
    if (!recaptchaRef.current) return;
    if (!window.grecaptcha) return;
    if (!RECAPTCHA_SITE_KEY) return;

    if (recaptchaRef.current.hasChildNodes()) return;

    window.grecaptcha.render(recaptchaRef.current, {
      sitekey: RECAPTCHA_SITE_KEY,
      theme: "light",

      callback: (token) => {
        setRecaptchaToken(token);
      },

      "expired-callback": () => {
        setRecaptchaToken(null);
      },

      "error-callback": () => {
        setRecaptchaToken(null);
        toast.error("reCAPTCHA failed");
      },
    });
  }, [step]);

  const handleVerify = async (e) => {
    e.preventDefault();

    if (!idToken) {
      toast.error("Google authentication expired. Please try again.");
      handleReset();
      return;
    }

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

    setVerifying(true);

    try {
      await verifyGoogleOtp({
        idToken,
        otp: otp.trim(),
        recaptchaToken,
      });

      finishAuth();
    } catch (err) {
      console.error("Google OTP verification error:", err);

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

    if (window.google?.accounts?.id) {
      window.google.accounts.id.cancel();
    }
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
        <>
          {/* Hidden Google Identity Services button */}
          <div
            ref={googleButtonRef}
            className="absolute opacity-0 pointer-events-none w-0 h-0 overflow-hidden"
          />

          {/* Your custom button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={sending}
            className="w-full h-[50px] inline-flex items-center justify-center gap-3 bg-surface hover:bg-surface-alt text-text-primary font-medium rounded-full border border-border-color transition-colors shadow-sm text-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <GoogleIcon />

            <span>{sending ? "Signing in..." : "Google"}</span>
          </button>
        </>
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
