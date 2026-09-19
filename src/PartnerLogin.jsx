import React, { useState } from "react";
import { supabase } from "./supabaseClient";

export default function PartnerLogin() {
  const [mode, setMode] = useState("signin"); // 'signin' | 'signup'
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [signupNotice, setSignupNotice] = useState("");

  async function handleSignIn(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data, error: loginError } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (loginError) {
        throw loginError;
      }

      if (!data?.user) {
        throw new Error("Login failed. No user session was returned.");
      }

      window.location.href = "/partner-portal";
    } catch (loginError) {
      console.error("Partner login error:", loginError);
      setError(
        loginError.message || "Unable to sign in. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleSignUp(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSignupNotice("");

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });

      if (signUpError) {
        throw signUpError;
      }

      if (data?.session) {
        // Email confirmation is disabled on this project — go straight in.
        window.location.href = "/partner-portal";
        return;
      }

      setSignupNotice(
        "Account created. Check your email to confirm it, then sign in. " +
          "Once you're in, LMCT will need to link your account to your " +
          "partner profile before you'll see any data — the portal will " +
          "show you the ID to share with us."
      );
      setMode("signin");
    } catch (signUpError) {
      console.error("Partner signup error:", signUpError);
      setError(
        signUpError.message || "Unable to create an account. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="loginPage">
      <section className="loginShowcase">
        <div className="loginBrand">
          <span className="brandMark">LMCT</span>
          <span className="brandLine">
            LUXURY MOTOR CAR TRADER
          </span>
        </div>

        <div className="loginShowcaseContent">
          <span className="loginEyebrow">PARTNER ACCESS</span>

          <h1>
            Your vehicles.
            <br />
            Your performance.
          </h1>

          <p>
            Track clicks, leads, conversions and commissions on
            your listings — all in one place.
          </p>
        </div>

        <div className="loginShowcaseFooter">
          <span>PARTNER WITH LMCT</span>
        </div>
      </section>

      <section className="loginPanel">
        <div className="loginCard">
          <div className="loginCardTop">
            <span className="loginEyebrow">LMCT PARTNERS</span>

            <div className="loginGoldLine" />
          </div>

          <h2>{mode === "signin" ? "Welcome back" : "Create your account"}</h2>

          <p className="loginSubtitle">
            {mode === "signin"
              ? "Sign in to access your partner dashboard."
              : "Sign up, then LMCT will link your account to your partner profile."}
          </p>

          {error && (
            <div className="loginError" role="alert">
              {error}
            </div>
          )}

          {signupNotice && (
            <div className="loginError loginNotice" role="status">
              {signupNotice}
            </div>
          )}

          <form
            onSubmit={mode === "signin" ? handleSignIn : handleSignUp}
            className="loginForm"
          >
            <div className="loginField">
              <label htmlFor="partnerEmail">Email address</label>

              <input
                id="partnerEmail"
                type="email"
                placeholder="you@yourcompany.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
              />
            </div>

            <div className="loginField">
              <label htmlFor="partnerPassword">Password</label>

              <input
                id="partnerPassword"
                type="password"
                placeholder={
                  mode === "signin" ? "Enter your password" : "Choose a password"
                }
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete={
                  mode === "signin" ? "current-password" : "new-password"
                }
                minLength={6}
                required
              />
            </div>

            <button
              type="submit"
              className="loginSubmit"
              disabled={loading}
            >
              {loading
                ? "Please wait..."
                : mode === "signin"
                ? "Sign In"
                : "Create Account"}
              <span>↗</span>
            </button>
          </form>

          <button
            type="button"
            className="loginToggleMode"
            onClick={() => {
              setMode(mode === "signin" ? "signup" : "signin");
              setError("");
              setSignupNotice("");
            }}
          >
            {mode === "signin"
              ? "New partner? Create an account"
              : "Already have an account? Sign in"}
          </button>

          <a href="/partner-with-us" className="loginBack">
            ← Not a partner yet? Apply here
          </a>

          <p className="loginSecurity">
            Secure partner access
          </p>
        </div>
      </section>
    </main>
  );
}
