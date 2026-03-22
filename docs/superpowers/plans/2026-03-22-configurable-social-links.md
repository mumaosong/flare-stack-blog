# Configurable Social Links Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace hardcoded social links (github + email) with a dynamic, ordered array of up to 6 configurable social links, supporting preset platforms and custom icon uploads.

**Architecture:** Extend `siteConfig.social` from `{ github, email }` object to `SocialLink[]` array. Add a shared `SOCIAL_PLATFORMS` registry for preset icons/labels. Backward-compatible migration in `resolveSiteConfig()` converts old format on read. Admin UI gets a dynamic list editor; both themes render from the array.

**Tech Stack:** Zod schemas, React Hook Form + useFieldArray, lucide-react icons, custom SVGs for Discord/Bilibili

**Spec:** `docs/superpowers/specs/2026-03-22-configurable-social-links-design.md`

---

### Task 1: Social platforms registry and schema

**Files:**
- Create: `src/features/config/utils/social-platforms.tsx`
- Modify: `src/features/config/site-config.schema.ts`
- Modify: `src/blog.config.ts`

- [ ] **Step 1: Create the social platforms registry**

Create `src/features/config/utils/social-platforms.tsx`:

```tsx
import { Github, Mail, Rss, Twitter } from "lucide-react";

export const SOCIAL_PLATFORM_KEYS = [
  "github",
  "twitter",
  "discord",
  "bilibili",
  "email",
  "rss",
  "custom",
] as const;

export type SocialPlatform = (typeof SOCIAL_PLATFORM_KEYS)[number];

export interface SocialLink {
  platform: SocialPlatform;
  url: string;
  icon?: string;   // R2 path, only for "custom"
  label?: string;  // tooltip, only for "custom"
}

// Discord SVG (lucide has no Discord icon)
function DiscordIcon({ size = 20, ...props }: { size?: number } & React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" {...props}>
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
    </svg>
  );
}

// Bilibili SVG
function BilibiliIcon({ size = 20, ...props }: { size?: number } & React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" {...props}>
      <path d="M17.813 4.653h.854c1.51.054 2.769.578 3.773 1.574 1.004.995 1.524 2.249 1.56 3.76v7.36c-.036 1.51-.556 2.769-1.56 3.773s-2.262 1.524-3.773 1.56H5.333c-1.51-.036-2.769-.556-3.773-1.56S.036 18.858 0 17.347v-7.36c.036-1.511.556-2.765 1.56-3.76 1.004-.996 2.262-1.52 3.773-1.574h.774l-1.174-1.12a1.234 1.234 0 0 1-.373-.906c0-.356.124-.658.373-.907l.027-.027c.267-.249.573-.373.92-.373.347 0 .653.124.92.373L9.653 4.44c.071.071.134.142.187.213h4.267a.836.836 0 0 1 .16-.213l2.853-2.747c.267-.249.573-.373.92-.373.347 0 .662.151.929.4.267.249.391.551.391.907 0 .355-.124.657-.373.906zM5.333 7.24c-.746.018-1.373.276-1.88.773-.506.498-.769 1.13-.786 1.894v7.52c.017.764.28 1.395.786 1.893.507.498 1.134.756 1.88.773h13.334c.746-.017 1.373-.275 1.88-.773.506-.498.769-1.129.786-1.893v-7.52c-.017-.765-.28-1.396-.786-1.894-.507-.497-1.134-.755-1.88-.773zM8 11.107c.373 0 .684.124.933.373.25.249.383.569.4.96v1.173c-.017.391-.15.711-.4.96-.249.25-.56.374-.933.374s-.684-.125-.933-.374c-.25-.249-.383-.569-.4-.96V12.44c.017-.391.15-.711.4-.96.249-.249.56-.373.933-.373zm8 0c.373 0 .684.124.933.373.25.249.383.569.4.96v1.173c-.017.391-.15.711-.4.96-.249.25-.56.374-.933.374s-.684-.125-.933-.374c-.25-.249-.383-.569-.4-.96V12.44c.017-.391.15-.711.4-.96.249-.249.56-.373.933-.373z" />
    </svg>
  );
}

interface PlatformMeta {
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  label: string;
}

export const SOCIAL_PLATFORMS: Record<Exclude<SocialPlatform, "custom">, PlatformMeta> = {
  github: { icon: Github, label: "GitHub" },
  twitter: { icon: Twitter, label: "Twitter / X" },
  discord: { icon: DiscordIcon, label: "Discord" },
  bilibili: { icon: BilibiliIcon, label: "Bilibili" },
  email: { icon: Mail, label: "Email" },
  rss: { icon: Rss, label: "RSS" },
};

export const MAX_SOCIAL_LINKS = 6;
```

- [ ] **Step 2: Update the Zod schemas for social links**

In `src/features/config/site-config.schema.ts`, replace the `social` object schema with an array schema.

