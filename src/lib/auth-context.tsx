import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";

type Role = "admin" | "surveyor" | null;

interface AuthCtx {
  session: Session | null;
  user: User | null;
  role: Role;
  loading: boolean;
  roleLoading: boolean;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthCtx>({
  session: null, user: null, role: null, loading: true, roleLoading: true, signOut: async () => {},
});

export async function fetchUserRole(userId: string): Promise<Exclude<Role, null>> {
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  const roles = (data || []).map((r) => r.role);
  return roles.includes("admin") ? "admin" : "surveyor";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<Role>(null);
  const [loading, setLoading] = useState(true);
  const [roleLoading, setRoleLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const applySession = (s: Session | null) => {
      if (!active) return;
      setSession(s);
      setLoading(false);
      if (!s?.user) {
        setRole(null);
        setRoleLoading(false);
        return;
      }
      setRoleLoading(true);
      // never block on the role lookup — resolve to surveyor if it fails
      fetchUserRole(s.user.id)
        .then((r) => { if (active) setRole(r); })
        .catch(() => { if (active) setRole("surveyor"); })
        .finally(() => { if (active) setRoleLoading(false); });
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setTimeout(() => applySession(s), 0);
    });
    supabase.auth.getSession().then(({ data: { session } }) => applySession(session));

    return () => { active = false; subscription.unsubscribe(); };
  }, []);

  return (
    <Ctx.Provider value={{
      session,
      user: session?.user ?? null,
      role,
      loading,
      roleLoading,
      signOut: async () => { await supabase.auth.signOut(); },
    }}>{children}</Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
