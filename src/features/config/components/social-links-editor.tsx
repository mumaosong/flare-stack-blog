import { Plus, Trash2 } from "lucide-react";
import { useFieldArray, useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { AssetUploadField } from "@/features/config/components/asset-upload-field";
import type { SystemConfig } from "@/features/config/config.schema";
import {
  MAX_SOCIAL_LINKS,
  SOCIAL_PLATFORM_KEYS,
  SOCIAL_PLATFORMS,
} from "@/features/config/utils/social-platforms";
import { m } from "@/paraglide/messages";

export function SocialLinksEditor() {
  const { register, control, watch } = useFormContext<SystemConfig>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "site.social",
  });

  return (
    <div className="space-y-3">
      {fields.map((field, index) => {
        const platform = watch(`site.social.${index}.platform`);
        return (
          <div
            key={field.id}
            className="flex items-start gap-3 p-4 border border-border/30 rounded-lg bg-background/30"
          >
            <select
              {...register(`site.social.${index}.platform`)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm shrink-0"
            >
              {SOCIAL_PLATFORM_KEYS.map((key) => (
                <option key={key} value={key}>
                  {key === "custom"
                    ? m.settings_social_custom()
                    : SOCIAL_PLATFORMS[key].label}
                </option>
              ))}
            </select>

            <div className="flex-1 min-w-0">
              <Input
                {...register(`site.social.${index}.url`)}
                placeholder={m.settings_social_url_ph()}
              />
            </div>

            {platform === "custom" && (
              <>
                <div className="w-32 shrink-0">
                  <Input
                    {...register(`site.social.${index}.label`)}
                    placeholder={m.settings_social_label_ph()}
                  />
                </div>
                <div className="shrink-0">
                  <AssetUploadField
                    name={`site.social.${index}.icon`}
                    assetPath={`social/custom-${index}`}
                    accept=".svg,.png,.webp"
                    label={m.settings_social_icon()}
                  />
                </div>
              </>
            )}

            <button
              type="button"
              onClick={() => remove(index)}
              className="h-9 w-9 flex items-center justify-center shrink-0 text-muted-foreground hover:text-destructive transition-colors"
            >
              <Trash2 size={16} />
            </button>
          </div>
        );
      })}

      <button
        type="button"
        onClick={() => append({ platform: "github", url: "" })}
        disabled={fields.length >= MAX_SOCIAL_LINKS}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Plus size={16} />
        {fields.length >= MAX_SOCIAL_LINKS
          ? m.settings_social_max_reached({ max: MAX_SOCIAL_LINKS })
          : m.settings_social_add()}
      </button>
    </div>
  );
}
