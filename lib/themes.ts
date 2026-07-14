export type ThemeId =
  | "classic"
  | "midnight"
  | "sunset"
  | "forest"
  | "paper"
  | "ink"
  | "clay"
  | "sage"
  | "social";

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
  {
    // Warm ivory paper with ink type and a muted brick accent — editorial.
    id: "paper",
    label: "Paper",
    swatch: "bg-[#f1ead9]",
    page: "bg-[#f1ead9]",
    title: "text-[#2b2721]",
    subtitle: "text-[#6f6656]",
    subtext: "text-[#413b31]",
    qrCard: "bg-white shadow-md shadow-[#ddd2bc]",
    qrFg: "#2b2721",
    qrBg: "#ffffff",
    accent: "text-[#9a3b2c]",
  },
  {
    // Deep slate-navy (not pure black) with warm off-white and brass accent.
    id: "ink",
    label: "Ink",
    swatch: "bg-[#1b2231]",
    page: "bg-[#1b2231]",
    title: "text-[#f2efe7]",
    subtitle: "text-[#98a0af]",
    subtext: "text-[#c9cdd6]",
    qrCard: "bg-white shadow-2xl",
    qrFg: "#1b2231",
    qrBg: "#ffffff",
    accent: "text-[#c6a15b]",
  },
  {
    // Earthy terracotta / putty — warm and muted, no gradient.
    id: "clay",
    label: "Clay",
    swatch: "bg-[#c07a5b]",
    page: "bg-[#e7d7c8]",
    title: "text-[#48291d]",
    subtitle: "text-[#8a6553]",
    subtext: "text-[#5e3b2c]",
    qrCard: "bg-white shadow-lg shadow-[#d2b6a2]",
    qrFg: "#48291d",
    qrBg: "#ffffff",
    accent: "text-[#a24b32]",
  },
  {
    // Calm desaturated sage — soft green-grey, restrained.
    id: "sage",
    label: "Sage",
    swatch: "bg-[#8b9a80]",
    page: "bg-[#dee3d6]",
    title: "text-[#2c3327]",
    subtitle: "text-[#6a7160]",
    subtext: "text-[#434b3b]",
    qrCard: "bg-white shadow-lg shadow-[#c3ccb6]",
    qrFg: "#2c3327",
    qrBg: "#ffffff",
    accent: "text-[#586b4c]",
  },
  {
    // Renders the display page as a social-media post (see SocialPost in
    // app/display/page.tsx). Tokens below are used by the join page.
    id: "social",
    label: "Social",
    swatch: "bg-gradient-to-tr from-amber-400 via-rose-500 to-fuchsia-600",
    page: "bg-[#fafafa]",
    title: "text-neutral-900",
    subtitle: "text-neutral-500",
    subtext: "text-neutral-700",
    qrCard: "border border-neutral-200 bg-white shadow-sm",
    qrFg: "#171717",
    qrBg: "#ffffff",
    accent: "text-rose-500",
  },
];

export function getTheme(id: string | null | undefined): Theme {
  return THEMES.find((theme) => theme.id === id) ?? THEMES[0];
}
