import React, { useState } from "react";
import { supabase } from "./supabaseClient";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(event) {
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

      window.location.href = "/admin";
    } catch (loginError) {
      console.error("Login error:", loginError);
      setError(
        loginError.message || "Unable to sign in. Please try again."
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
          <span className="loginEyebrow">PRIVATE ACCESS</span>

          <h1>
            Your gateway to
            <br />
            automotive excellence.
          </h1>

          <p>
            Manage premium vehicle listings, affiliate partners,
            and performance insights from one central dashboard.
          </p>
        </div>

        <div className="loginShowcaseFooter">
          <span>CURATED. CONNECTED. EXCLUSIVE.</span>
        </div>
      </section>

      <section className="loginPanel">
        <div className="loginCard">
          <div className="loginCardTop">
            <span className="loginEyebrow">LMCT ADMIN</span>

            <div className="loginGoldLine" />
          </div>

          <h2>Welcome back</h2>

          <p className="loginSubtitle">
            Sign in to access your administration dashboard.
          </p>

          {error && (
            <div className="loginError" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="loginForm">
            <div className="loginField">
              <label htmlFor="email">Email address</label>

              <input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
              />
            </div>

            <div className="loginField">
              <label htmlFor="password">Password</label>

              <input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                required
              />
            </div>

            <button
              type="submit"
              className="loginSubmit"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign In"}
              <span>↗</span>
            </button>
          </form>

          <a href="/" className="loginBack">
            ← Return to LMCT website
          </a>

          <p className="loginSecurity">
            Secure administrator access
          </p>
        </div>
      </section>
    </main>
  );
}