import React, { useState } from "react";
import { Link } from "react-router-dom";
import Icon from "../components/Icon";
import { apiRequest } from "../api";
import "../styles/auth.css";

export default function AuthPage({ mode, onAuthenticate }) {
  const isSignup = mode === "signup";
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");

  const setField = (field) => (event) =>
    setForm((current) => ({ ...current, [field]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    if (!form.email || !form.password || (isSignup && !form.name)) {
      setError("Please complete all required fields.");
      return;
    }
    try {
      const payload = await apiRequest(
        isSignup ? "/auth/signup" : "/auth/login",
        {
          method: "POST",
          body: JSON.stringify(form),
        },
      );
      onAuthenticate(payload.user);
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-brand-panel">
        <div className="brand-mark">OM</div>
        <p className="eyebrow">OM ENTERPRISES</p>
        <h1>Keep every trip moving forward.</h1>
        <p>Manage trips, payments, and billing records from one organised workspace.</p>
      </section>
      <section className="auth-card">
        <div className="auth-card-header">
          <div className="auth-mark"><Icon name="truck" /></div>
          <p className="eyebrow">BILL MANAGEMENT</p>
          <h2>{isSignup ? "Create your account" : "Welcome back"}</h2>
          <p>{isSignup ? "Start organising your business trips today." : "Sign in to continue to your workspace."}</p>
        </div>
        <form className="auth-form" onSubmit={submit}>
          {isSignup && (
            <label className="field">
              <span>Full name</span>
              <input value={form.name} onChange={setField("name")} placeholder="Your name" />
            </label>
          )}
          <label className="field">
            <span>Email address</span>
            <input type="email" value={form.email} onChange={setField("email")} placeholder="you@example.com" />
          </label>
          <label className="field">
            <span>Password</span>
            <input type="password" value={form.password} onChange={setField("password")} placeholder="Enter your password" />
          </label>
          {error && <p className="auth-error">{error}</p>}
          <button className="primary-button auth-submit" type="submit">
            {isSignup ? "Create account" : "Sign in"}
            <Icon name="arrow" />
          </button>
        </form>
        <p className="auth-switch">
          {isSignup ? "Already have an account?" : "New to OM Enterprises?"}{" "}
          <Link to={isSignup ? "/login" : "/signup"}>
            {isSignup ? "Sign in" : "Create an account"}
          </Link>
        </p>
      </section>
    </main>
  );
}