Replace:
```typescript
// In FullSiteConfigSchema (line ~303)
social: z.object({
  github: createUrlSchema(),
  email: createEmailSchema(),
}),
```

With:
```typescript
social: z.array(
  z.object({
    platform: z.enum(SOCIAL_PLATFORM_KEYS),
    url: z.string(),
    icon: z.string().optional(),
    label: z.string().optional(),
  })
).max(MAX_SOCIAL_LINKS),
```

Do the same for `SiteConfigInputSchema` (line ~356) and `createSiteConfigInputFormSchema` (line ~326). The input/form versions should use `.optional()` on the social field itself.

Import `SOCIAL_PLATFORM_KEYS` and `MAX_SOCIAL_LINKS` from `./utils/social-platforms`.

- [ ] **Step 3: Update blogConfig default**

In `src/blog.config.ts`, change:
```typescript
social: {
  github: "https://github.com/example",
  email: "example@email.com",
},
```
To:
```typescript
social: [
  { platform: "github" as const, url: "https://github.com/example" },
  { platform: "email" as const, url: "mailto:example@email.com" },
  { platform: "rss" as const, url: "/rss.xml" },
],
```

- [ ] **Step 4: Run type check**

Run: `bun check`
Expected: Type errors in `resolveSiteConfig`, admin UI, and theme components (expected — we'll fix these in subsequent tasks)

- [ ] **Step 5: Commit**

```bash
git add src/features/config/utils/social-platforms.tsx src/features/config/site-config.schema.ts src/blog.config.ts
git commit -m "feat: add social platforms registry and update schema to array"
```

---

### Task 2: Backward-compatible migration in resolveSiteConfig

**Files:**
- Modify: `src/features/config/service/config.service.ts`

- [ ] **Step 1: Update resolveSiteConfig to handle both formats**

In `src/features/config/service/config.service.ts`, replace the social resolution block (around line 55-58):

```typescript
// Old code:
social: {
  github: config?.site?.social?.github ?? blogConfig.social.github,
  email: config?.site?.social?.email ?? blogConfig.social.email,
},
```

With:
```typescript
social: migrateSocial(config?.site?.social),
```

Add the migration function above `resolveSiteConfig`:

```typescript
function migrateSocial(social: unknown): SocialLink[] {
  // New format — already an array
  if (Array.isArray(social)) return social;

  // Old format — { github?: string, email?: string }
  if (social && typeof social === "object" && !Array.isArray(social)) {
    const old = social as { github?: string; email?: string };
    const migrated: SocialLink[] = [];
    if (old.github) migrated.push({ platform: "github", url: old.github });
    if (old.email) migrated.push({ platform: "email", url: `mailto:${old.email}` });
    return migrated;
  }

  // Fallback to blogConfig defaults
  return blogConfig.social;
}
```

Import `SocialLink` from `@/features/config/utils/social-platforms`.

- [ ] **Step 2: Run type check**

Run: `bun check`
Expected: Remaining errors only in admin UI and theme components

- [ ] **Step 3: Commit**

```bash
git add src/features/config/service/config.service.ts
git commit -m "feat: backward-compatible social links migration in resolveSiteConfig"
```

---

### Task 3: Admin UI — social links list editor

**Files:**
- Modify: `src/features/config/components/site-settings-section.tsx`
- Create: `src/features/config/components/social-links-editor.tsx`
- Modify: `messages/zh.json` (add i18n keys)
- Modify: `messages/en.json` (add i18n keys)

- [ ] **Step 1: Add i18n keys**

Add to both `messages/zh.json` and `messages/en.json`:

```json
"settings_social_add": "添加社交链接" / "Add social link",
"settings_social_platform": "平台" / "Platform",
"settings_social_url": "链接" / "URL",
"settings_social_url_ph": "https://..." / "https://...",
"settings_social_icon": "图标" / "Icon",
"settings_social_label": "标签" / "Label",
"settings_social_label_ph": "显示名称" / "Display name",
"settings_social_max_reached": "最多 {max} 个链接" / "Maximum {max} links",
"settings_social_custom": "自定义" / "Custom"
```

- [ ] **Step 2: Create the social links editor component**

Create `src/features/config/components/social-links-editor.tsx`:

A React component using `useFieldArray` from react-hook-form:
- Field array name: `"site.social"`
- Each row: platform `<select>` | URL `<Input>` | (if custom) icon `<AssetUploadField>` + label `<Input>`
- Add button: `append({ platform: "github", url: "" })`, disabled when `fields.length >= MAX_SOCIAL_LINKS`
- Remove button per row: `remove(index)`
- Platform select options: map over `SOCIAL_PLATFORM_KEYS`, display label from `SOCIAL_PLATFORMS` (or "Custom" for `"custom"`)

- [ ] **Step 3: Replace the social section in site-settings-section.tsx**

In `src/features/config/components/site-settings-section.tsx`, replace the Social Links `<SectionShell>` block (lines 93-117) with:

```tsx
<SectionShell
  title={m.settings_site_section_social_title()}
  description={m.settings_site_section_social_desc()}
>
  <div className="md:col-span-2">
    <SocialLinksEditor />
  </div>
</SectionShell>
```

Import `SocialLinksEditor` from `./social-links-editor`.

- [ ] **Step 4: Run dev server and test admin UI**

Run: `bun dev`
- Navigate to `/admin/settings` → Site tab
- Verify social links section renders with list editor
- Add/remove links, select platforms
- Save and verify data persists

- [ ] **Step 5: Compile i18n and run checks**

Run: `bun run i18n:compile && bun check`
Expected: PASS (theme components may still have type errors if not yet updated)

- [ ] **Step 6: Commit**

```bash
git add src/features/config/components/social-links-editor.tsx src/features/config/components/site-settings-section.tsx messages/
git commit -m "feat: admin UI social links list editor"
```

---

### Task 4: Fuwari theme — render social links from array

**Files:**
- Modify: `src/features/theme/themes/fuwari/components/profile.tsx`

- [ ] **Step 1: Update profile.tsx to render from siteConfig.social array**

Replace the hardcoded social icons block (lines 33-59) with a loop:

```tsx
import { SOCIAL_PLATFORMS } from "@/features/config/utils/social-platforms";
import type { SocialPlatform } from "@/features/config/utils/social-platforms";

// Inside the component, replace the hardcoded icons with:
<div className="flex flex-wrap gap-2 justify-center">
  {siteConfig.social
    .filter((link) => link.url)
    .map((link, i) => {
      const preset = link.platform !== "custom"
        ? SOCIAL_PLATFORMS[link.platform]
        : null;
      const Icon = preset?.icon;
      const label = preset?.label ?? link.label ?? "";
      const href = link.platform === "email" && !link.url.startsWith("mailto:")
        ? `mailto:${link.url}`
        : link.url;

      return (
        <a
          key={`${link.platform}-${i}`}
          href={href}
          target={link.platform === "email" ? undefined : "_blank"}
          rel={link.platform === "email" ? undefined : "me noreferrer"}
          aria-label={label}
          className="fuwari-btn-regular rounded-lg h-10 w-10 active:scale-90 hover:text-(--fuwari-primary) transition-colors"
        >
          {Icon ? (
            <Icon size={20} strokeWidth={1.5} />
          ) : (
            <img src={link.icon} alt={label} className="w-5 h-5" />
          )}
        </a>
      );
    })}
</div>
```

Remove the old `Github, Mail, Rss` imports from lucide-react.

- [ ] **Step 2: Run dev server and verify fuwari profile**

Run: `bun dev` (with `THEME=fuwari`)
- Verify social icons render from config
- Verify empty URLs are filtered out
- Verify custom icons render as `<img>`

- [ ] **Step 3: Commit**

```bash
git add src/features/theme/themes/fuwari/components/profile.tsx
git commit -m "feat(theme/fuwari): render social links from configurable array"
```

---

### Task 5: Default theme — render social links from array

**Files:**
- Modify: `src/features/theme/themes/default/layouts/footer.tsx`
- Modify: Default theme hero section (check exact file path in `src/features/theme/themes/default/pages/home/`)

- [ ] **Step 1: Update default theme footer**

Replace hardcoded GitHub/Email text links with a loop over `siteConfig.social`, same pattern as fuwari but matching default theme's text-link styling.

- [ ] **Step 2: Update default theme hero section**

Add social icons to the hero section, rendering from `siteConfig.social` array.

- [ ] **Step 3: Run dev server and verify default theme**

Run: `bun dev` (with `THEME=default`)
- Verify footer social links render from config
- Verify hero section social links render

- [ ] **Step 4: Commit**

```bash
git add src/features/theme/themes/default/
git commit -m "feat(theme/default): render social links from configurable array"
```

---

### Task 6: Final verification and cleanup

**Files:**
- Possibly: unused i18n keys cleanup

- [ ] **Step 1: Run full check suite**

```bash
bun run i18n:compile
bun check
bun run test
```

Expected: All pass

- [ ] **Step 2: Clean up unused i18n keys**

Check if old social-specific i18n keys (`settings_site_field_github`, `settings_site_field_github_ph`, `settings_site_field_public_email`, `settings_site_field_public_email_ph`) are still referenced. If not, remove them.

- [ ] **Step 3: Manual E2E test**

- Start dev server, go to admin settings
- Add social links (GitHub, Twitter, custom with uploaded icon)
- Save, refresh, verify persistence
- Check frontend rendering in both themes
- Verify old config format (if you have one saved) migrates correctly

- [ ] **Step 4: Final commit if any cleanup was needed**

```bash
git add -A
git commit -m "chore: clean up unused social link i18n keys"
```
