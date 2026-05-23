"use client";

import { useActionState, useState } from "react";
import { isSupabaseConfigured } from "@/lib/supabase";
import { signInAction, signUpAction, type AuthState } from "./actions";
import {
  CheckCircle,
  ExternalLink,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
} from "lucide-react";

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false);

  const [signInState, signInFormAction, signInPending] = useActionState<AuthState, FormData>(
    signInAction,
    null,
  );
  const [signUpState, signUpFormAction, signUpPending] = useActionState<AuthState, FormData>(
    signUpAction,
    null,
  );

  const configured = isSupabaseConfigured();
  const loading = signInPending || signUpPending;

  const error = isSignUp
    ? signUpState && "error" in signUpState ? signUpState.error : null
    : signInState && "error" in signInState ? signInState.error : null;

  const successMsg =
    isSignUp && signUpState && "success" in signUpState
      ? "Account created! Check your email to confirm, then sign in."
      : null;

  const currentAction = isSignUp ? signUpFormAction : signInFormAction;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-slate-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-600 rounded-2xl mb-4 shadow-lg">
            <ShieldCheck className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800">BMW-Sync</h1>
          <p className="text-slate-500 mt-1">Toilet Hygiene Compliance System</p>
          <div className="flex justify-center gap-4 mt-3 text-xs font-semibold tracking-widest text-emerald-700 uppercase">
            <span>Bersih</span>
            <span>•</span>
            <span>Menawan</span>
            <span>•</span>
            <span>Wangi</span>
          </div>
        </div>

        {!configured ? (
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <ShieldCheck className="w-7 h-7 text-amber-600" />
            </div>
            <h2 className="text-lg font-bold text-slate-800 mb-2">
              Supabase Not Configured
            </h2>
            <p className="text-slate-500 text-sm mb-4">
              Set up your Supabase credentials to enable authentication.
            </p>
            <a
              href="/bmw-sync/setup"
              className="inline-flex items-center gap-1.5 text-emerald-600 font-semibold text-sm hover:underline"
            >
              View Setup Guide <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-xl font-semibold text-slate-800 mb-6">
              {isSignUp ? "Create Owner Account" : "Owner Sign In"}
            </h2>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
                {error}
              </div>
            )}

            {successMsg && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-lg px-4 py-3 mb-4 flex items-start gap-2">
                <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                {successMsg}
              </div>
            )}

            <form action={currentAction} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    name="email"
                    required
                    placeholder="owner@restaurant.com"
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    name="password"
                    required
                    minLength={6}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-semibold py-2.5 rounded-lg transition flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {isSignUp ? "Creating account…" : "Signing in…"}
                  </>
                ) : isSignUp ? (
                  "Create Account"
                ) : (
                  "Sign In"
                )}
              </button>
            </form>

            <div className="mt-5 text-center text-sm text-slate-500">
              {isSignUp ? (
                <>
                  Already have an account?{" "}
                  <button
                    onClick={() => setIsSignUp(false)}
                    className="text-emerald-600 font-medium hover:underline"
                  >
                    Sign in
                  </button>
                </>
              ) : (
                <>
                  New restaurant owner?{" "}
                  <button
                    onClick={() => setIsSignUp(true)}
                    className="text-emerald-600 font-medium hover:underline"
                  >
                    Create account
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        <p className="text-center text-xs text-slate-400 mt-6">
          BMW Mandate 2026 · Municipal Council Compliance Platform
        </p>
      </div>
    </div>
  );
}
