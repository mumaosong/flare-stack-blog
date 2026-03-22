# Configurable Social Links

## Goal

Replace the hardcoded `social: { github, email }` in siteConfig with a dynamic, ordered array of social links. Users configure links from the admin settings page; themes render them in their own style.

## Data Model

### New `social` field

```typescript
// siteConfig.social becomes:
social: Array<{
  platform: SocialPlatform;  // preset key or "custom"
  url: string;               // link URL; email uses "mailto:" prefix
  icon?: string;             // R2 path, only for "custom"
  label?: string;            // tooltip text, only for "custom"
}>
```

Max 6 items. Validated by Zod schema with `.max(6)`.

### Preset platforms

| Key | Icon source | Auto-label |
|-----|------------|------------|
| `github` | lucide `Github` | GitHub |
| `twitter` | lucide `Twitter` | Twitter / X |
| `discord` | custom SVG (lucide has no Discord) | Discord |
| `bilibili` | custom SVG | Bilibili |
| `email` | lucide `Mail` | Email |
| `rss` | lucide `Rss` | RSS |
| `custom` | user-uploaded (R2 path) | user-provided |

Preset icons and labels are defined in a shared map (`SOCIAL_PLATFORMS`) consumed by both admin UI and themes.

### Schema location

`src/features/config/site-config.schema.ts` — extend `FullSiteConfigSchema.social` from object to array.

## Backward Compatibility

In `resolveSiteConfig()`, detect old format and convert:

```typescript
if (social && !Array.isArray(social)) {
  // Old format: { github?: string, email?: string }
  const migrated = [];
  if (social.github) migrated.push({ platform: "github", url: social.github });
  if (social.email) migrated.push({ platform: "email", url: `mailto:${social.email}` });
  return migrated;
}
```

No DB migration needed — JSON structure change handled at read time.

## Admin UI

### Settings > Site > Social Links

Replace the two text inputs with a dynamic list editor:

- Each row: platform dropdown | URL input | (if custom: icon upload + label input)
- Add button (disabled when 6 items reached)
- Delete button per row
- Drag handle for reordering (optional, can defer — array index = display order)

### Validation

- `url`: required, must be valid URL (or email for `email` platform)
- `icon`: required when platform is `custom`, R2 asset path
- `label`: required when platform is `custom`
- No duplicate platforms (except `custom` can appear multiple times)

## Theme Consumption

Themes read `siteConfig.social` array and render in order.

### Fuwari theme

**Profile component** (`src/features/theme/themes/fuwari/components/profile.tsx`):
- Replace hardcoded GitHub/Email/RSS icons with loop over `siteConfig.social`
- Preset platforms: render from `SOCIAL_PLATFORMS` icon map
- Custom: render `<img src={item.icon} />` with `alt={item.label}`
- RSS no longer hardcoded — only appears if user adds it

### Default theme

**Hero section** (`src/features/theme/themes/default/pages/home/`):
- Render social icons from `siteConfig.social`

**Footer** (`src/features/theme/themes/default/layouts/footer.tsx`):
- Replace hardcoded GitHub/Email text links with icons from `siteConfig.social`

### Shared icon resolver

A utility function in `src/features/config/utils/social-icons.tsx`:

```typescript
function getSocialIcon(platform: SocialPlatform): React.ComponentType | null
function getSocialLabel(platform: SocialPlatform): string
```

Both themes import from here. Custom platform returns `null` (theme renders `<img>` instead).

## blogConfig Default

Update `src/blog.config.ts` default social to:

```typescript
social: [
  { platform: "github", url: "" },
  { platform: "email", url: "" },
  { platform: "rss", url: "/rss.xml" },
]
```

Empty URLs are filtered out at render time (same as current behavior).

## Cache

No change — siteConfig already cached via `CONFIG_CACHE_KEYS.system`. Social links are part of the same JSON blob.

## Out of Scope

- Drag-and-drop reordering in admin UI (array order = display order, can reorder by delete + re-add)
- Animated icons
- Per-theme social link visibility toggle
