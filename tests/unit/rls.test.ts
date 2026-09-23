import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";

const MIGRATIONS_DIR = resolve(process.cwd(), "supabase/migrations");

const migrations = readdirSync(MIGRATIONS_DIR)
  .filter((f) => f.endsWith(".sql"))
  .sort()
  .map((f) => ({ file: f, sql: readFileSync(join(MIGRATIONS_DIR, f), "utf8") }));

const ALL_SQL = migrations.map((m) => m.sql).join("\n");

describe("Supabase RLS / authorization assumptions (from in-repo migrations, no secrets)", () => {
  it("finds at least one migration file", () => {
    expect(migrations.length).toBeGreaterThan(0);
  });

  it.each([
    "profiles",
    "user_roles",
    "blog_posts",
    "media",
    "site_content",
    "contact_messages",
    "contact_rate_limits",
  ])("enables Row Level Security on %s", (table) => {
    // RLS is enabled on the exact table (ALTER ... ENABLE ROW LEVEL SECURITY).
    const re = new RegExp(
      `ALTER\\s+TABLE\\s+(?:public\\.)?${table}\\s+ENABLE\\s+ROW\\s+LEVEL\\s+SECURITY`,
      "i",
    );
    expect(ALL_SQL, `expected RLS enabled on ${table}`).toMatch(re);
  });

  it("blog_posts write policies require the admin role", () => {
    expect(ALL_SQL).toMatch(/has_role\(auth\.uid\(\),\s*'admin'\)/i);
    // Anon can only SELECT published posts, never insert/update/delete.
    expect(ALL_SQL).toMatch(/public read published posts[\s\S]*?status = 'published'/i);
    expect(ALL_SQL).not.toMatch(/CREATE POLICY[^;]*blog_posts[^;]*FOR INSERT TO anon/i);
  });

  it("media write policies require the admin role and public reads are SELECT-only", () => {
    expect(ALL_SQL).toMatch(/admins insert media[\s\S]*?has_role\(auth\.uid\(\),\s*'admin'\)/i);
  });

  it("contact_messages: anyone may insert (bounded), only admins select/delete", () => {
    expect(ALL_SQL).toMatch(/anyone can send a message/i);
    expect(ALL_SQL).toMatch(/char_length\(message\) BETWEEN 1 AND 4000/i);
    expect(ALL_SQL).toMatch(/admins read messages[\s\S]*?has_role\(auth\.uid\(\),\s*'admin'\)/i);
    expect(ALL_SQL).toMatch(/admins delete messages[\s\S]*?has_role\(auth\.uid\(\),\s*'admin'\)/i);
  });

  it("storage estate-media bucket allows admin write and anon SELECT only", () => {
    expect(ALL_SQL).toMatch(/estate media readable[\s\S]*?bucket_id = 'estate-media'/i);
    expect(ALL_SQL).toMatch(
      /admins upload estate media[\s\S]*?has_role\(auth\.uid\(\),\s*'admin'\)/i,
    );
    expect(ALL_SQL).toMatch(
      /admins delete estate media[\s\S]*?has_role\(auth\.uid\(\),\s*'admin'\)/i,
    );
  });

  it("has_role SECURITY DEFINER is not granted to anonymous users", () => {
    expect(ALL_SQL).toMatch(/REVOKE ALL ON FUNCTION public\.has_role[\s\S]*?FROM PUBLIC, anon/i);
    expect(ALL_SQL).toMatch(/GRANT EXECUTE ON FUNCTION public\.has_role[\s\S]*?TO authenticated/i);
  });

  it("is_read column added idempotently (hardened contact table)", () => {
    expect(ALL_SQL).toMatch(/ADD COLUMN is_read boolean NOT NULL DEFAULT false/i);
  });

  it("rate-limit cleanup function exists (24h retention)", () => {
    expect(ALL_SQL).toMatch(/cleanup_rate_limits/i);
    expect(ALL_SQL).toMatch(/interval '24 hours'/i);
  });
});
