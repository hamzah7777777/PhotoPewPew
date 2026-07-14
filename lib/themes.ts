export type ThemeId = "classic" | "midnight" | "sunset" | "forest";

export type Theme = {
  id: ThemeId;
  label: string;
  // Small preview square shown in the admin theme picker.
  swatch: string;
  // Full-page background for the display and join pages.
  page: string;
  title: string;
  subtitle: string;
  subtext: string;
  // Wrapper around the QR code — always a light surface so codes stay scannable.
  qrCard: string;
  qrFg: string;
  qrBg: string;
  // Brand/accent text (join page header).
  accent: string;
};

export const THEMES: Theme[] = [
  {
    id: "classic",
    label: "Classic",
    swatch: "bg-white",
    page: "bg-white",
    title: "text-neutral-900",
    subtitle: "text-neutral-500",
    subtext: "text-neutral-700",
    qrCard: "border border-neutral-200 bg-white shadow-lg",
    qrFg: "#171717",
    qrBg: "#ffffff",
    accent: "text-red-600",
  },
  {
    id: "midnight",
    label: "Midnight",
    swatch: "bg-neutral-950",
    page: "bg-neutral-950",
    title: "text-white",
    subtitle: "text-neutral-400",
    subtext: "text-neutral-300",
    qrCard: "bg-white shadow-[0_0_60px_rgba(255,255,255,0.2)]",
    qrFg: "#0a0a0a",
    qrBg: "#ffffff",
    accent: "text-sky-400",
  },
  {
    id: "sunset",
    label: "Sunset",
    swatch: "bg-gradient-to-br from-amber-200 to-rose-400",
    page: "bg-gradient-to-br from-amber-50 via-orange-100 to-rose-200",
    title: "text-rose-950",
    subtitle: "text-rose-800/70",
    subtext: "text-rose-900",
    qrCard: "bg-white shadow-xl shadow-rose-200",
    qrFg: "#4c0519",
    qrBg: "#ffffff",
    accent: "text-rose-700",
  },
  {
    id: "forest",
    label: "Forest",
    swatch: "bg-gradient-to-br from-emerald-200 to-teal-500",
    page: "bg-gradient-to-b from-emerald-50 to-teal-100",
    title: "text-emerald-950",
    subtitle: "text-emerald-800/70",
    subtext: "text-emerald-900",
    qrCard: "bg-white shadow-xl shadow-emerald-200",
    qrFg: "#022c22",
    qrBg: "#ffffff",
    accent: "text-emerald-700",
  },
];

export function getTheme(id: string | null | undefined): Theme {
  return THEMES.find((theme) => theme.id === id) ?? THEMES[0];
}
