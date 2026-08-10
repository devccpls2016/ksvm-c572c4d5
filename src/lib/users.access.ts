import { z } from "zod";

export const ACCESS_SCOPES = ["all", "district", "taluka", "village"] as const;
export type AccessScope = (typeof ACCESS_SCOPES)[number];

export const ACCESS_SCOPE_LABELS: Record<AccessScope, string> = {
  all: "All (संपूर्ण पोर्टल)",
  district: "District-wise (जिल्हानिहाय)",
  taluka: "Taluka-wise (तालुकानिहाय)",
  village: "Village-wise (गावनिहाय)",
};

export const accessFields = {
  access_scope: z.enum(ACCESS_SCOPES).default("all"),
  access_districts: z.array(z.string()).default([]),
  access_talukas: z.array(z.string()).default([]),
  access_villages: z.array(z.string()).default([]),
};

export const accessFieldsOptional = {
  access_scope: z.enum(ACCESS_SCOPES).optional(),
  access_districts: z.array(z.string()).optional(),
  access_talukas: z.array(z.string()).optional(),
  access_villages: z.array(z.string()).optional(),
};

export interface AccessInput {
  access_scope?: AccessScope;
  access_districts?: string[];
  access_talukas?: string[];
  access_villages?: string[];
}

export function normalizeAccess(d: AccessInput) {
  const scope: AccessScope = d.access_scope ?? "all";
  return {
    access_scope: scope,
    access_districts: scope === "all" ? [] : (d.access_districts ?? []),
    access_talukas: scope === "taluka" || scope === "village" ? (d.access_talukas ?? []) : [],
    access_villages: scope === "village" ? (d.access_villages ?? []) : [],
  };
}

export function accessSummary(p: AccessInput): string {
  const scope = p.access_scope ?? "all";
  if (scope === "all") return "All";
  const list =
    scope === "district" ? p.access_districts : scope === "taluka" ? p.access_talukas : p.access_villages;
  const names = (list ?? []).filter(Boolean);
  const label = scope === "district" ? "District" : scope === "taluka" ? "Taluka" : "Village";
  if (!names.length) return `${label}-wise (—)`;
  return `${label}-wise: ${names.slice(0, 2).join(", ")}${names.length > 2 ? ` +${names.length - 2}` : ""}`;
}
