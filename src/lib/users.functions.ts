import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { accessFields, accessFieldsOptional, normalizeAccess } from "@/lib/users.access";

async function getAdmin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

async function assertAdmin(supabase: any, userId: string) {
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!data) throw new Error("Forbidden: admin only");
}

// PUBLIC: bootstrap the default admin (admin@gmail.com / 123456). Idempotent — also
// resets the password to the default on every call so the documented credentials always work.
export const initAdmin = createServerFn({ method: "POST" }).handler(async () => {
  const admin = await getAdmin();
  const email = "admin@gmail.com";
  const password = "123456";

  // Try create user
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: "Administrator" },
  });

  let userId = created?.user?.id;
  if (!userId) {
    // user already exists — look it up
    const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const found = list?.users?.find((u) => u.email === email);
    if (!found) throw new Error(createErr?.message || "Could not bootstrap admin user");
    userId = found.id;
    // force password back to default so the documented login always works
    await admin.auth.admin.updateUserById(userId, { password, email_confirm: true });
  }

  // Ensure admin role
  await admin.from("user_roles").upsert(
    { user_id: userId, role: "admin" },
    { onConflict: "user_id,role" },
  );
  await admin.from("profiles").upsert({
    id: userId,
    full_name: "Administrator",
    email,
  });

  return { ok: true, userId };
});

// ADMIN ONLY: list survey users (and admins) with their roles
export const listAppUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const admin = await getAdmin();
    const { data: profiles, error } = await admin
      .from("profiles")
      .select("id, full_name, email, mobile, is_active, created_at, access_scope, access_districts, access_talukas, access_villages")
      .order("created_at", { ascending: false });
    if (error) throw error;
    const { data: roles } = await admin.from("user_roles").select("user_id, role");
    return (profiles || []).map((p) => ({
      ...p,
      role: roles?.find((r) => r.user_id === p.id)?.role ?? "surveyor",
    }));
  });

const createUserInput = z.object({
  full_name: z.string().min(1).max(120),
  email: z.string().email().max(255),
  mobile: z.string().max(20).optional(),
  password: z.string().min(6).max(72),
  is_active: z.boolean().default(true),
  ...accessFields,
});

export const createSurveyUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => createUserInput.parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const admin = await getAdmin();
    const { data: created, error } = await admin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.full_name, mobile: data.mobile },
    });
    if (error) throw new Error(error.message);
    const uid = created.user!.id;
    await admin
      .from("profiles")
      .upsert({ id: uid, full_name: data.full_name, email: data.email, mobile: data.mobile ?? null, is_active: data.is_active, ...normalizeAccess(data) });
    await admin
      .from("user_roles")
      .upsert({ user_id: uid, role: "surveyor" }, { onConflict: "user_id,role" });
    return { id: uid };
  });

const updateUserInput = z.object({
  id: z.string().uuid(),
  full_name: z.string().min(1).max(120).optional(),
  mobile: z.string().max(20).optional(),
  is_active: z.boolean().optional(),
  password: z.string().min(6).max(72).optional(),
  email: z.string().email().max(255).optional(),
  ...accessFieldsOptional,
});

export const updateSurveyUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => updateUserInput.parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const admin = await getAdmin();
    if (data.password || data.email) {
      const upd: any = {};
      if (data.password) upd.password = data.password;
      if (data.email) upd.email = data.email;
      const { error } = await admin.auth.admin.updateUserById(data.id, upd);
      if (error) throw new Error(error.message);
    }
    const patch: any = {};
    if (data.full_name !== undefined) patch.full_name = data.full_name;
    if (data.mobile !== undefined) patch.mobile = data.mobile;
    if (data.is_active !== undefined) patch.is_active = data.is_active;
    if (data.email !== undefined) patch.email = data.email;
    if (data.access_scope !== undefined) Object.assign(patch, normalizeAccess(data));
    if (Object.keys(patch).length) {
      await admin.from("profiles").update(patch).eq("id", data.id);
    }
    return { ok: true };
  });

export const deleteSurveyUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    if (data.id === context.userId) throw new Error("स्वतःचे खाते हटवू शकत नाही");
    const admin = await getAdmin();
    const { error } = await admin.auth.admin.deleteUser(data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// Any authenticated user can change their own password / email / name
const meInput = z.object({
  full_name: z.string().min(1).max(120).optional(),
  email: z.string().email().max(255).optional(),
  password: z.string().min(6).max(72).optional(),
});
export const updateMyAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => meInput.parse(data))
  .handler(async ({ data, context }) => {
    const admin = await getAdmin();
    if (data.password || data.email) {
      const upd: any = {};
      if (data.password) upd.password = data.password;
      if (data.email) upd.email = data.email;
      const { error } = await admin.auth.admin.updateUserById(context.userId, upd);
      if (error) throw new Error(error.message);
    }
    const patch: any = {};
    if (data.full_name !== undefined) patch.full_name = data.full_name;
    if (data.email !== undefined) patch.email = data.email;
    if (Object.keys(patch).length) {
      await admin.from("profiles").update(patch).eq("id", context.userId);
    }
    return { ok: true };
  });

// Public list of submitter names mapped by user id — admin only (for All Surveys table)
export const getSubmitterNames = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const admin = await getAdmin();
    const { data } = await admin.from("profiles").select("id, full_name, email");
    return data || [];
  });

// ADMIN ONLY: distinct district / taluka / village values available in the portal
export const getLocationTree = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const admin = await getAdmin();
    const { data } = await admin.from("surveys").select("district, taluka, village");
    return (data || [])
      .map((r) => ({
        district: (r.district || "").trim(),
        taluka: (r.taluka || "").trim(),
        village: (r.village || "").trim(),
      }))
      .filter((r) => r.district || r.taluka || r.village);
  });
