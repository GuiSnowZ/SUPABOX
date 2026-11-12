"use client";

import { Gamepad2, Glasses, Monitor, Smartphone } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useT } from "@/i18n/client";

/**
 * Compact platform markers (brand-coloured chips with a generic icon and a
 * short name). Official console logos are trademarks, so we don't draw them.
 */
const ICON = "h-3 w-3";
const NEUTRAL = "bg-white/8 text-fg/80 ring-white/15";
const SONY = "bg-[#0070d1]/20 text-[#7fb8ff] ring-[#0070d1]/40";
const XBOX = "bg-[#107c10]/20 text-[#7ed87e] ring-[#107c10]/40";
const NINTENDO = "bg-[#e60012]/15 text-[#ff8a8f] ring-[#e60012]/35";
const SEGA = "bg-[#1f6fd1]/15 text-[#8fb8f0] ring-[#1f6fd1]/35";

/** Short names; platforms that are regional twins share a label so they collapse into one chip. */
const SHORT: Record<string, string> = {
  "PlayStation 5": "PS5",
  "PlayStation 4": "PS4",
  "PlayStation 3": "PS3",
  "PlayStation 2": "PS2",
  PlayStation: "PS1",
  "PlayStation Portable": "PSP",
  "PlayStation Vita": "Vita",
  "Xbox Series X|S": "Xbox Series",
  "Xbox One": "Xbox One",
  "Xbox 360": "Xbox 360",
  Xbox: "Xbox",
  "Nintendo Switch 2": "Switch 2",
  "Nintendo Switch": "Switch",
  "Wii U": "Wii U",
  Wii: "Wii",
  "Nintendo GameCube": "GameCube",
  "Nintendo 64": "N64",
  "64DD": "N64",
  "Super Nintendo Entertainment System": "SNES",
  "Super Famicom": "SNES",
  "Nintendo Entertainment System": "NES",
  "Family Computer": "NES",
  "Family Computer Disk System": "NES",
  "Nintendo 3DS": "3DS",
  "New Nintendo 3DS": "3DS",
  "Nintendo DS": "DS",
  "Game Boy Advance": "GBA",
  "Game Boy Color": "GBC",
  "Game Boy": "Game Boy",
  "Sega Mega Drive/Genesis": "Genesis",
  "Sega Saturn": "Saturn",
  Dreamcast: "Dreamcast",
  "Sega Master System/Mark III": "Master System",
};

function familyOf(p: string): { key: string; label: string; icon: ReactNode; className: string } {
  const label = SHORT[p] ?? p;
  if (p.includes("VR") || p.startsWith("Meta Quest") || p.startsWith("Oculus") || p === "Windows Mixed Reality")
    return { key: "vr", label: "VR", icon: <Glasses className={ICON} />, className: NEUTRAL };
  if (/PlayStation/.test(p)) return { key: label, label, icon: <Gamepad2 className={ICON} />, className: SONY };
  if (/^Xbox/.test(p)) return { key: label, label, icon: <Gamepad2 className={ICON} />, className: XBOX };
  if (/Nintendo|Famicom|Game Boy|^Wii|64DD/.test(p)) return { key: label, label, icon: <Gamepad2 className={ICON} />, className: NINTENDO };
  if (/Sega|Dreamcast/.test(p)) return { key: label, label, icon: <Gamepad2 className={ICON} />, className: SEGA };
  if (["PC", "macOS", "Linux", "Browser", "DOS"].includes(p) || p.startsWith("PC-"))
    return { key: "pc", label: "PC", icon: <Monitor className={ICON} />, className: NEUTRAL };
  if (["iOS", "Android", "Windows Phone", "Legacy Mobile Device", "BlackBerry OS", "Windows Mobile"].includes(p))
    return { key: "mobile", label: "Mobile", icon: <Smartphone className={ICON} />, className: NEUTRAL };
  return { key: label, label, icon: <Gamepad2 className={ICON} />, className: NEUTRAL };
}

type Family = ReturnType<typeof familyOf>;

/** One chip per platform family (PC/Mac/Linux collapse to "PC", iOS/Android to "Mobile"). */
export function platformFamilies(platforms: string[]): Family[] {
  const seen = new Map<string, Family>();
  for (const p of platforms) {
    const fam = familyOf(p);
    if (!seen.has(fam.key)) seen.set(fam.key, fam);
  }
  return [...seen.values()];
}

export function PlatformBadges({ platforms, max = 4, className }: { platforms: string[]; max?: number; className?: string }) {
  const t = useT();
  const fams = platformFamilies(platforms);
  if (!fams.length) return null;
  const shown = fams.slice(0, max);
  return (
    <ul className={cn("flex flex-wrap gap-1", className)} aria-label={t.games.platforms(platforms.join(", "))}>
      {shown.map((f) => (
        <li
          key={f.key}
          className={cn("inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold ring-1 ring-inset", f.className)}
        >
          {f.icon}
          {f.label}
        </li>
      ))}
      {fams.length > max ? <li className="px-1 text-[10px] font-medium text-faint">+{fams.length - max}</li> : null}
    </ul>
  );
}
