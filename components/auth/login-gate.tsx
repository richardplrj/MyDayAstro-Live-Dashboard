"use client";

import { motion } from "framer-motion";
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import type { User } from "firebase/auth";
import { type ReactNode, useCallback, useEffect, useState } from "react";

import { auth } from "../../lib/firebase";
import { springSnappy, springSoft } from "../../lib/motion-presets";

const ADMIN_EMAILS = [
  "richardplrj@gmail.com",
  "ajay.shembekar@gmail.com",
  "kanchanmsk@gmail.com",
] as const;

function normalizeEmail(email: string | null | undefined): string {
  return (email ?? "").trim().toLowerCase();
}

function isAdmin(user: User | null): boolean {
  if (!user?.email) return false;
  const email = normalizeEmail(user.email);
  return ADMIN_EMAILS.some((allowed) => normalizeEmail(allowed) === email);
}

export function LoginGate({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<"loading" | "ready">("loading");
  const [user, setUser] = useState<User | null>(null);
  const [signingIn, setSigningIn] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (next) => {
      setUser(next);
      setPhase("ready");
    });
    return () => unsub();
  }, []);

  const handleGoogleSignIn = useCallback(async () => {
    setSigningIn(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error(err);
    } finally {
      setSigningIn(false);
    }
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error(err);
    }
  }, []);

  if (phase === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <motion.div
          className="h-9 w-9 rounded-full border-2 border-indigo-500/30 border-t-indigo-400"
          animate={{ rotate: 360 }}
          transition={{ duration: 0.85, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
        />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(99,102,241,0.25),transparent)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_100%_100%,rgba(14,165,233,0.12),transparent)]" />

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={springSoft}
          className="relative z-10 w-full max-w-md"
        >
          <motion.div
            whileHover={{ y: -2, transition: springSoft }}
            className="rounded-2xl border border-slate-700/50 bg-slate-900/80 p-8 shadow-[0_25px_80px_rgba(0,0,0,0.5)] backdrop-blur-xl"
          >
            <div className="mb-2 text-center text-xs font-semibold uppercase tracking-[0.2em] text-indigo-400/90">
              MyDay Astro
            </div>
            <h1 className="text-center text-2xl font-semibold tracking-tight text-slate-100">
              Admin Login
            </h1>
            <p className="mt-2 text-center text-sm text-slate-400">
              Sign in with your authorized Google account to access the dashboard.
            </p>

            <motion.button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={signingIn}
              whileHover={{ scale: signingIn ? 1 : 1.02 }}
              whileTap={{ scale: signingIn ? 1 : 0.98 }}
              transition={springSnappy}
              className="mt-8 flex w-full items-center justify-center gap-3 rounded-xl border border-slate-600/50 bg-slate-800/80 px-4 py-3.5 text-sm font-medium text-slate-100 shadow-lg transition-colors duration-200 hover:border-indigo-400/35 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <motion.span animate={signingIn ? { opacity: [1, 0.5, 1] } : {}} transition={{ duration: 1.2, repeat: signingIn ? Number.POSITIVE_INFINITY : 0 }}>
                <GoogleGlyph />
              </motion.span>
              {signingIn ? "Opening Google…" : "Sign in with Google"}
            </motion.button>

            <p className="mt-6 text-center text-xs text-slate-500">
              Real-time data loads only after a successful sign-in.
            </p>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  if (!isAdmin(user)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={springSoft}
          className="w-full max-w-md rounded-2xl border border-rose-500/30 bg-rose-950/40 p-8 text-center shadow-[0_25px_80px_rgba(0,0,0,0.45)]"
        >
          <h2 className="text-xl font-semibold text-rose-100">Access Denied</h2>
          <p className="mt-2 text-sm text-rose-200/80">
            Signed in as <span className="font-mono text-rose-50">{user.email}</span>. This account
            is not authorized to view the admin dashboard.
          </p>
          <motion.button
            type="button"
            onClick={handleLogout}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            transition={springSnappy}
            className="mt-6 rounded-lg border border-slate-600 bg-slate-900 px-5 py-2.5 text-sm font-medium text-slate-200 transition-colors duration-200 hover:border-slate-500 hover:bg-slate-800"
          >
            Sign out
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}>
      {children}
    </motion.div>
  );
}

function GoogleGlyph() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}
