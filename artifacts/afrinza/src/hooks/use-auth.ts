import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Session, User } from "@supabase/supabase-js";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Register listener BEFORE calling getSession so we don't miss events
    // that fire between the two. The listener handles sign-in, sign-out,
    // and token-refresh events AFTER the initial session is resolved.
    // It deliberately does NOT touch `loading` — only getSession() does that,
    // so we avoid the race where onAuthStateChange fires INITIAL_SESSION with
    // session=null (during token refresh on Vercel) and incorrectly clears loading.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setSession(session);
      setUser(session?.user ?? null);
    });

    // This is the single authoritative source for the initial session.
    // It waits for any pending token refresh before resolving, so it is
    // always reliable — unlike onAuthStateChange which can fire with null
    // mid-refresh on production deployments.
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (!mounted) return;
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      })
      .catch(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return { user, session, loading, isAuthenticated: !!user };
}
