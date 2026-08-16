import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext.jsx";
import Spinner from "./Spinner.jsx";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

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
  const { googleLogin } = useAuth();
  const navigate = useNavigate();

  const [signingIn, setSigningIn] = useState(false);
  const googleButtonRef = useRef(null);
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

      setSigningIn(true);

      try {
        await googleLogin(token);
        finishAuth();
      } catch (err) {
        console.error("❌ Google Sign-In error:", err);

        toast.error(err.response?.data?.message || "Failed to sign in with Google");
      } finally {
        setSigningIn(false);
      }
    },
    [googleLogin, finishAuth],
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

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4 my-6">
        <div className="flex-1 h-px bg-border-color" />

        <span className="text-xs uppercase tracking-wider text-text-tertiary font-medium">
          or continue with
        </span>

        <div className="flex-1 h-px bg-border-color" />
      </div>

      <div className="w-full flex justify-center">
        {signingIn ? (
          <div className="flex items-center justify-center gap-2 text-sm text-text-secondary">
            <Spinner size="sm" />
            Signing in...
          </div>
        ) : (
          <div ref={googleButtonRef} />
        )}
      </div>
    </div>
  );
};

export default SocialAuthButtons;
