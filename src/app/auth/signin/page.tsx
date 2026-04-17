"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

type Mode = "signin" | "signup";

const inputClass =
  "w-full bg-transparent border-b border-outline-variant/30 py-3 text-sm text-on-background placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary transition-colors";

export default function SignInPage() {
  const [mode, setMode] = useState<Mode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function switchMode(next: Mode) {
    setMode(next);
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "signup") {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Something went wrong");
          setLoading(false);
          return;
        }
      }

      const result = await signIn("credentials", {
        email,
        password,
        callbackUrl: "/",
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password");
        setLoading(false);
      } else {
        window.location.href = result?.url ?? "/";
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setLoading(true);
    await signIn("google", { callbackUrl: "/" });
  }

  return (
    <div className="bg-background text-on-background min-h-dvh flex flex-col items-center justify-center">

      {/* Decorative background */}
      <div className="fixed top-0 right-0 w-1/3 h-full bg-surface-container-low -z-10 opacity-30" />
      <div className="fixed bottom-0 left-0 w-24 h-24 rounded-full bg-primary opacity-5 -translate-x-1/2 translate-y-1/2 -z-10" />
      <div className="fixed top-24 left-10 w-px h-32 bg-outline-variant opacity-20 -z-10" />
      <div className="fixed top-56 left-8 w-px h-12 bg-primary opacity-10 -z-10" />

      {/* Main */}
      <main className="flex-1 w-full max-w-md px-6 flex flex-col justify-center">

        {/* Hero */}
        <div className={`mb-12 ${mode === "signin" ? "text-center mx-auto w-full" : ""}`}>
          {mode === "signin" && (
            <div className="flex justify-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-primary-container flex items-center justify-center shadow-sm">
                <span className="material-symbols-outlined text-primary text-3xl">local_cafe</span>
              </div>
            </div>
          )}
          {mode === "signup" && (
            <span className="text-[0.6875rem] uppercase tracking-[0.2em] font-semibold text-on-surface-variant block mb-3">
              Get Started
            </span>
          )}
          <h1 className="text-4xl font-extrabold tracking-tight text-on-background mb-3">
            {mode === "signup" ? "Create Archive" : "Brew Memoir"}
          </h1>
          <p className="text-on-surface-variant leading-relaxed">
            {mode === "signup" ? "Begin your sensory journey." : "The ritual of the perfect brew, recorded."}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-10">
          <div className="space-y-8">
            {mode === "signup" && (
              <div>
                <label className="block text-[0.6875rem] uppercase tracking-widest font-semibold text-on-surface-variant mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  autoComplete="name"
                  placeholder="Elias Thorne"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputClass}
                />
              </div>
            )}

            <div>
              <label className="block text-[0.6875rem] uppercase tracking-widest font-semibold text-on-surface-variant mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
              />
            </div>

            <div className="relative">
              <label className="block text-[0.6875rem] uppercase tracking-widest font-semibold text-on-surface-variant mb-1">
                Password
              </label>
              <input
                type={showPassword ? "text" : "password"}
                required
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`${inputClass} pr-8`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-0 bottom-3 text-on-surface-variant hover:text-primary transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                <span className="material-symbols-outlined text-[20px]">
                  {showPassword ? "visibility" : "visibility_off"}
                </span>
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-error -mt-4">{error}</p>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 text-on-primary font-bold rounded-xl tracking-widest text-sm hover:opacity-90 transition-all active:scale-[0.98] shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ background: "linear-gradient(135deg, #79573f 0%, #6c4b34 100%)" }}
            >
              {loading
                ? "Please wait…"
                : mode === "signup"
                ? "CREATE ACCOUNT"
                : "SIGN IN"}
            </button>
          </div>
        </form>

        {/* Google divider */}
        <div className="mt-12">
          <div className="relative flex items-center justify-center mb-6">
            <div className="grow border-t border-outline-variant opacity-10" />
            <span className="mx-4 text-[0.6875rem] uppercase tracking-[0.2em] font-semibold text-on-surface-variant">
              or continue with
            </span>
            <div className="grow border-t border-outline-variant opacity-10" />
          </div>

          <button
            onClick={handleGoogle}
            disabled
            className="w-full flex items-center justify-center gap-3 py-4 bg-surface-container-low rounded-xl opacity-30 cursor-not-allowed"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
              <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
            </svg>
            <span className="text-sm font-bold tracking-widest uppercase text-on-surface">Google</span>
          </button>
        </div>

        {/* Toggle */}
        <div className="mt-10 text-center">
          {mode === "signup" ? (
            <p className="text-sm text-on-surface-variant">
              Already have an archive?{" "}
              <button
                onClick={() => switchMode("signin")}
                className="text-primary font-bold border-b border-transparent hover:border-primary transition-all"
              >
                Sign In
              </button>
            </p>
          ) : (
            <p className="text-sm text-on-surface-variant">
              New here?{" "}
              <button
                onClick={() => switchMode("signup")}
                className="text-primary font-bold border-b border-transparent hover:border-primary transition-all"
              >
                Create Account
              </button>
            </p>
          )}
        </div>

      </main>
    </div>
  );
}
