import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { ContentRow } from "@/lib/estate";

export const Route = createFileRoute("/admin/content")({
  component: ContentEditor,
});

const SECTIONS = [
  {
    page: "home",
    label: "Homepage",
    fields: [
      { key: "hero_headline", label: "Hero headline" },
      { key: "hero_subline", label: "Hero subline" },
      { key: "intro_heading", label: "Introduction heading" },
      { key: "intro_body", label: "Introduction body", multiline: true },
    ],
  },
  {
    page: "about",
    label: "About",
    fields: [
      { key: "heading", label: "Page heading" },
      { key: "history", label: "History", multiline: true },
      { key: "location", label: "Location & environment", multiline: true },
      { key: "philosophy", label: "Philosophy", multiline: true },
    ],
  },
  {
    page: "coffee",
    label: "Coffee",
    fields: [
      { key: "heading", label: "Page heading" },
      { key: "overview", label: "Overview", multiline: true },
      { key: "varieties", label: "Varieties" },
      { key: "altitude", label: "Altitude" },
      { key: "processing", label: "Processing" },
      { key: "flavour", label: "Flavour profile" },
    ],
  },
  {
    page: "pepper",
    label: "Pepper",
    fields: [
      { key: "heading", label: "Page heading" },
      { key: "overview", label: "Overview", multiline: true },
      { key: "cultivation", label: "Cultivation" },
      { key: "flavour", label: "Flavour profile" },
    ],
  },
  {
    page: "sustainability",
    label: "Sustainability",
    fields: [
      { key: "heading", label: "Page heading" },
      { key: "body", label: "Body text", multiline: true },
    ],
  },
  {
    page: "contact",
    label: "Contact",
    fields: [
      { key: "email", label: "Email address" },
      { key: "phone", label: "Phone number" },
      { key: "address", label: "Address" },
      { key: "instagram", label: "Instagram URL" },
    ],
  },
] as const;

function ContentEditor() {
  const queryClient = useQueryClient();

  const { data: rows, isLoading } = useQuery({
    queryKey: ["site_content"],
    queryFn: async () => {
      const { data, error } = await supabase.from("site_content").select("page, key, value");
      if (error) throw error;
      return (data ?? []) as ContentRow[];
    },
  });

  const getValue = (page: string, key: string) =>
    rows?.find((r) => r.page === page && r.key === key)?.value ?? "";

  const [active, setActive] = useState<string>("home");

  return (
    <div>
      <h1 className="font-display text-3xl">Site Content</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Edit the text that appears across the public website.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {SECTIONS.map((s) => (
          <button
            key={s.page}
            type="button"
            onClick={() => setActive(s.page)}
            aria-pressed={active === s.page}
            className={`rounded-sm border px-4 py-2 text-[0.7rem] font-semibold tracking-[0.16em] uppercase transition-colors ${
              active === s.page
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground hover:border-primary hover:text-primary"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="mt-8 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-sm bg-muted" />
          ))}
        </div>
      ) : (
        <SectionEditor
          key={active}
          section={SECTIONS.find((s) => s.page === active)!}
          getValue={getValue}
          onSaved={() => queryClient.invalidateQueries({ queryKey: ["site_content"] })}
        />
      )}
    </div>
  );
}

function SectionEditor({
  section,
  getValue,
  onSaved,
}: {
  section: (typeof SECTIONS)[number];
  getValue: (page: string, key: string) => string;
  onSaved: () => void;
}) {
  const [values, setValues] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    for (const f of section.fields) map[f.key] = getValue(section.page, f.key);
    return map;
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);

    for (const field of section.fields) {
      const val = values[field.key] ?? "";
      const { error } = await supabase
        .from("site_content")
        .upsert({ page: section.page, key: field.key, value: val }, { onConflict: "page,key" });
      if (error) {
        toast.error(error.message);
        setSaving(false);
        return;
      }
    }

    toast.success(`${section.label} content updated`);
    onSaved();
    setSaving(false);
  };

  return (
    <div className="mt-8 space-y-6 rounded-sm border border-border bg-card p-6">
      {section.fields.map((field) => (
        <label key={field.key} className="block">
          <span className="eyebrow mb-2 block text-foreground/80">{field.label}</span>
          {"multiline" in field && field.multiline ? (
            <textarea
              value={values[field.key] ?? ""}
              onChange={(e) => setValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
              rows={5}
              className="w-full resize-y rounded-sm border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          ) : (
            <input
              value={values[field.key] ?? ""}
              onChange={(e) => setValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
              className="w-full rounded-sm border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          )}
        </label>
      ))}
      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="inline-flex items-center gap-2 rounded-sm bg-primary px-6 py-2.5 text-xs font-semibold tracking-[0.16em] uppercase text-primary-foreground transition-colors hover:bg-secondary disabled:opacity-50"
      >
        <Save className="size-4" />
        {saving ? "Saving…" : "Save changes"}
      </button>
    </div>
  );
}
