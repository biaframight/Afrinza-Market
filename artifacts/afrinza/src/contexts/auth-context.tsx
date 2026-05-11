import React, { createContext, useContext } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getSellerByUserId } from "@/lib/supabase-db";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import type { Seller } from "@/lib/supabase-db";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  sellerProfile: Seller | null;
  sellerLoading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  isAuthenticated: false,
  sellerProfile: null,
  sellerLoading: false,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user, loading, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const { data: sellerProfile, isLoading: sellerLoading } = useQuery({
    queryKey: ["seller-profile", user?.id],
    queryFn: () => getSellerByUserId(user!.id),
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
  });

  const signOut = async () => {
    await supabase.auth.signOut();
    queryClient.clear();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated,
        sellerProfile: sellerProfile ?? null,
        sellerLoading,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  return useContext(AuthContext);
}
