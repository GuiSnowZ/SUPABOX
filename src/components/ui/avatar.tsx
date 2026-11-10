import { cn } from "@/lib/utils";
import type { Profile } from "@/types";

const sizes = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-16 w-16 text-xl",
  xl: "h-24 w-24 text-3xl sm:h-28 sm:w-28",
};

/** Generated initials avatar (prototype). Real uploads arrive with Supabase Storage. */
export function Avatar({
  profile,
  size = "md",
  className,
}: {
  profile: Pick<Profile, "displayName" | "avatarHue">;
  size?: keyof typeof sizes;
  className?: string;
}) {
  const initials = profile.displayName
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold ring-1 ring-white/10",
        sizes[size],
        className,
      )}
      style={{
        background: `linear-gradient(135deg, hsl(${profile.avatarHue} 45% 42%), hsl(${(profile.avatarHue + 40) % 360} 50% 26%))`,
        color: `hsl(${profile.avatarHue} 70% 92%)`,
      }}
    >
      {initials}
    </span>
  );
}
